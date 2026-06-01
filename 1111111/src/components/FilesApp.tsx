import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileEntry, IFileSystem } from '@browser-os/types';
import { useSystemStore } from '../store/system';
import { isExecutableFile, launchExecutableFromPath } from '../services/launcher';
import { FileTypeIcon } from './FileTypeIcon';
const QUICK_PATHS: { label: string; path: string }[] = [
  { label: 'Домашняя', path: '/home' },
  { label: 'Приложения', path: '/apps' },
  { label: 'Система', path: '/system' },
  { label: 'Корень', path: '/' },
];

export function FilesApp() {
  const kernel = useSystemStore((s) => s.kernel);
  const osMode = useSystemStore((s) => s.settings.osMode);
  const shellTheme = useSystemStore((s) => s.settings.theme);
  const [path, setPath] = useState('/home');
  const [history, setHistory] = useState<string[]>(['/home']);
  const [histIdx, setHistIdx] = useState(0);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'grid'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDir = useCallback(async () => {
    if (!kernel) return;
    const fs = kernel.getComponent<IFileSystem>('file-system');
    try {
      setError(null);
      const list = await fs.readDir(path);
      list.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [kernel, path]);

  useEffect(() => {
    void loadDir();
  }, [loadDir]);

  const navigate = (next: string) => {
    setPath(next);
    setHistory((h) => [...h.slice(0, histIdx + 1), next]);
    setHistIdx((i) => i + 1);
    setSelected(new Set());
  };

  const goBack = () => {
    if (histIdx <= 0) return;
    const i = histIdx - 1;
    setHistIdx(i);
    setPath(history[i]);
    setSelected(new Set());
  };

  const goForward = () => {
    if (histIdx >= history.length - 1) return;
    const i = histIdx + 1;
    setHistIdx(i);
    setPath(history[i]);
    setSelected(new Set());
  };

  const goUp = () => {
    if (path === '/') return;
    const parent = path.replace(/\/[^/]+$/, '') || '/';
    navigate(parent);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !kernel) return;
    const fs = kernel.getComponent<IFileSystem>('file-system');
    for (const file of Array.from(files)) {
      await fs.importFile(file, path.endsWith('/') ? path : `${path}/${file.name}`);
    }
    void loadDir();
  };

  const deleteSelected = async () => {
    if (!kernel || !confirm('Удалить выбранное?')) return;
    const fs = kernel.getComponent<IFileSystem>('file-system');
    for (const p of selected) {
      const entry = entries.find((e) => e.path === p);
      if (!entry) continue;
      if (entry.type === 'directory') await fs.deleteDir(p, true);
      else await fs.deleteFile(p);
    }
    setSelected(new Set());
    void loadDir();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        void loadDir();
      }
      if (e.key === 'Delete' && selected.size > 0) {
        e.preventDefault();
        void deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loadDir, selected, kernel, entries]);

  const parts = path === '/' ? [] : path.split('/').filter(Boolean);
  const isLinux = osMode === 'linux';
  const isDark = isLinux || shellTheme === 'dark';

  return (
    <div
      className={`files-app flex h-full min-h-[280px] text-sm ${
        isDark ? 'bg-[#1a1a1e] text-gray-200' : 'bg-[#f5f5f7] text-gray-900'
      }`}
    >
      <aside
        className={`w-40 shrink-0 border-r p-2 space-y-0.5 ${
          isDark ? 'border-[#367bf0]/20 bg-[#26262b]' : 'border-gray-200/80 bg-white/60'
        }`}
      >
        <p className="text-[10px] font-semibold text-gray-500 uppercase px-2 mb-2">
          {isLinux ? 'Kali — каталоги' : 'Избранное'}
        </p>
        {QUICK_PATHS.map((q) => (
          <button
            key={q.path}
            type="button"
            onClick={() => navigate(q.path)}
            className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
              path === q.path
                ? isLinux
                  ? 'bg-[#367bf0]/20 text-[#367bf0]'
                  : 'bg-[#007aff]/12 text-[#007aff]'
                : isDark
                  ? 'hover:bg-white/5 text-gray-300'
                  : 'hover:bg-black/5 text-gray-700'
            }`}
          >
            <FileTypeIcon name="" isDirectory size={16} />
            {q.label}
          </button>
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className={`flex flex-wrap gap-1 px-2 py-1.5 border-b items-center ${
            isDark ? 'border-[#367bf0]/20 bg-[#2d2d32]' : 'border-gray-200/80'
          }`}
        >
          <button type="button" className="toolbar-btn" onClick={goBack} title="Назад">
            ←
          </button>
          <button type="button" className="toolbar-btn" onClick={goForward} title="Вперёд">
            →
          </button>
          <button type="button" className="toolbar-btn" onClick={goUp} title="Вверх">
            ↑
          </button>
          <button type="button" className="toolbar-btn" onClick={() => void loadDir()} title="F5">
            ↻
          </button>
          <div
            className={`flex-1 min-w-[120px] mx-1 px-2 py-1 rounded border text-xs font-mono truncate ${
              isDark ? 'border-white/10 bg-[#1a1a1e]' : 'border-gray-200 bg-white'
            }`}
          >
            {path}
          </div>
          <button type="button" className="toolbar-btn" onClick={() => setView(view === 'list' ? 'grid' : 'list')}>
            {view === 'list' ? '▦' : '☰'}
          </button>
          <button type="button" className="toolbar-btn-primary" onClick={() => fileInputRef.current?.click()}>
            Загрузить
          </button>
          <button
            type="button"
            className="toolbar-btn"
            disabled={selected.size === 0}
            onClick={() => void deleteSelected()}
          >
            Удалить
          </button>
          <button
            type="button"
            className="toolbar-btn-accent"
            disabled={selected.size !== 1 || !isExecutableSelected(entries, selected)}
            onClick={() => {
              const p = [...selected][0];
              if (p) void launchExecutableFromPath(p);
            }}
          >
            Запустить
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
        </div>

        <nav className="flex flex-wrap gap-1 px-2 py-1 text-xs border-b border-gray-100">
          <button type="button" className="path-link" onClick={() => navigate('/')}>
            {isLinux ? 'Файловая система' : 'Корень'}
          </button>
          {parts.map((part, i) => {
            const sub = '/' + parts.slice(0, i + 1).join('/');
            return (
              <span key={sub} className="flex items-center gap-1 text-gray-400">
                ›
                <button type="button" className="path-link" onClick={() => navigate(sub)}>
                  {part}
                </button>
              </span>
            );
          })}
        </nav>

        {error && <p className="p-2 text-red-600 text-xs">{error}</p>}

        <ul
          className={`flex-1 overflow-auto p-2 ${
            view === 'grid' ? 'grid grid-cols-4 sm:grid-cols-5 gap-2 content-start' : 'space-y-0.5'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void uploadFiles(e.dataTransfer.files);
          }}
        >
          {entries.map((entry) => (
            <li key={entry.path} className={view === 'grid' ? '' : ''}>
              <button
                type="button"
                className={
                  view === 'grid'
                    ? `flex flex-col items-center p-2 rounded-lg w-full text-center ${
                        selected.has(entry.path) ? 'bg-[#007aff]/15 ring-2 ring-[#007aff]/40' : 'hover:bg-black/5'
                      }`
                    : `w-full text-left px-2 py-1.5 rounded-lg flex gap-2 items-center ${
                        selected.has(entry.path) ? 'bg-[#007aff]/15' : 'hover:bg-[#007aff]/8'
                      }`
                }
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    const next = new Set(selected);
                    if (next.has(entry.path)) next.delete(entry.path);
                    else next.add(entry.path);
                    setSelected(next);
                  } else if (entry.type === 'directory') {
                    navigate(entry.path);
                  } else {
                    setSelected(new Set([entry.path]));
                  }
                }}
                onDoubleClick={() => {
                  if (entry.type === 'directory') navigate(entry.path);
                  else if (isExecutableFile(entry.name)) void launchExecutableFromPath(entry.path);
                }}
              >
                <FileTypeIcon
                  name={entry.name}
                  isDirectory={entry.type === 'directory'}
                  size={view === 'grid' ? 40 : 22}
                />
                <span className={view === 'grid' ? 'text-[11px] mt-1 truncate w-full' : 'truncate flex-1'}>
                  {entry.name}
                </span>
                {view === 'list' && entry.type === 'file' && (
                  <span className="text-gray-400 text-xs tabular-nums">{formatSize(entry.size)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <footer className="px-3 py-1 text-[10px] text-gray-500 border-t border-gray-100">
          {entries.length} элементов · {selected.size} выбрано
        </footer>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExecutableSelected(entries: FileEntry[], selected: Set<string>): boolean {
  const p = [...selected][0];
  const entry = entries.find((e) => e.path === p);
  return entry?.type === 'file' && isExecutableFile(entry.name);
}
