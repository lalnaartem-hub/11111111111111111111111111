import { useEffect } from 'react';
import { focusOrLaunch } from '../bootstrap';
import type { AppId } from '../store/system';
import { useSystemStore } from '../store/system';

export function useKeyboardShortcuts(): void {
  const windowManager = useSystemStore((s) => s.windowManager);
  const activeWindowId = useSystemStore((s) => s.activeWindowId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      const apps: Record<string, AppId> = {
        f: 'files',
        t: 'terminal',
        ',': 'settings',
        e: 'editor',
        a: 'appstore',
      };

      if (apps[key]) {
        e.preventDefault();
        focusOrLaunch(apps[key]);
        return;
      }

      if (e.shiftKey && key === 'e') {
        e.preventDefault();
        focusOrLaunch('emulator');
        return;
      }

      if (key === 'w' && windowManager && activeWindowId) {
        e.preventDefault();
        windowManager.closeWindow(activeWindowId);
        return;
      }

      if (key === 'm' && windowManager && activeWindowId) {
        e.preventDefault();
        windowManager.minimizeWindow(activeWindowId);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [windowManager, activeWindowId]);
}
