import { useEffect, useRef, useState } from 'react';
import { V86Runtime, loadFileBytes, type BootProfile } from '@browser-os/emulator';
import { useSystemStore } from '../store/system';
import type { IFileSystem } from '@browser-os/types';

interface EmulatorAppProps {
  initialFile?: { name: string; path?: string; data?: Uint8Array };
}

export function EmulatorApp({ initialFile }: EmulatorAppProps) {
  const kernel = useSystemStore((s) => s.kernel);
  const settings = useSystemStore((s) => s.settings);
  const showNotification = useSystemStore((s) => s.showNotification);
  const screenRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<V86Runtime | null>(null);
  const [status, setStatus] = useState('Выберите режим и нажмите «Запустить»');
  const [loading, setLoading] = useState(false);
  const [bootProfile, setBootProfile] = useState<BootProfile>('freedos');
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    data: Uint8Array;
    kind: 'dos' | 'com' | 'pe';
  } | null>(null);

  useEffect(() => {
    const rt = new V86Runtime();
    runtimeRef.current = rt;
    const unsub = rt.onStatus((s, msg) => {
      if (msg) setStatus(msg);
      else if (s === 'loading') setStatus('Загрузка эмулятора…');
      else if (s === 'running') setStatus('Эмулятор работает');
      else if (s === 'idle') setStatus('Остановлен');
    });
    return () => {
      unsub();
      rt.destroy();
    };
  }, []);

  const applyFile = (name: string, data: Uint8Array) => {
    const info = V86Runtime.analyzeFile(data, name);
    if (!info.runnable) {
      showNotification({ title: 'Не поддерживается', message: info.message, duration: 6000 });
      return;
    }
    const kind = info.kind === 'pe' ? 'pe' : info.kind === 'dos' ? 'dos' : 'com';
    setPendingFile({ name, data, kind });
    if (kind === 'pe') setBootProfile('win98');
    else setBootProfile('freedos');
    showNotification({ title: 'Файл готов', message: info.message, duration: 7000 });
  };

  useEffect(() => {
    if (!initialFile?.data && !initialFile?.path) return;
    void (async () => {
      if (initialFile.data) {
        applyFile(initialFile.name, initialFile.data);
        return;
      }
      if (initialFile.path && kernel) {
        const fs = kernel.getComponent<IFileSystem>('file-system');
        const data = await fs.readFile(initialFile.path);
        applyFile(initialFile.name, data);
      }
    })();
  }, [initialFile, kernel]);

  const start = async () => {
    if (!screenRef.current || !runtimeRef.current) return;
    const profile = pendingFile?.kind === 'pe' ? 'win98' : bootProfile;
    const mem =
      profile === 'win98'
        ? Math.max(settings.emulatorMemoryMB, 128)
        : settings.emulatorMemoryMB;

    setLoading(true);
    try {
      await runtimeRef.current.start({
        screenContainer: screenRef.current,
        memoryMB: mem,
        bootProfile: profile,
        floppyFile: pendingFile
          ? { name: pendingFile.name, data: pendingFile.data, kind: pendingFile.kind }
          : undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('Ошибка: ' + msg);
      showNotification({ title: 'Эмулятор', message: msg, duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    const data = await loadFileBytes(file);
    applyFile(file.name, data);
  };

  return (
    <div className="flex flex-col h-full min-h-[320px] bg-[#0a0a0f] text-gray-200">
      <div className="flex flex-wrap gap-2 p-2 border-b border-white/10 bg-black/40 shrink-0 items-center">
        <select
          value={bootProfile}
          onChange={(e) => setBootProfile(e.target.value as BootProfile)}
          className="px-2 py-1.5 rounded-lg bg-white/10 text-xs border border-white/20"
          disabled={pendingFile?.kind === 'pe'}
        >
          <option value="freedos">FreeDOS (DOS .com / MZ)</option>
          <option value="win98">Windows 98 (PE .exe)</option>
        </select>
        <button
          type="button"
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#007aff] text-white text-xs font-medium hover:bg-[#0066d6] disabled:opacity-50"
          onClick={() => void start()}
        >
          {loading ? 'Загрузка…' : pendingFile ? 'Запустить с файлом' : 'Запустить'}
        </button>
        <label className="px-3 py-1.5 rounded-lg bg-white/10 text-xs cursor-pointer hover:bg-white/15">
          .exe / .com
          <input
            type="file"
            accept=".exe,.com,.bat,.bin"
            className="hidden"
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs hover:bg-white/15"
          onClick={() => runtimeRef.current?.destroy()}
        >
          Стоп
        </button>
        {pendingFile && (
          <span className="text-xs text-emerald-400 truncate max-w-[200px]">
            {pendingFile.kind === 'pe' ? 'PE' : 'DOS'}: {pendingFile.name}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 px-3 py-1 shrink-0">{status}</p>
      <div
        ref={screenRef}
        className="flex-1 m-2 rounded-lg overflow-hidden border border-white/10 bg-black min-h-[200px] [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:object-contain"
        tabIndex={0}
        onMouseDown={() => screenRef.current?.focus()}
      />
      <p className="text-[10px] text-gray-600 px-3 pb-2 shrink-0 leading-relaxed">
        DOS: FreeDOS + диск A:. Windows PE: эмулятор Windows 98 (v86, ~300 МБ с i.copy.sh). После
        загрузки Win98 откройте «Мой компьютер» → «Дисковод A:» → двойной клик по .exe. Нужен
        интернет и <code className="text-gray-500">npm run setup:v86</code>.
      </p>
    </div>
  );
}
