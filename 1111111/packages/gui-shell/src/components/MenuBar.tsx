import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type MenuAppTarget =
  | 'files'
  | 'terminal'
  | 'settings'
  | 'welcome'
  | 'emulator'
  | 'editor'
  | 'browser';

interface MenuBarProps {
  showClock?: boolean;
  osMode?: 'macos' | 'linux';
  shellTheme?: 'light' | 'dark';
  reduceMotion?: boolean;
  onOpenApp?: (appId: MenuAppTarget) => void;
}

const MAC_MENUS = [
  {
    label: 'Файл',
    items: [
      { label: 'Файлы', app: 'files' as const },
      { label: 'Терминал', app: 'terminal' as const },
    ],
  },
  {
    label: 'Вид',
    items: [{ label: 'Настройки', app: 'settings' as const }],
  },
];

const LINUX_MENUS = [
  {
    label: 'Приложения',
    items: [
      { label: 'Файлы', app: 'files' as const },
      { label: 'Терминал', app: 'terminal' as const },
      { label: 'Firefox', app: 'browser' as const },
      { label: 'Настройки', app: 'settings' as const },
    ],
  },
];

export function MenuBar({
  showClock = true,
  osMode = 'macos',
  shellTheme = 'light',
  reduceMotion = false,
  onOpenApp,
}: MenuBarProps) {
  const [time, setTime] = useState(() => formatTime());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const isLinux = osMode === 'linux';
  const isDark = shellTheme === 'dark' || isLinux;
  const menus = isLinux ? LINUX_MENUS : MAC_MENUS;

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <motion.header
      ref={barRef}
      initial={reduceMotion ? false : { y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={
        reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }
      }
      className={`os-menubar fixed top-0 left-0 right-0 z-[9000] h-7 flex items-center px-3 gap-3 text-[13px] select-none ${
        isLinux
          ? 'font-medium text-gray-200 bg-[#1e1e2e] border-b border-[#367bf0]/25'
          : isDark
            ? 'font-medium text-gray-100 bg-[#1c1c1e]/95 backdrop-blur-2xl border-b border-white/10'
            : 'font-medium text-white/95 bg-black/25 backdrop-blur-2xl border-b border-white/10'
      }`}
      style={{ opacity: 'var(--menu-opacity, 0.95)' }}
    >
      {isLinux ? (
        <span className="text-[#367bf0] font-bold text-xs tracking-wider shrink-0">KALI</span>
      ) : (
        <span className="text-base leading-none opacity-90 shrink-0" aria-hidden>
          &#63743;
        </span>
      )}
      <span className={`font-semibold shrink-0 ${isLinux ? 'text-gray-100' : ''}`}>
        {isLinux ? 'Kali Linux' : 'Browser OS'}
      </span>
      <nav className="flex gap-1">
        {menus.map((menu) => (
          <div key={menu.label} className="relative">
            <button
              type="button"
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                openMenu === menu.label
                  ? isLinux
                    ? 'bg-[#367bf0]/30 text-white'
                    : 'bg-white/20 text-white'
                  : isLinux
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-white/75 hover:text-white'
              }`}
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            >
              {menu.label}
            </button>
            <AnimatePresence>
              {openMenu === menu.label && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-full left-0 mt-0.5 min-w-[160px] py-1 rounded-lg shadow-xl text-xs z-[9100] ${
                    isLinux || isDark
                      ? 'bg-[#2d2d32] border border-white/10 text-gray-200'
                      : 'bg-gray-900/95 border border-white/10 text-white/90'
                  }`}
                >
                  {menu.items.map((item, idx) => (
                    <motion.button
                      key={item.label}
                      type="button"
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`block w-full text-left px-3 py-1.5 ${
                        isLinux ? 'hover:bg-[#367bf0]/25' : 'hover:bg-white/10'
                      }`}
                      onClick={() => {
                        setOpenMenu(null);
                        if (item.app) onOpenApp?.(item.app);
                      }}
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
      <div
        className={`ml-auto flex items-center gap-3 text-xs tabular-nums ${
          isLinux || isDark ? 'text-gray-400' : 'text-white/80'
        }`}
      >
        {showClock && <span>{time}</span>}
        {isLinux && (
          <span className="w-2 h-2 rounded-full bg-[#367bf0]" title="Сеть" />
        )}
      </div>
    </motion.header>
  );
}

function formatTime(): string {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
