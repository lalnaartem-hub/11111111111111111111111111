import { openApp } from '../bootstrap';
import type { AppId } from '../store/system';
import { V86Runtime } from '@browser-os/emulator';
import type { IFileSystem } from '@browser-os/types';
import { useSystemStore } from '../store/system';

const EXEC_EXT = /\.(exe|com|bat|bin)$/i;

export function isExecutableFile(name: string): boolean {
  return EXEC_EXT.test(name);
}

export async function launchExecutableFromPath(path: string): Promise<void> {
  const kernel = useSystemStore.getState().kernel;
  if (!kernel) return;

  const name = path.split('/').pop() ?? 'program.exe';
  const fs = kernel.getComponent<IFileSystem>('file-system');

  let data: Uint8Array;
  try {
    data = await fs.readFile(path);
  } catch (e) {
    useSystemStore.getState().showNotification({
      title: 'Ошибка чтения файла',
      message: e instanceof Error ? e.message : String(e),
      duration: 8000,
    });
    return;
  }

  if (data.byteLength === 0) {
    useSystemStore.getState().showNotification({
      title: 'Пустой файл',
      message: 'Перезагрузите .exe через «Файлы» → «Загрузить» и попробуйте снова.',
      duration: 8000,
    });
    return;
  }

  const info = V86Runtime.analyzeFile(data, name);

  if (!info.runnable) {
    useSystemStore.getState().showNotification({
      title: 'Нельзя запустить',
      message: info.message,
      duration: 7000,
    });
    return;
  }

  const sizeMb = (data.byteLength / (1024 * 1024)).toFixed(2);
  if (info.kind !== 'pe' && data.byteLength > 1_457_280) {
    useSystemStore.getState().showNotification({
      title: 'Слишком большой для DOS-дискеты',
      message: `Файл ${sizeMb} МБ. DOS/FreeDOS: макс. ~1.4 МБ на дискете. Для больших PE используйте Windows 98 в эмуляторе.`,
      duration: 10000,
    });
    return;
  }

  await openApp('emulator', `Эмулятор — ${name}`, 800, 560, {
    initialFile: { name, path, data },
  });
}

export function mapAppToIcon(appId: AppId): import('@browser-os/gui-shell').AppIconId {
  const map: Record<AppId, import('@browser-os/gui-shell').AppIconId> = {
    welcome: 'welcome',
    files: 'files',
    terminal: 'terminal',
    settings: 'settings',
    editor: 'editor',
    taskmanager: 'taskmanager',
    calculator: 'calculator',
    appstore: 'appstore',
    emulator: 'emulator',
    browser: 'browser',
  };
  return map[appId] ?? 'welcome';
}
