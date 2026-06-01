import type { OsMode } from './settings';

export const DEFAULT_KALI_WALLPAPER = '/wallpapers/kali-neon-16x9.svg';

/** Старые пути без файлов → SVG в public/wallpapers */
const PATH_ALIASES: Record<string, string> = {
  '/wallpapers/kali-neon-16x9.png': DEFAULT_KALI_WALLPAPER,
  '/wallpapers/kali-dark-16x9.png': '/wallpapers/kali-dark-16x9.svg',
  '/wallpapers/kali-abstract-sky-16x9.png': '/wallpapers/kali-abstract-sky-16x9.svg',
  '/wallpapers/kali-cubes-16x9.jpg': '/wallpapers/kali-cubes-16x9.svg',
  '/wallpapers/kali-cubes-purple-16x9.jpg': '/wallpapers/kali-cubes-purple-16x9.svg',
};

const ONLINE_SOURCES: { key: string; local: string; urls: string[] }[] = [
  {
    key: 'neon',
    local: DEFAULT_KALI_WALLPAPER,
    urls: [
      'https://gitlab.com/kalilinux/packages/kali-wallpapers/-/raw/kali/legacy/backgrounds/kali-16x9/kali-neon-16x9.png',
      'https://gitlab.com/kalilinux/packages/kali-wallpapers/-/raw/kali/master/legacy/backgrounds/kali-16x9/kali-neon-16x9.png',
      'https://gitlab.com/api/v4/projects/kalilinux%2Fpackages%2Fkali-wallpapers/repository/files/legacy%2Fbackgrounds%2Fkali-16x9%2Fkali-neon-16x9.png/raw?ref=kali',
    ],
  },
  {
    key: 'dark',
    local: '/wallpapers/kali-dark-16x9.svg',
    urls: [
      'https://gitlab.com/kalilinux/packages/kali-wallpapers/-/raw/kali/legacy/backgrounds/kali-16x9/kali-dark-16x9.png',
    ],
  },
];

const BLOB_PREFIX = 'wallpaper:blob:';

export function normalizeWallpaper(value: string | undefined, osMode: OsMode): string {
  let v = (value ?? '').trim();
  if (PATH_ALIASES[v]) v = PATH_ALIASES[v];

  if (!v) {
    return osMode === 'linux' ? DEFAULT_KALI_WALLPAPER : '';
  }

  if (v.startsWith('gradient:') || v.startsWith('url:') || v.startsWith('http')) {
    return v;
  }

  if (v.startsWith('/wallpapers/')) {
    const blob = sessionStorage.getItem(blobKeyForLocal(v));
    if (blob) return blob;
    return v;
  }

  return v;
}

function blobKeyForLocal(localPath: string): string {
  const entry = ONLINE_SOURCES.find((s) => s.local === localPath);
  return entry ? `${BLOB_PREFIX}${entry.key}` : '';
}

/** Пробует скачать официальные PNG в фоне (браузер). SVG остаётся запасным. */
export async function preloadWallpapersFromInternet(): Promise<void> {
  if (typeof sessionStorage === 'undefined') return;
  if (sessionStorage.getItem('wallpaper:preload:done') === '1') return;

  for (const item of ONLINE_SOURCES) {
    if (sessionStorage.getItem(`${BLOB_PREFIX}${item.key}`)) continue;

    for (const url of item.urls) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) continue;
        const blob = await res.blob();
        if (blob.size < 4096) continue;
        const objectUrl = URL.createObjectURL(blob);
        sessionStorage.setItem(`${BLOB_PREFIX}${item.key}`, objectUrl);
        break;
      } catch {
        /* CORS / сеть — остаётся локальный SVG */
      }
    }
  }

  sessionStorage.setItem('wallpaper:preload:done', '1');
}

export function resolveWallpaperForDisplay(setting: string, osMode: OsMode): string {
  const norm = normalizeWallpaper(setting, osMode);
  if (!norm) return osMode === 'linux' ? DEFAULT_KALI_WALLPAPER : '';
  if (norm.startsWith('url:')) return norm.slice(4);
  if (norm.startsWith('blob:') || norm.startsWith('http')) return norm;
  return norm;
}

/** Проверка картинки; при ошибке — SVG из public */
export function probeWallpaper(
  src: string,
  onReady: (cssUrl: string) => void
): () => void {
  if (!src || src.startsWith('gradient:')) {
    onReady('');
    return () => {};
  }

  const img = new Image();
  const finish = (url: string) => onReady(url);

  img.onload = () => finish(src);
  img.onerror = () => {
    const alias = PATH_ALIASES[src];
    if (alias && alias !== src) {
      finish(alias);
      return;
    }
    if (src.endsWith('.png') || src.endsWith('.jpg')) {
      finish(src.replace(/\.(png|jpg)$/i, '.svg'));
      return;
    }
    finish(DEFAULT_KALI_WALLPAPER);
  };

  img.src = src;
  return () => {
    img.onload = null;
    img.onerror = null;
  };
}
