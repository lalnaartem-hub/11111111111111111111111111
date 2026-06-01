import type { StorageManager } from '@browser-os/storage-manager';
import { DEFAULT_KALI_WALLPAPER, normalizeWallpaper } from './wallpaper';

export type OsMode = 'macos' | 'linux';

export interface SystemSettings {
  osMode: OsMode;
  osPickerDone: boolean;
  wallpaper: string;
  theme: 'light' | 'dark';
  dockPosition: 'bottom' | 'left' | 'right';
  dockMagnification: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
  fontSize: number;
  highContrast: boolean;
  accentColor: string;
  windowOpacity: number;
  windowBlur: boolean;
  windowShadows: boolean;
  emulatorMemoryMB: number;
  restoreSession: boolean;
  showDesktopClock: boolean;
  firstRunComplete: boolean;
  dockIconSize: number;
  uiScale: number;
  windowCornerRadius: number;
  menuBarOpacity: number;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  osMode: 'macos',
  osPickerDone: false,
  wallpaper: '',
  theme: 'light',
  dockPosition: 'bottom',
  dockMagnification: 1.22,
  animationSpeed: 'normal',
  reduceMotion: false,
  fontSize: 14,
  highContrast: false,
  accentColor: '#007AFF',
  windowOpacity: 1,
  windowBlur: true,
  windowShadows: true,
  emulatorMemoryMB: 64,
  restoreSession: true,
  showDesktopClock: true,
  firstRunComplete: false,
  dockIconSize: 48,
  uiScale: 1,
  windowCornerRadius: 14,
  menuBarOpacity: 0.95,
};

const SETTINGS_KEY = 'system.settings';

export function getMotionConfig(speed: SystemSettings['animationSpeed'], reduce: boolean) {
  if (reduce) return { stiffness: 300, damping: 40 };
  switch (speed) {
    case 'slow':
      return { stiffness: 200, damping: 28 };
    case 'fast':
      return { stiffness: 600, damping: 26 };
    default:
      return { stiffness: 420, damping: 32 };
  }
}

export async function loadSettings(storage: StorageManager): Promise<SystemSettings> {
  const saved = await storage.get(SETTINGS_KEY);
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_SETTINGS };
  const merged = { ...DEFAULT_SETTINGS, ...(saved as Partial<SystemSettings>) };
  if ((merged as { osMode?: string }).osMode === 'windows') {
    merged.osMode = 'macos';
  }
  merged.theme = merged.theme === 'dark' ? 'dark' : 'light';
  if (merged.osMode === 'linux' && merged.dockPosition === 'bottom') {
    merged.dockPosition = 'left';
  }
  merged.wallpaper = normalizeWallpaper(merged.wallpaper, merged.osMode);
  if (merged.osMode === 'linux' && !merged.wallpaper) {
    merged.wallpaper = DEFAULT_KALI_WALLPAPER;
  }
  return merged;
}

export async function saveSettings(
  storage: StorageManager,
  settings: SystemSettings
): Promise<void> {
  await storage.set(SETTINGS_KEY, settings);
}

/** Пресеты: градиенты, локальные (/wallpapers после setup:wallpapers), url: из GitLab */
export const WALLPAPER_PRESETS = [
  { id: 'default', label: 'По умолчанию', value: '' },
  { id: 'kali-neon', label: 'Kali Neon', value: '/wallpapers/kali-neon-16x9.svg' },
  { id: 'kali-dark-img', label: 'Kali Dark', value: '/wallpapers/kali-dark-16x9.svg' },
  { id: 'kali-sky', label: 'Kali Sky', value: '/wallpapers/kali-abstract-sky-16x9.svg' },
  { id: 'kali-cubes', label: 'Kali Cubes', value: '/wallpapers/kali-cubes-16x9.svg' },
  { id: 'kali-cubes-p', label: 'Kali Cubes Purple', value: '/wallpapers/kali-cubes-purple-16x9.svg' },
  { id: 'kali-neon-png', label: 'Kali Neon PNG', value: '/wallpapers/kali-neon-16x9.png' },
  { id: 'kali', label: 'Kali градиент', value: 'gradient:kali' },
  { id: 'kali-blue', label: 'Kali Blue', value: 'gradient:kali-blue' },
  { id: 'kali-dark', label: 'Kali Dark градиент', value: 'gradient:kali-dark' },
  { id: 'win11', label: 'Windows 11', value: 'gradient:win11' },
  { id: 'sunset', label: 'Закат', value: 'gradient:sunset' },
  { id: 'ocean', label: 'Океан', value: 'gradient:ocean' },
  { id: 'purple', label: 'Фиолетовый', value: 'gradient:purple' },
  { id: 'night', label: 'Ночь', value: 'gradient:night' },
];

export function wallpaperPreviewStyle(value: string): Record<string, string> {
  if (!value) {
    return {
      background: 'linear-gradient(145deg, #0f2027 0%, #2c5364 70%, #4a90a4 100%)',
    };
  }
  if (value.startsWith('gradient:')) {
    return {
      background:
        WALLPAPER_GRADIENTS[value] ??
        'linear-gradient(145deg, #0d1117, #367bf0)',
    };
  }
  const img = value.startsWith('url:')
    ? value.slice(4)
    : value.startsWith('http') || value.startsWith('/')
      ? value
      : null;
  if (img) {
    return {
      backgroundImage: `url("${img}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: WALLPAPER_GRADIENTS[value] ?? '#1a2332' };
}

export function wallpaperDesktopStyle(wallpaperUrl?: string): Record<string, string> {
  if (!wallpaperUrl) return {};
  return wallpaperPreviewStyle(wallpaperUrl);
}

export const WALLPAPER_GRADIENTS: Record<string, string> = {
  'gradient:kali':
    'linear-gradient(145deg, #0d1117 0%, #1a2332 40%, #367bf0 75%, #5e4b8b 100%)',
  'gradient:kali-blue':
    'linear-gradient(160deg, #0a0e14 0%, #162447 50%, #367bf0 100%)',
  'gradient:kali-dark':
    'radial-gradient(ellipse at 70% 20%, #367bf0 0%, transparent 45%), linear-gradient(180deg, #0d1117 0%, #000 100%)',
  'gradient:win11':
    'linear-gradient(135deg, #0067c0 0%, #1a1a2e 40%, #4a90d9 70%, #89b4e6 100%)',
  'gradient:sunset':
    'linear-gradient(145deg, #ff6b6b 0%, #feca57 40%, #48dbfb 100%)',
  'gradient:ocean':
    'linear-gradient(160deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
  'gradient:purple':
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  'gradient:night':
    'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
};
