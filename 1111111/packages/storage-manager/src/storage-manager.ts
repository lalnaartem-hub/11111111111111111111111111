import { openDB, type IDBPDatabase } from 'idb';
import type {
  ISystemComponent,
  IStorageManager,
  StorageQuota,
} from '@browser-os/types';

const DB_NAME = 'browser-os-config';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const MAX_RETRIES = 3;

type ConfigDB = {
  kv: {
    key: string;
    value: unknown;
  };
};

export class StorageManager implements IStorageManager, ISystemComponent {
  readonly name = 'storage';

  private db: IDBPDatabase<ConfigDB> | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<ConfigDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      },
    });
  }

  async shutdown(): Promise<void> {
    this.db?.close();
    this.db = null;
  }

  private ensureDb(): IDBPDatabase<ConfigDB> {
    if (!this.db) {
      throw new Error('StorageManager is not initialized');
    }
    return this.db;
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
        }
      }
    }
    throw lastError;
  }

  async set(key: string, value: unknown): Promise<void> {
    const db = this.ensureDb();
    await this.withRetry(() =>
      db.put(STORE_NAME, { key, value })
    );
  }

  async get(key: string): Promise<unknown> {
    const db = this.ensureDb();
    const record = await this.withRetry(() => db.get(STORE_NAME, key));
    return (record as { value: unknown } | undefined)?.value;
  }

  async delete(key: string): Promise<void> {
    const db = this.ensureDb();
    await this.withRetry(() => db.delete(STORE_NAME, key));
  }

  async clear(): Promise<void> {
    const db = this.ensureDb();
    await this.withRetry(() => db.clear(STORE_NAME));
  }

  async setBatch(entries: [string, unknown][]): Promise<void> {
    const db = this.ensureDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(entries.map(([key, value]) => tx.store.put({ key, value })));
    await tx.done;
  }

  async getBatch(keys: string[]): Promise<unknown[]> {
    const db = this.ensureDb();
    const results = await Promise.all(
      keys.map(async (key) => {
        const record = await db.get(STORE_NAME, key);
        return (record as { value: unknown } | undefined)?.value;
      })
    );
    return results;
  }

  async getQuota(): Promise<StorageQuota> {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return {
        usage,
        quota,
        available: Math.max(0, quota - usage),
      };
    }
    return { usage: 0, quota: 0, available: 0 };
  }

  async persist(): Promise<boolean> {
    if (navigator.storage?.persist) {
      return navigator.storage.persist();
    }
    return false;
  }
}
