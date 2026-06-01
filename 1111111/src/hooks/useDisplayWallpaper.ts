import { useEffect, useState } from 'react';
import type { OsMode } from '../services/settings';
import {
  normalizeWallpaper,
  preloadWallpapersFromInternet,
  probeWallpaper,
  resolveWallpaperForDisplay,
} from '../services/wallpaper';

export function useDisplayWallpaper(setting: string, osMode: OsMode): string | undefined {
  const [display, setDisplay] = useState(() => resolveWallpaperForDisplay(setting, osMode));

  useEffect(() => {
    void preloadWallpapersFromInternet().then(() => {
      setDisplay(resolveWallpaperForDisplay(setting, osMode));
    });
  }, [setting, osMode]);

  useEffect(() => {
    const norm = normalizeWallpaper(setting, osMode);
    if (!norm || norm.startsWith('gradient:')) {
      setDisplay(norm || undefined);
      return;
    }

    const src = resolveWallpaperForDisplay(setting, osMode);
    if (!src) {
      setDisplay(undefined);
      return;
    }

    return probeWallpaper(src, (url) => setDisplay(url || src));
  }, [setting, osMode]);

  return display;
}
