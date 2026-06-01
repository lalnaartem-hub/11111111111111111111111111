import { create } from 'zustand';
import type { SystemKernel } from '@browser-os/kernel';
import type { Window } from '@browser-os/types';
import type { WindowManager } from '@browser-os/window-manager';
import { DEFAULT_SETTINGS, type SystemSettings } from '../services/settings';
import { applyShellTheme } from '../services/shellTheme';

export type AppId =
  | 'welcome'
  | 'files'
  | 'terminal'
  | 'settings'
  | 'editor'
  | 'taskmanager'
  | 'calculator'
  | 'appstore'
  | 'emulator'
  | 'browser';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  duration?: number;
}

interface SystemState {
  kernel: SystemKernel | null;
  windowManager: WindowManager | null;
  ready: boolean;
  bootMessage: string;
  bootPercent: number;
  windows: Window[];
  activeWindowId: string | null;
  windowApps: Record<string, AppId>;
  windowAppProps: Record<string, Record<string, unknown>>;
  settings: SystemSettings;
  showOsPicker: boolean;
  notifications: NotificationItem[];
  setBoot: (message: string, percent: number) => void;
  setKernel: (kernel: SystemKernel, windowManager: WindowManager) => void;
  setReady: (ready: boolean) => void;
  syncWindows: (windows: Window[], activeId: string | null) => void;
  setWindowApp: (windowId: string, appId: AppId, props?: Record<string, unknown>) => void;
  setSettings: (settings: SystemSettings) => void;
  setShowOsPicker: (show: boolean) => void;
  showNotification: (n: Omit<NotificationItem, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  kernel: null,
  windowManager: null,
  ready: false,
  bootMessage: 'Запуск...',
  bootPercent: 0,
  windows: [],
  activeWindowId: null,
  windowApps: {},
  windowAppProps: {},
  settings: { ...DEFAULT_SETTINGS },
  showOsPicker: false,
  notifications: [],
  setBoot: (bootMessage, bootPercent) => set({ bootMessage, bootPercent }),
  setKernel: (kernel, windowManager) => set({ kernel, windowManager }),
  setReady: (ready) => set({ ready }),
  syncWindows: (windows, activeWindowId) =>
    set((state) => {
      const ids = new Set(windows.map((w) => w.id));
      const windowApps = Object.fromEntries(
        Object.entries(state.windowApps).filter(([id]) => ids.has(id))
      );
      const windowAppProps = Object.fromEntries(
        Object.entries(state.windowAppProps).filter(([id]) => ids.has(id))
      );
      return { windows, activeWindowId, windowApps, windowAppProps };
    }),
  setWindowApp: (windowId, appId, props) =>
    set((state) => ({
      windowApps: { ...state.windowApps, [windowId]: appId },
      windowAppProps: props
        ? { ...state.windowAppProps, [windowId]: props }
        : state.windowAppProps,
    })),
  setSettings: (settings) => {
    applyShellTheme(settings.theme, settings.osMode);
    set({ settings });
  },
  setShowOsPicker: (showOsPicker) => set({ showOsPicker }),
  showNotification: (n) => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { ...n, id }],
    }));
    const duration = n.duration ?? 4000;
    setTimeout(() => get().dismissNotification(id), duration);
  },
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((x) => x.id !== id),
    })),
}));
