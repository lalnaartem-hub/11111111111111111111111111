import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MOTION, spring } from '../motion';

interface DesktopProps {
  children?: ReactNode;
  wallpaperUrl?: string;
  osMode?: 'macos' | 'linux';
  shellTheme?: 'light' | 'dark';
  reduceMotion?: boolean;
}

const DEFAULT_MAC =
  'linear-gradient(145deg, #0f2027 0%, #203a43 40%, #2c5364 70%, #4a90a4 100%)';

const GRADIENTS: Record<string, string> = {
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

function resolveGradient(key: string): string {
  return GRADIENTS[key] ?? DEFAULT_MAC;
}

function resolveWallpaper(wallpaperUrl?: string, isLinux?: boolean): Record<string, string> {
  if (!wallpaperUrl) {
    return isLinux
      ? {
          backgroundImage: 'url("/wallpapers/kali-neon-16x9.svg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { background: DEFAULT_MAC };
  }
  if (wallpaperUrl.startsWith('gradient:')) {
    return { background: resolveGradient(wallpaperUrl) };
  }
  const img = wallpaperUrl.startsWith('url:')
    ? wallpaperUrl.slice(4)
    : wallpaperUrl.startsWith('http') ||
        wallpaperUrl.startsWith('blob:') ||
        wallpaperUrl.startsWith('/')
      ? wallpaperUrl
      : null;
  if (img) {
    return {
      backgroundImage: `url("${img}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: resolveGradient(wallpaperUrl) };
}

export function Desktop({
  children,
  wallpaperUrl,
  osMode = 'macos',
  shellTheme = 'light',
  reduceMotion = false,
}: DesktopProps) {
  const isLinux = osMode === 'linux';
  const dimDesktop = shellTheme === 'dark' && !isLinux;
  const wpKey = wallpaperUrl || (isLinux ? 'kali-default' : 'mac-default');
  const style = resolveWallpaper(wallpaperUrl, isLinux);
  const wallSpring = spring(reduceMotion, MOTION.wallpaper);

  return (
    <main className="os-desktop fixed inset-0 pt-10 pb-[88px] overflow-hidden font-system">
      <AnimatePresence mode="sync">
        <motion.div
          key={wpKey}
          className="absolute inset-0 bg-cover bg-center"
          style={style}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 1.02 }}
          transition={{ type: 'spring', ...wallSpring }}
        />
      </AnimatePresence>

      {dimDesktop && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-0"
          initial={false}
          animate={{ opacity: 1 }}
          style={{ background: 'var(--desktop-dim, rgba(0,0,0,0.45))' }}
        />
      )}
      {!isLinux && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          }}
        />
      )}
      {isLinux && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(54,123,240,0.12) 0%, transparent 50%)',
          }}
        />
      )}
      <motion.div
        className="relative z-[2] h-full w-full"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.12, duration: reduceMotion ? 0 : 0.35 }}
      >
        {children}
      </motion.div>
    </main>
  );
}
