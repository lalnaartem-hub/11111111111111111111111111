import { motion } from 'framer-motion';
import { AppIcon, type AppIconId } from './AppIcons';
import { MOTION, spring } from '../motion';

export interface DockItem {
  id: string;
  label: string;
  iconId: AppIconId;
  running?: boolean;
  onClick?: () => void;
}

interface DockProps {
  items: DockItem[];
  className?: string;
  vertical?: boolean;
  hoverScale?: number;
  iconSize?: number;
  shellTheme?: 'light' | 'dark';
  osMode?: 'macos' | 'linux';
  reduceMotion?: boolean;
}

const dockVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5, y: 12 },
  show: { opacity: 1, scale: 1, y: 0 },
};

export function Dock({
  items,
  className = '',
  vertical = false,
  hoverScale = 1.22,
  iconSize = 48,
  shellTheme = 'light',
  osMode = 'macos',
  reduceMotion = false,
}: DockProps) {
  const isDark = shellTheme === 'dark' || osMode === 'linux';
  const enterSpring = spring(reduceMotion, MOTION.dockEnter);
  const hoverSpring = spring(reduceMotion, MOTION.dockHover);

  return (
    <motion.footer
      className={`os-dock fixed z-[9000] flex gap-1.5 p-2
        ${vertical ? 'flex-col items-center' : 'items-end'}
        ${isDark && osMode === 'macos' ? 'os-dock-dark' : ''}
        ${className}`}
      variants={reduceMotion ? undefined : dockVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      transition={{ type: 'spring', ...enterSpring }}
    >
      {items.map((item, i) => (
        <DockIcon
          key={item.id}
          item={item}
          vertical={vertical}
          hoverScale={hoverScale}
          iconSize={iconSize}
          index={i}
          reduceMotion={reduceMotion}
          hoverSpring={hoverSpring}
          isLinux={osMode === 'linux'}
        />
      ))}
    </motion.footer>
  );
}

function DockIcon({
  item,
  vertical,
  hoverScale,
  iconSize,
  index,
  reduceMotion,
  hoverSpring,
  isLinux,
}: {
  item: DockItem;
  vertical: boolean;
  hoverScale: number;
  iconSize: number;
  index: number;
  reduceMotion: boolean;
  hoverSpring: ReturnType<typeof spring>;
  isLinux: boolean;
}) {
  return (
    <motion.button
      type="button"
      title={item.label}
      onClick={item.onClick}
      className="relative flex flex-col items-center outline-none"
      variants={reduceMotion ? undefined : iconVariants}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: hoverScale,
              y: vertical ? (isLinux ? -4 : 0) : -12,
              transition: { type: 'spring', ...hoverSpring },
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.88, transition: { duration: 0.1 } }}
    >
      <motion.div
        className="p-0.5 rounded-xl bg-white/10"
        layout
        whileHover={
          reduceMotion
            ? undefined
            : {
                boxShadow: isLinux
                  ? '0 0 20px rgba(54,123,240,0.45)'
                  : '0 8px 24px rgba(0,0,0,0.25)',
              }
        }
      >
        <AppIcon id={item.iconId} size={iconSize} />
      </motion.div>
      {item.running && (
        <motion.span
          className={`absolute ${vertical ? '-right-0.5 top-1/2 -translate-y-1/2' : '-bottom-0.5'} w-1.5 h-1.5 rounded-full ${
            isLinux ? 'bg-[#367bf0]' : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
          }`}
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: index * 0.02 }}
        />
      )}
      <span className="sr-only">{item.label}</span>
    </motion.button>
  );
}
