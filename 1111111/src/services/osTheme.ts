import type { OsMode } from './settings';

export const OS_THEME_DEFAULTS: Record<
  OsMode,
  { accent: string; wallpaper: string; label: string; dockPosition: 'bottom' | 'left' }
> = {
  macos: { accent: '#007AFF', wallpaper: '', label: 'macOS', dockPosition: 'bottom' },
  linux: {
    accent: '#367bf0',
    wallpaper: '/wallpapers/kali-neon-16x9.svg',
    label: 'Kali Linux',
    dockPosition: 'left',
  },
};

export function applyOsTheme(mode: OsMode): void {
  const t = OS_THEME_DEFAULTS[mode];
  document.documentElement.setAttribute('data-os', mode);
  document.documentElement.style.setProperty('--accent', t.accent);
  document.documentElement.style.setProperty('--os-accent', t.accent);

  if (mode === 'linux') {
    document.body.style.fontFamily = "'Ubuntu', 'Cantarell', 'Noto Sans', system-ui, sans-serif";
    document.body.classList.add('os-linux-body');
    document.body.classList.remove('os-macos-body');
  } else {
    document.body.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    document.body.classList.add('os-macos-body');
    document.body.classList.remove('os-linux-body');
  }
}

export function shellModeForOs(_mode: OsMode): 'unix' {
  return 'unix';
}

export function themePatchForOs(
  mode: OsMode,
  currentWallpaper: string,
  currentAccent: string
): { wallpaper?: string; accentColor?: string; dockPosition?: 'bottom' | 'left' | 'right' } {
  const d = OS_THEME_DEFAULTS[mode];
  const patch: {
    wallpaper?: string;
    accentColor?: string;
    dockPosition?: 'bottom' | 'left' | 'right';
  } = { dockPosition: d.dockPosition };
  const knownWallpapers = [
    '',
    'gradient:sunset',
    'gradient:ocean',
    'gradient:purple',
    'gradient:night',
    'gradient:kali',
    'gradient:kali-blue',
    'gradient:kali-dark',
    'gradient:win11',
    '/wallpapers/kali-neon-16x9.svg',
    '/wallpapers/kali-dark-16x9.svg',
    '/wallpapers/kali-abstract-sky-16x9.svg',
    '/wallpapers/kali-cubes-16x9.svg',
    '/wallpapers/kali-cubes-purple-16x9.svg',
    '/wallpapers/kali-neon-16x9.png',
  ];
  if (knownWallpapers.includes(currentWallpaper)) {
    patch.wallpaper = d.wallpaper;
  }
  const knownAccents = ['#007AFF', '#0078d4', '#367bf0', '#e95420'];
  if (knownAccents.includes(currentAccent)) {
    patch.accentColor = d.accent;
  }
  return patch;
}
