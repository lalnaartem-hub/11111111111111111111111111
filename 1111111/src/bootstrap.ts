import { SystemKernel } from '@browser-os/kernel';
import { StorageManager } from '@browser-os/storage-manager';
import { FileSystem } from '@browser-os/file-system';
import { ProcessManager } from '@browser-os/process-manager';
import type { IProcessManager, WindowOptions } from '@browser-os/types';
import { WindowState } from '@browser-os/types';
import { WindowManager } from '@browser-os/window-manager';
import { GuiShell } from '@browser-os/gui-shell';
import { EmulatorComponent } from '@browser-os/emulator';
import { useSystemStore, type AppId } from './store/system';
import { loadSettings, saveSettings } from './services/settings';
import { normalizeWallpaper } from './services/wallpaper';
import { applyOsTheme } from './services/osTheme';
import { loadSession, saveSession } from './services/session';
import { hookConsole, logInfo } from './services/systemLog';

const COMPONENT_LABELS: Record<string, string> = {
  storage: 'Хранилище',
  'file-system': 'Файловая система',
  'process-manager': 'Менеджер процессов',
  'window-manager': 'Оконный менеджер',
  'gui-shell': 'Графическая оболочка',
  emulator: 'Эмулятор x86',
};

export const APP_META: Record<
  AppId,
  { title: string; width: number; height: number }
> = {
  welcome: { title: 'Добро пожаловать', width: 520, height: 400 },
  files: { title: 'Файлы', width: 600, height: 440 },
  terminal: { title: 'Терминал', width: 580, height: 380 },
  settings: { title: 'Настройки', width: 520, height: 400 },
  editor: { title: 'Текстовый редактор', width: 640, height: 480 },
  taskmanager: { title: 'Монитор активности', width: 560, height: 360 },
  calculator: { title: 'Калькулятор', width: 280, height: 400 },
  appstore: { title: 'App Store', width: 920, height: 620 },
  emulator: { title: 'Эмулятор x86', width: 760, height: 540 },
  browser: { title: 'Chromium', width: 960, height: 620 },
};

let bootPromise: Promise<SystemKernel> | null = null;

export function bootstrap(): Promise<SystemKernel> {
  if (!bootPromise) bootPromise = runBootstrap();
  return bootPromise;
}

async function runBootstrap(): Promise<SystemKernel> {
  hookConsole();
  logInfo('kernel', 'Запуск Browser OS…');
  const store = useSystemStore.getState();
  const kernel = new SystemKernel();

  const storage = new StorageManager();
  const fileSystem = new FileSystem();
  const processManager = new ProcessManager();
  const windowManager = new WindowManager(kernel);
  const guiShell = new GuiShell();
  const emulator = new EmulatorComponent();

  kernel.registerComponent('storage', storage);
  kernel.registerComponent('file-system', fileSystem);
  kernel.registerComponent('process-manager', processManager);
  kernel.registerComponent('window-manager', windowManager);
  kernel.registerComponent('gui-shell', guiShell);
  kernel.registerComponent('emulator', emulator);

  kernel.on('boot:progress', (event) => {
    const { component, percent } = event.data as { component: string; percent: number };
    const label = COMPONENT_LABELS[component] ?? component;
    store.setBoot(`Инициализация: ${label}`, percent);
    logInfo('boot', `${label} (${percent}%)`);
  });

  kernel.on('windows:changed', (event) => {
    const { windows, activeId } = event.data as {
      windows: ReturnType<WindowManager['listAllWindows']>;
      activeId: string | null;
    };
    store.syncWindows(windows, activeId);
    void persistSession(storage, windowManager, store.windowApps);
  });

  store.setBoot('Запуск ядра...', 5);
  await kernel.initialize();

  try {
    await storage.persist();
  } catch {
    /* optional */
  }

  let settings = await loadSettings(storage);
  const fixedWallpaper = normalizeWallpaper(settings.wallpaper, settings.osMode);
  if (fixedWallpaper !== settings.wallpaper) {
    settings = { ...settings, wallpaper: fixedWallpaper };
    await saveSettings(storage, settings);
  }
  applyOsTheme(settings.osMode);
  store.setSettings(settings);
  store.setKernel(kernel, windowManager);
  if (!settings.osPickerDone) {
    store.setShowOsPicker(true);
  }

  const session = settings.restoreSession ? await loadSession(storage) : null;
  if (session?.windows?.length) {
    for (const { window: w, appId } of session.windows) {
      if (w.state === 'minimized') continue;
      const meta = APP_META[appId];
      const opts: WindowOptions = {
        title: w.title || meta.title,
        width: w.width,
        height: w.height,
        x: w.x,
        y: w.y,
      };
      const pm = kernel.getComponent<IProcessManager>('process-manager');
      const proc = await pm.spawn(`/apps/${appId}`, []);
      const win = windowManager.createWindow(opts, proc.pid);
      windowManager.moveWindow(win.id, w.x, w.y);
      windowManager.resizeWindow(win.id, w.width, w.height);
      store.setWindowApp(win.id, appId);
    }
    store.syncWindows(
      windowManager.listAllWindows(),
      windowManager.getActiveWindow()?.id ?? null
    );
  } else if (!settings.firstRunComplete) {
    await openApp('appstore');
    store.showNotification({
      title: 'Browser OS',
      message: 'Добро пожаловать! Установите приложения в App Store.',
    });
    await saveSettings(storage, { ...settings, firstRunComplete: true });
    store.setSettings({ ...settings, firstRunComplete: true });
  } else {
    await openApp('welcome');
  }

  setInterval(() => {
    void persistSession(storage, windowManager, useSystemStore.getState().windowApps);
  }, 30000);

  window.addEventListener('beforeunload', () => {
    void persistSession(storage, windowManager, useSystemStore.getState().windowApps);
  });

  store.setReady(true);
  logInfo('kernel', 'Система готова');
  return kernel;
}

async function persistSession(
  storage: StorageManager,
  wm: WindowManager,
  windowApps: Record<string, AppId>
): Promise<void> {
  const windows = wm.listAllWindows().map((w) => ({
    window: w,
    appId: windowApps[w.id] ?? 'welcome',
  }));
  await saveSession(storage, windows);
}

export async function openApp(
  appId: AppId,
  title?: string,
  width?: number,
  height?: number,
  props?: Record<string, unknown>
): Promise<string | null> {
  const meta = APP_META[appId];
  const { windowManager, kernel, setWindowApp, syncWindows } = useSystemStore.getState();
  if (!windowManager || !kernel) return null;

  const pm = kernel.getComponent<IProcessManager>('process-manager');
  const process = await pm.spawn(`/apps/${appId}`, []);
  const win = windowManager.createWindow(
    {
      title: title ?? meta.title,
      width: width ?? meta.width,
      height: height ?? meta.height,
    },
    process.pid
  );
  setWindowApp(win.id, appId, props);
  syncWindows(windowManager.listAllWindows(), win.id);
  return win.id;
}

/** Открыть приложение или переключиться на уже запущенное окно */
export function focusOrLaunch(
  appId: AppId,
  title?: string,
  width?: number,
  height?: number,
  props?: Record<string, unknown>
): void {
  const { windowManager, windowApps, syncWindows } = useSystemStore.getState();
  if (!windowManager) {
    void openApp(appId, title, width, height, props);
    return;
  }

  const existing = Object.entries(windowApps).find(([, id]) => id === appId);
  if (existing && !props) {
    const [windowId] = existing;
    const win = windowManager.getWindow(windowId);
    if (!win) {
      void openApp(appId, title, width, height, props);
      return;
    }
    if (win.state === WindowState.MINIMIZED) {
      windowManager.restoreWindow(windowId);
    } else {
      windowManager.focusWindow(windowId);
    }
    syncWindows(windowManager.listAllWindows(), windowId);
    return;
  }

  void openApp(appId, title, width, height, props);
}
