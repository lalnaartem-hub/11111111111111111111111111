import { useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BootScreen,
  Desktop,
  Dock,
  MenuBar,
  WindowLayer,
  type AppIconId,
} from '@browser-os/gui-shell';
import { WindowState, type IProcessManager } from '@browser-os/types';
import { bootstrap, focusOrLaunch } from './bootstrap';
import { useSystemStore, type AppId } from './store/system';
import { getMotionConfig } from './services/settings';
import { mapAppToIcon } from './services/launcher';
import { WelcomeApp } from './components/WelcomeApp';
import { FilesApp } from './components/FilesApp';
import { TerminalApp } from './components/TerminalApp';
import { SettingsApp } from './components/SettingsApp';
import { TextEditorApp } from './components/TextEditorApp';
import { TaskManagerApp } from './components/TaskManagerApp';
import { CalculatorApp } from './components/CalculatorApp';
import { AppStoreApp } from './components/AppStoreApp';
import { EmulatorApp } from './components/EmulatorApp';
import { BrowserApp } from './components/BrowserApp';
import { Notifications } from './components/Notifications';
import { registerBrowserBridge } from './services/browser';
import { openBrowser } from './services/browser';
import { themePatchForOs } from './services/osTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { OsPicker } from './components/OsPicker';
import { applyOsTheme } from './services/osTheme';
import { saveSettings, type OsMode } from './services/settings';
import { useDisplayWallpaper } from './hooks/useDisplayWallpaper';
import { DEFAULT_KALI_WALLPAPER } from './services/wallpaper';
import type { StorageManager } from '@browser-os/storage-manager';

function renderApp(appId: AppId, props?: Record<string, unknown>) {
  switch (appId) {
    case 'welcome':
      return <WelcomeApp />;
    case 'files':
      return <FilesApp />;
    case 'terminal':
      return <TerminalApp />;
    case 'settings':
      return <SettingsApp />;
    case 'editor':
      return (
        <TextEditorApp initialPath={(props?.path as string) ?? '/home/notes.txt'} />
      );
    case 'taskmanager':
      return <TaskManagerApp />;
    case 'calculator':
      return <CalculatorApp />;
    case 'appstore':
      return <AppStoreApp />;
    case 'emulator':
      return (
        <EmulatorApp
          initialFile={
            props?.initialFile as
              | { name: string; path?: string; data?: Uint8Array }
              | undefined
          }
        />
      );
    case 'browser':
      return (
        <BrowserApp
          initialUrl={props?.initialUrl as string | undefined}
          variant={(props?.variant as 'chromium' | 'firefox') ?? 'chromium'}
        />
      );
    default:
      return null;
  }
}

const BASE_DOCK: { id: AppId; label: string; iconId: AppIconId }[] = [
  { id: 'appstore', label: 'App Store', iconId: 'appstore' },
  { id: 'files', label: 'Файлы', iconId: 'files' },
  { id: 'browser', label: 'Chromium', iconId: 'browser' },
  { id: 'terminal', label: 'Терминал', iconId: 'terminal' },
  { id: 'editor', label: 'Редактор', iconId: 'editor' },
  { id: 'emulator', label: 'Эмулятор', iconId: 'emulator' },
  { id: 'calculator', label: 'Калькулятор', iconId: 'calculator' },
  { id: 'taskmanager', label: 'Процессы', iconId: 'taskmanager' },
  { id: 'settings', label: 'Настройки', iconId: 'settings' },
  { id: 'welcome', label: 'О системе', iconId: 'welcome' },
];

export default function App() {
  const ready = useSystemStore((s) => s.ready);
  const bootMessage = useSystemStore((s) => s.bootMessage);
  const bootPercent = useSystemStore((s) => s.bootPercent);
  const windows = useSystemStore((s) => s.windows);
  const activeWindowId = useSystemStore((s) => s.activeWindowId);
  const windowApps = useSystemStore((s) => s.windowApps);
  const windowAppProps = useSystemStore((s) => s.windowAppProps);
  const windowManager = useSystemStore((s) => s.windowManager);
  const settings = useSystemStore((s) => s.settings);
  const showOsPicker = useSystemStore((s) => s.showOsPicker);
  const setShowOsPicker = useSystemStore((s) => s.setShowOsPicker);
  const setSettings = useSystemStore((s) => s.setSettings);

  useKeyboardShortcuts();

  useEffect(() => applyOsTheme(settings.osMode), [settings.osMode]);

  useEffect(() => {
    const offBrowser = registerBrowserBridge();
    const onApp = (e: Event) => {
      const { appId, props } = (e as CustomEvent<{ appId: AppId; props?: Record<string, unknown> }>)
        .detail;
      if (appId === 'editor' && props?.path) {
        void focusOrLaunch('editor', 'Редактор', undefined, undefined, { path: props.path });
      }
    };
    window.addEventListener('browser-os:open-app', onApp);
    return () => {
      offBrowser();
      window.removeEventListener('browser-os:open-app', onApp);
    };
  }, []);

  useEffect(() => {
    void bootstrap().catch((error) => {
      console.error(error);
      useSystemStore.getState().setBoot('Ошибка загрузки', 0);
    });
  }, []);

  const wm = windowManager;

  const kernel = useSystemStore((s) => s.kernel);

  const handleClose = useCallback(
    (id: string) => {
      if (!wm) return;
      const win = wm.getWindow(id);
      if (win?.processId && kernel) {
        const pm = kernel.getComponent<IProcessManager>('process-manager');
        void pm.kill(win.processId);
      }
      wm.closeWindow(id);
    },
    [wm, kernel]
  );
  const handleMinimize = useCallback((id: string) => wm?.minimizeWindow(id), [wm]);
  const handleMaximize = useCallback(
    (id: string) => {
      if (!wm) return;
      const win = wm.getWindow(id);
      if (!win) return;
      if (win.state === WindowState.MAXIMIZED) wm.restoreWindow(id);
      else wm.maximizeWindow(id);
    },
    [wm]
  );
  const handleFocus = useCallback((id: string) => wm?.focusWindow(id), [wm]);
  const handleMove = useCallback(
    (id: string, x: number, y: number) => wm?.moveWindow(id, x, y),
    [wm]
  );
  const handleResize = useCallback(
    (id: string, width: number, height: number) => wm?.resizeWindow(id, width, height),
    [wm]
  );

  const displayWallpaper = useDisplayWallpaper(
    settings.wallpaper || (settings.osMode === 'linux' ? DEFAULT_KALI_WALLPAPER : ''),
    settings.osMode
  );

  const chrome = useMemo(
    () => ({
      opacity: settings.windowOpacity,
      blur: settings.windowBlur,
      shadows: settings.windowShadows,
      accentColor: settings.accentColor,
      osMode: settings.osMode,
      shellTheme: settings.theme,
      windowRadius: settings.windowCornerRadius,
      motion: getMotionConfig(settings.animationSpeed, settings.reduceMotion),
      reduceMotion: settings.reduceMotion,
    }),
    [settings]
  );

  const onOsSelect = async (mode: OsMode) => {
    const patch = themePatchForOs(mode, settings.wallpaper, settings.accentColor);
    const next = {
      ...settings,
      osMode: mode,
      osPickerDone: true,
      accentColor: patch.accentColor ?? settings.accentColor,
      wallpaper: patch.wallpaper ?? settings.wallpaper,
      dockPosition: patch.dockPosition ?? settings.dockPosition,
    };
    setSettings(next);
    applyOsTheme(mode);
    setShowOsPicker(false);
    const k = useSystemStore.getState().kernel;
    if (k) {
      const storage = k.getComponent<StorageManager>('storage');
      await saveSettings(storage, next);
    }
  };

  const dockApps = useMemo(() => {
    if (settings.osMode === 'linux') {
      return [
        ...BASE_DOCK.slice(0, 3),
        {
          id: 'browser' as AppId,
          label: 'Firefox',
          iconId: 'firefox' as AppIconId,
        },
        ...BASE_DOCK.slice(3),
      ];
    }
    return BASE_DOCK;
  }, [settings.osMode]);

  const dockClass =
    settings.osMode === 'linux'
      ? 'left-2 top-1/2 -translate-y-1/2'
      : settings.dockPosition === 'left'
        ? 'left-3 top-1/2 -translate-y-1/2'
        : settings.dockPosition === 'right'
          ? 'right-3 top-1/2 -translate-y-1/2'
          : 'bottom-4 left-1/2 -translate-x-1/2';

  useEffect(() => {
    document.documentElement.style.setProperty('--ui-scale', String(settings.uiScale));
    document.documentElement.style.setProperty('--window-radius', `${settings.windowCornerRadius}px`);
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.setProperty(
      '--menu-opacity',
      String(settings.menuBarOpacity)
    );
  }, [
    settings.uiScale,
    settings.windowCornerRadius,
    settings.accentColor,
    settings.menuBarOpacity,
  ]);

  if (!ready) {
    return (
      <BootScreen
        message={bootMessage}
        percent={bootPercent}
        osMode={settings.osMode}
        accentColor={settings.accentColor}
      />
    );
  }

  return (
    <div
      className={`h-full ${settings.highContrast ? 'contrast-125' : ''}`}
      style={{ fontSize: settings.fontSize, ['--accent' as string]: settings.accentColor }}
    >
      {showOsPicker && <OsPicker onSelect={(m) => void onOsSelect(m)} />}
      <AnimatePresence mode="wait">
        <motion.div
          key="shell"
          initial={settings.reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            settings.reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 280, damping: 32 }
          }
          className="h-full"
        >
          <MenuBar
            osMode={settings.osMode}
            shellTheme={settings.theme}
            reduceMotion={settings.reduceMotion}
            showClock={settings.showDesktopClock}
            onOpenApp={(id) => {
              if (id === 'browser') {
                openBrowser(
                  settings.osMode === 'linux' ? 'https://duckduckgo.com' : 'https://www.google.com',
                  settings.osMode === 'linux' ? 'firefox' : 'chromium'
                );
              } else {
                focusOrLaunch(id as AppId);
              }
            }}
          />
          <Notifications />
          <Desktop
            wallpaperUrl={displayWallpaper || settings.wallpaper || undefined}
            osMode={settings.osMode}
            shellTheme={settings.theme}
            reduceMotion={settings.reduceMotion}
          >
            <WindowLayer
              windows={windows}
              activeWindowId={activeWindowId}
              chrome={chrome}
              getAppIconId={(id) => mapAppToIcon(windowApps[id] ?? 'welcome')}
              renderContent={(win) => {
                const appId = windowApps[win.id] ?? 'welcome';
                return renderApp(appId, windowAppProps[win.id]);
              }}
              onClose={handleClose}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              onFocus={handleFocus}
              onMove={handleMove}
              onResize={handleResize}
            />
          </Desktop>
          <Dock
            className={dockClass}
            shellTheme={settings.theme}
            osMode={settings.osMode}
            reduceMotion={settings.reduceMotion}
            vertical={settings.osMode === 'linux' || settings.dockPosition !== 'bottom'}
            hoverScale={settings.dockMagnification}
            iconSize={settings.dockIconSize}
            items={dockApps.map((app) => ({
              id: app.id,
              label: app.label,
              iconId: app.iconId,
              running: Object.values(windowApps).includes(app.id),
              onClick: () => {
                if (app.id === 'browser' && settings.osMode === 'linux') {
                  openBrowser('https://duckduckgo.com', 'firefox');
                } else if (app.id === 'browser') {
                  openBrowser('https://www.google.com', 'chromium');
                } else {
                  focusOrLaunch(app.id);
                }
              },
            }))}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
