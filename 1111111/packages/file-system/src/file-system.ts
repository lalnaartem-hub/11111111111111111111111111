import { openDB, type IDBPDatabase } from 'idb';
import type {
  FileEntry,
  FilePermissions,
  FileStats,
  FileWatchCallback,
  FileWatchEvent,
  IFileSystem,
  ISystemComponent,
  WatchHandle,
} from '@browser-os/types';
import { LRUCache } from './cache';
import {
  basename,
  DEFAULT_PERMISSIONS,
  dirname,
  joinPath,
  normalizePath,
  validatePath,
} from './path-utils';

const DB_NAME = 'browser-os-fs';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const CACHE_MAX_BYTES = 100 * 1024 * 1024;

/** Минимальная DOS-программа «Hello!» для эмулятора */
const HELLO_COM_DOS = new Uint8Array([
  0xb4, 0x09, 0xba, 0x0e, 0x01, 0xcd, 0x21, 0xb4, 0x4c, 0xcd, 0x21, 0x48, 0x65, 0x6c, 0x6c,
  0x6f, 0x21, 0x24,
]);
const SYNC_DEBOUNCE_MS = 1000;

export interface FileRecord {
  path: string;
  name: string;
  type: 'file' | 'directory';
  parentPath: string;
  data?: Uint8Array;
  size: number;
  createdAt: number;
  modifiedAt: number;
  accessedAt: number;
  permissions: FilePermissions;
}

type FSDB = {
  files: FileRecord;
};

export class FileSystem implements IFileSystem, ISystemComponent {
  readonly name = 'file-system';

  private db: IDBPDatabase<FSDB> | null = null;
  private readonly fileCache = new LRUCache<Uint8Array>(CACHE_MAX_BYTES);
  private readonly dirCache = new LRUCache<FileEntry[]>(10 * 1024 * 1024);
  private readonly statCache = new LRUCache<FileStats>(5 * 1024 * 1024);
  private readonly watchers = new Map<string, Set<FileWatchCallback>>();
  private readonly watchHandles = new Map<string, { path: string; callback: FileWatchCallback }>();
  private readonly pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly pendingRecords = new Map<string, FileRecord>();
  async initialize(): Promise<void> {
    this.db = await openDB<FSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          store.createIndex('parentPath', 'parentPath');
          store.createIndex('type', 'type');
        }
      },
    });

    await this.ensureDefaultStructure();
  }

  async shutdown(): Promise<void> {
    for (const timer of this.pendingWrites.values()) {
      clearTimeout(timer);
    }
    this.pendingWrites.clear();
    await this.flushPendingWrites();
    this.db?.close();
    this.db = null;
  }

  private ensureDb(): IDBPDatabase<FSDB> {
    if (!this.db) throw new Error('FileSystem is not initialized');
    return this.db;
  }

  private async ensureDefaultStructure(): Promise<void> {
    const dirs = ['/', '/home', '/apps', '/system', '/usr', '/usr/bin', '/etc', '/var', '/tmp'];
    for (const dir of dirs) {
      if (!(await this.exists(dir))) {
        if (dir === '/') {
          await this.putRecord(this.createDirRecord('/'));
        } else {
          await this.createDir(dir);
        }
      }
    }

    const readmePath = '/home/README.txt';
    if (!(await this.exists(readmePath))) {
      const text = new TextEncoder().encode(
        'Добро пожаловать в Browser OS!\n\nЭто виртуальная файловая система в IndexedDB.\n'
      );
      await this.writeFile(readmePath, text);
    }

    const notesPath = '/home/notes.txt';
    if (!(await this.exists(notesPath))) {
      await this.writeFile(
        notesPath,
        new TextEncoder().encode('# Заметки\n\nРедактируйте в приложении «Редактор».\n')
      );
    }

    const helloPath = '/home/HELLO.COM';
    if (!(await this.exists(helloPath))) {
      await this.writeFile(helloPath, HELLO_COM_DOS);
    }
  }

  private createDirRecord(path: string): FileRecord {
    const normalized = normalizePath(path);
    const now = Date.now();
    return {
      path: normalized,
      name: normalized === '/' ? '' : basename(normalized),
      type: 'directory',
      parentPath: dirname(normalized),
      size: 0,
      createdAt: now,
      modifiedAt: now,
      accessedAt: now,
      permissions: { ...DEFAULT_PERMISSIONS },
    };
  }

  private async putRecord(record: FileRecord): Promise<void> {
    const db = this.ensureDb();
    await db.put(STORE_NAME, record);
    this.invalidateCachesFor(record.path, record.parentPath);
  }

  private invalidateCachesFor(path: string, parentPath?: string): void {
    this.fileCache.delete(path);
    this.statCache.delete(path);
    const parent = parentPath ?? dirname(path);
    this.dirCache.delete(parent);
    if (parent !== '/') this.dirCache.delete('/');
  }

  private async getRecord(path: string): Promise<FileRecord | undefined> {
    const normalized = normalizePath(path);
    const db = this.ensureDb();
    return db.get(STORE_NAME, normalized);
  }

  private recordToEntry(record: FileRecord): FileEntry {
    return {
      name: record.name || (record.path === '/' ? '/' : basename(record.path)),
      path: record.path,
      type: record.type,
      size: record.size,
      createdAt: new Date(record.createdAt),
      modifiedAt: new Date(record.modifiedAt),
      permissions: record.permissions,
    };
  }

  private recordToStats(record: FileRecord): FileStats {
    return {
      size: record.size,
      createdAt: new Date(record.createdAt),
      modifiedAt: new Date(record.modifiedAt),
      accessedAt: new Date(record.accessedAt),
      permissions: record.permissions,
      isDirectory: record.type === 'directory',
      isFile: record.type === 'file',
    };
  }

  private emitWatch(event: FileWatchEvent): void {
    const normalized = normalizePath(event.path);
    const callbacks = new Set<FileWatchCallback>();
    this.watchers.forEach((set, watchedPath) => {
      if (normalized === watchedPath || normalized.startsWith(`${watchedPath}/`)) {
        set.forEach((cb) => callbacks.add(cb));
      }
    });
    callbacks.forEach((cb) => cb(event));
  }

  private schedulePersist(record: FileRecord): void {
    this.pendingRecords.set(record.path, record);
    const existing = this.pendingWrites.get(record.path);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.pendingWrites.delete(record.path);
      const pending = this.pendingRecords.get(record.path);
      if (pending) {
        this.pendingRecords.delete(record.path);
        void this.putRecord(pending);
      }
    }, SYNC_DEBOUNCE_MS);

    this.pendingWrites.set(record.path, timer);
  }

  private async flushPendingWrites(): Promise<void> {
    for (const timer of this.pendingWrites.values()) clearTimeout(timer);
    this.pendingWrites.clear();
    for (const record of this.pendingRecords.values()) {
      await this.putRecord(record);
    }
    this.pendingRecords.clear();
  }

  async exists(path: string): Promise<boolean> {
    validatePath(path);
    const record = await this.getRecord(path);
    return !!record;
  }

  async stat(path: string): Promise<FileStats> {
    validatePath(path);
    const normalized = normalizePath(path);
    const cached = this.statCache.get(normalized);
    if (cached) return cached;

    const record = await this.getRecord(normalized);
    if (!record) throw new Error(`ENOENT: no such file or directory: ${normalized}`);

    const stats = this.recordToStats(record);
    this.statCache.set(normalized, stats, 256);
    return stats;
  }

  async readDir(path: string): Promise<FileEntry[]> {
    validatePath(path);
    const normalized = normalizePath(path);
    const cached = this.dirCache.get(normalized);
    if (cached) return cached;

    if (!(await this.exists(normalized))) {
      throw new Error(`ENOENT: no such file or directory: ${normalized}`);
    }

    const db = this.ensureDb();
    const records = await db.getAllFromIndex(STORE_NAME, 'parentPath', normalized);
    const entries = records
      .filter((r) => r.path !== normalized)
      .map((r) => this.recordToEntry(r))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.dirCache.set(normalized, entries, JSON.stringify(entries).length);
    return entries;
  }

  async createDir(path: string): Promise<void> {
    validatePath(path);
    const normalized = normalizePath(path);
    if (normalized === '/') return;
    if (await this.exists(normalized)) {
      throw new Error(`EEXIST: directory already exists: ${normalized}`);
    }

    const parent = dirname(normalized);
    if (!(await this.exists(parent))) {
      throw new Error(`ENOENT: parent directory does not exist: ${parent}`);
    }

    const record = this.createDirRecord(normalized);
    record.name = basename(normalized);
    await this.putRecord(record);
    this.emitWatch({ type: 'created', path: normalized, timestamp: Date.now() });
  }

  async deleteDir(path: string, recursive = false): Promise<void> {
    validatePath(path);
    const normalized = normalizePath(path);
    if (normalized === '/') throw new Error('Cannot delete root directory');

    const record = await this.getRecord(normalized);
    if (!record || record.type !== 'directory') {
      throw new Error(`ENOENT: not a directory: ${normalized}`);
    }

    const children = await this.readDir(normalized);
    if (children.length > 0 && !recursive) {
      throw new Error(`ENOTEMPTY: directory not empty: ${normalized}`);
    }

    if (recursive) {
      for (const child of children) {
        if (child.type === 'directory') {
          await this.deleteDir(child.path, true);
        } else {
          await this.deleteFile(child.path);
        }
      }
    }

    const db = this.ensureDb();
    await db.delete(STORE_NAME, normalized);
    this.invalidateCachesFor(normalized, record.parentPath);
    this.emitWatch({ type: 'deleted', path: normalized, timestamp: Date.now() });
  }

  async readFile(path: string): Promise<Uint8Array> {
    validatePath(path);
    const normalized = normalizePath(path);

    const pending = this.pendingRecords.get(normalized);
    if (pending?.data && pending.data.byteLength > 0) {
      return pending.data;
    }

    const cached = this.fileCache.get(normalized);
    if (cached && cached.byteLength > 0) return cached;

    const record = await this.getRecord(normalized);
    if (!record || record.type !== 'file') {
      throw new Error(`ENOENT: not a file: ${normalized}`);
    }

    const data = record.data ?? new Uint8Array();
    if (data.byteLength === 0 && record.size > 0) {
      throw new Error(
        `Файл повреждён или не догрузился (${record.size} байт в каталоге). Загрузите снова через «Файлы».`
      );
    }
    this.fileCache.set(normalized, data, data.byteLength);
    return data;
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    validatePath(path);
    const normalized = normalizePath(path);
    const parent = dirname(normalized);
    if (!(await this.exists(parent))) {
      throw new Error(`ENOENT: parent directory does not exist: ${parent}`);
    }

    const now = Date.now();
    const existing = await this.getRecord(normalized);
    const record: FileRecord = {
      path: normalized,
      name: basename(normalized),
      type: 'file',
      parentPath: parent,
      data,
      size: data.byteLength,
      createdAt: existing?.createdAt ?? now,
      modifiedAt: now,
      accessedAt: now,
      permissions: existing?.permissions ?? { ...DEFAULT_PERMISSIONS },
    };

    this.fileCache.set(normalized, data, data.byteLength);
    this.invalidateCachesFor(normalized, parent);
    this.pendingRecords.delete(normalized);
    const pendingTimer = this.pendingWrites.get(normalized);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.pendingWrites.delete(normalized);
    }
    await this.putRecord(record);
    this.emitWatch({ type: existing ? 'modified' : 'created', path: normalized, timestamp: now });
  }

  async deleteFile(path: string): Promise<void> {
    validatePath(path);
    const normalized = normalizePath(path);
    const record = await this.getRecord(normalized);
    if (!record || record.type !== 'file') {
      throw new Error(`ENOENT: not a file: ${normalized}`);
    }

    const db = this.ensureDb();
    await db.delete(STORE_NAME, normalized);
    this.invalidateCachesFor(normalized, record.parentPath);
    this.emitWatch({ type: 'deleted', path: normalized, timestamp: Date.now() });
  }

  async chmod(path: string, mode: number): Promise<void> {
    validatePath(path);
    const normalized = normalizePath(path);
    const record = await this.getRecord(normalized);
    if (!record) throw new Error(`ENOENT: ${normalized}`);

    record.permissions = {
      read: (mode & 0o444) !== 0,
      write: (mode & 0o222) !== 0,
      execute: (mode & 0o111) !== 0,
    };
    record.modifiedAt = Date.now();
    await this.putRecord(record);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await this.move(oldPath, newPath);
  }

  async copy(srcPath: string, destPath: string): Promise<void> {
    validatePath(srcPath);
    validatePath(destPath);
    const src = normalizePath(srcPath);
    const dest = normalizePath(destPath);
    const record = await this.getRecord(src);
    if (!record) throw new Error(`ENOENT: ${src}`);

    if (record.type === 'file') {
      const data = await this.readFile(src);
      await this.writeFile(dest, data);
      return;
    }

    await this.createDir(dest);
    const children = await this.readDir(src);
    for (const child of children) {
      const childDest = joinPath(dest, child.name);
      await this.copy(child.path, childDest);
    }
  }

  async move(srcPath: string, destPath: string): Promise<void> {
    validatePath(srcPath);
    validatePath(destPath);
    const src = normalizePath(srcPath);
    const dest = normalizePath(destPath);

    if (src === dest) return;
    if (await this.exists(dest)) {
      throw new Error(`EEXIST: destination exists: ${dest}`);
    }

    const record = await this.getRecord(src);
    if (!record) throw new Error(`ENOENT: ${src}`);

    const destParent = dirname(dest);
    if (!(await this.exists(destParent))) {
      throw new Error(`ENOENT: parent does not exist: ${destParent}`);
    }

    const db = this.ensureDb();
    const updated: FileRecord = {
      ...record,
      path: dest,
      name: basename(dest) || record.name,
      parentPath: destParent,
      modifiedAt: Date.now(),
    };

    if (record.type === 'directory') {
      const children = await this.readDir(src);
      await db.put(STORE_NAME, updated);
      await db.delete(STORE_NAME, src);
      for (const child of children) {
        const childDest = joinPath(dest, child.name);
        await this.move(child.path, childDest);
      }
    } else {
      await db.put(STORE_NAME, updated);
      await db.delete(STORE_NAME, src);
    }

    this.invalidateCachesFor(src, record.parentPath);
    this.invalidateCachesFor(dest, destParent);
    this.emitWatch({
      type: 'renamed',
      path: src,
      newPath: dest,
      timestamp: Date.now(),
    });
  }

  async importFile(file: File, destPath: string): Promise<void> {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const path =
      destPath.endsWith('/') ? joinPath(destPath, file.name) : normalizePath(destPath);
    await this.writeFile(path, buffer);
  }

  async exportFile(path: string): Promise<Blob> {
    const data = await this.readFile(path);
    const record = await this.getRecord(normalizePath(path));
    const mime = record?.name.endsWith('.txt') ? 'text/plain' : 'application/octet-stream';
    return new Blob([new Uint8Array(data)], { type: mime });
  }

  watch(path: string, callback: FileWatchCallback): WatchHandle {
    const normalized = normalizePath(path);
    let set = this.watchers.get(normalized);
    if (!set) {
      set = new Set();
      this.watchers.set(normalized, set);
    }
    set.add(callback);
    const id = crypto.randomUUID();
    this.watchHandles.set(id, { path: normalized, callback });
    return { id, path: normalized };
  }

  unwatch(handle: WatchHandle): void {
    const entry = this.watchHandles.get(handle.id);
    if (!entry) return;
    this.watchHandles.delete(handle.id);
    const set = this.watchers.get(entry.path);
    set?.delete(entry.callback);
    if (set?.size === 0) this.watchers.delete(entry.path);
  }
}
