import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export type BootOsMode = 'macos' | 'linux';

interface BootScreenProps {
  message: string;
  percent: number;
  osMode?: BootOsMode;
  accentColor?: string;
}

const BOOT_THEMES: Record<
  BootOsMode,
  { bg: string; bar: string; glow: string; label: string; segments: number }
> = {
  macos: {
    bg: 'linear-gradient(145deg, #0a0a12 0%, #12182a 50%, #1a2744 100%)',
    bar: 'linear-gradient(90deg, #5ac8fa, #007aff, #5856d6)',
    glow: 'rgba(0, 122, 255, 0.45)',
    label: 'Browser OS',
    segments: 8,
  },
  linux: {
    bg: 'linear-gradient(145deg, #0d1117 0%, #1a2332 45%, #367bf0 100%)',
    bar: 'linear-gradient(90deg, #367bf0, #5e4b8b, #00d4aa)',
    glow: 'rgba(54, 123, 240, 0.55)',
    label: 'Browser OS — Kali',
    segments: 12,
  },
};

export function BootScreen({ message, percent, osMode = 'macos', accentColor }: BootScreenProps) {
  const theme = BOOT_THEMES[osMode];
  const spring = useSpring(0, { stiffness: 65, damping: 18, mass: 0.8 });
  const widthPercent = useTransform(spring, (v) => `${Math.min(100, Math.max(0, v))}%`);

  useEffect(() => {
    spring.set(percent);
  }, [percent, spring]);

  const filledSegments = Math.floor((percent / 100) * theme.segments);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white font-system overflow-hidden"
      style={{ background: theme.bg }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.2, 0.45, 0.2],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle at 30% 25%, ${theme.glow} 0%, transparent 55%)`,
        }}
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 22, delay: 0.05 }}
        className="mb-12 flex flex-col items-center relative z-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-4"
          style={{
            background: accentColor
              ? `linear-gradient(145deg, ${accentColor}, color-mix(in srgb, ${accentColor} 70%, #000))`
              : theme.bar,
            boxShadow: `0 20px 60px ${theme.glow}`,
          }}
        >
          <BootLogo mode={osMode} />
        </motion.div>
        <h1 className="text-2xl font-semibold tracking-tight">{theme.label}</h1>
      </motion.div>

      <div className="w-[min(340px,88vw)] relative z-10 mb-5">
        <div className="flex gap-1 mb-2">
          {Array.from({ length: theme.segments }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden bg-white/10"
              initial={false}
              animate={{
                backgroundColor:
                  i < filledSegments ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.12)',
              }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          ))}
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden relative boot-bar-shimmer">
          <motion.div
            className="h-full rounded-full relative"
            style={{ width: widthPercent, background: theme.bar }}
          />
        </div>
      </div>

      <motion.p
        key={message}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-sm text-white/70 relative z-10 text-center max-w-xs px-4"
      >
        {message}
      </motion.p>
      <motion.p
        className="mt-3 text-xs text-white/40 tabular-nums relative z-10"
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {Math.round(percent)}%
      </motion.p>
    </motion.div>
  );
}

function BootLogo({ mode }: { mode: BootOsMode }) {
  if (mode === 'linux') {
    return (
      <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="20" fill="none" stroke="#fff" strokeWidth="3" />
        <path fill="#fff" d="M32 18v28M22 32h20" stroke="#fff" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden>
      <rect x="16" y="18" width="32" height="24" rx="4" fill="white" fillOpacity="0.95" />
      <rect x="24" y="30" width="16" height="4" rx="2" fill="#007aff" />
    </svg>
  );
}
