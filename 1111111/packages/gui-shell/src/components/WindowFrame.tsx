import { motion } from 'framer-motion';
import type { Window } from '@browser-os/types';
import { WindowState } from '@browser-os/types';
import { useWindowDrag } from '../hooks/useWindowDrag';
import { AppIcon, type AppIconId } from './AppIcons';

export interface WindowChromeOptions {
  opacity?: number;
  blur?: boolean;
  shadows?: boolean;
  motion?: { stiffness: number; damping: number };
  accentColor?: string;
  osMode?: 'macos' | 'linux';
  shellTheme?: 'light' | 'dark';
  windowRadius?: number;
  reduceMotion?: boolean;
}

export interface WindowFrameProps {
  window: Window;
  active: boolean;
  appIconId?: AppIconId;
  chrome?: WindowChromeOptions;
  children?: React.ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

const RESIZE = 8;

export function WindowFrame({
  window: win,
  active,
  appIconId,
  chrome,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
}: WindowFrameProps) {
  const { bounds, startMove, startResize, isDragging } = useWindowDrag({
    win,
    onMove,
    onResize,
    onFocus,
  });

  if (win.state === WindowState.MINIMIZED) return null;

  const isMax = win.state === WindowState.MAXIMIZED;
  const os = chrome?.osMode ?? 'macos';
  const isLinux = os === 'linux';
  const shellDark = chrome?.shellTheme === 'dark';
  const opacity = chrome?.opacity ?? 1;
  const blur = chrome?.blur !== false;
  const shadows = chrome?.shadows !== false;
  const reduceMotion = chrome?.reduceMotion ?? false;
  const openSpring = chrome?.motion ?? { stiffness: 340, damping: 30, mass: 0.9 };
  const accent = chrome?.accentColor ?? '#007AFF';

  const radius = isMax ? 0 : isLinux ? 6 : (chrome?.windowRadius ?? 14);

  const boxShadow = shadows
    ? isLinux
      ? active
        ? '0 0 0 1px rgba(54,123,240,0.5), 0 12px 40px rgba(0,0,0,0.55)'
        : '0 8px 28px rgba(0,0,0,0.45)'
      : active
        ? `0 0 0 1px ${accent}33, 0 28px 90px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.15)`
        : '0 16px 48px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)'
    : 'none';

  return (
    <motion.div
      layout={!isDragging && !isMax && !reduceMotion}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              scale: isLinux ? 0.94 : 0.88,
              y: isLinux ? 12 : 28,
              filter: 'blur(6px)',
            }
      }
      animate={{
        opacity: active ? 1 : 0.94,
        scale: active ? 1 : 0.99,
        y: 0,
        filter: 'blur(0px)',
        transition: reduceMotion
          ? { duration: 0.01 }
          : { type: 'spring', ...openSpring },
      }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0.01 } }
          : {
              opacity: 0,
              scale: 0.9,
              y: 24,
              filter: 'blur(4px)',
              transition: { type: 'spring', stiffness: 400, damping: 32 },
            }
      }
      className={`absolute flex flex-col overflow-hidden select-none pointer-events-auto ${
        isLinux ? 'ring-1 ring-[#367bf0]/30' : 'ring-1 ring-black/5'
      }`}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: win.zIndex,
        borderRadius: radius,
        opacity,
        boxShadow,
        willChange: isDragging ? 'left, top, width, height' : 'auto',
      }}
      onMouseDown={() => onFocus(win.id)}
    >
      {isLinux ? (
        <LinuxTitleBar
          win={win}
          active={active}
          appIconId={appIconId}
          blur={blur}
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          startMove={startMove}
        />
      ) : (
        <MacTitleBar
          win={win}
          active={active}
          appIconId={appIconId}
          blur={blur}
          dark={shellDark}
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          startMove={startMove}
        />
      )}

      <div
        className={`flex-1 overflow-auto min-h-0 window-body ${
          isLinux || shellDark ? 'bg-[#1a1a1e] text-gray-100' : 'bg-white/98 text-gray-900'
        }`}
      >
        {children}
      </div>

      {win.resizable && !isMax && onResize && (
        <ResizeHandles startResize={startResize} isLinux={isLinux} />
      )}
    </motion.div>
  );
}

function MacTitleBar({
  win,
  active,
  appIconId,
  blur,
  dark,
  onClose,
  onMinimize,
  onMaximize,
  startMove,
}: {
  win: Window;
  active: boolean;
  appIconId?: AppIconId;
  blur: boolean;
  dark?: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  startMove: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className={`flex items-center h-11 px-3 gap-2.5 shrink-0 border-b ${
        dark ? 'border-white/10' : 'border-black/5'
      } ${blur ? 'backdrop-blur-2xl' : ''} cursor-grab active:cursor-grabbing`}
      style={{
        background: dark
          ? active
            ? 'linear-gradient(180deg, #3a3a42 0%, #2d2d32 100%)'
            : 'linear-gradient(180deg, #323238 0%, #26262b 100%)'
          : active
            ? 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,245,247,0.9) 100%)'
            : 'linear-gradient(180deg, rgba(250,250,252,0.88) 0%, rgba(235,235,240,0.82) 100%)',
      }}
      onPointerDown={startMove}
    >
      <div className="flex gap-2 shrink-0">
        {win.closable && (
          <TrafficLight color="#ff5f57" label="Закрыть" onClick={() => onClose(win.id)} />
        )}
        {win.minimizable && (
          <TrafficLight color="#febc2e" label="Свернуть" onClick={() => onMinimize(win.id)} />
        )}
        {win.maximizable && (
          <TrafficLight color="#28c840" label="Развернуть" onClick={() => onMaximize(win.id)} />
        )}
      </div>
      {appIconId && <AppIcon id={appIconId} size={22} />}
      <span
        className={`flex-1 text-center text-[13px] font-semibold truncate pointer-events-none ${
          dark ? 'text-gray-200' : active ? 'text-gray-800' : 'text-gray-600'
        }`}
      >
        {win.title}
      </span>
      <div className="w-16 shrink-0" />
    </div>
  );
}

function LinuxTitleBar({
  win,
  active,
  appIconId,
  blur,
  onClose,
  onMinimize,
  onMaximize,
  startMove,
}: {
  win: Window;
  active: boolean;
  appIconId?: AppIconId;
  blur: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  startMove: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className={`flex items-center h-9 px-2 gap-2 shrink-0 border-b border-[#367bf0]/25 ${
        blur ? 'backdrop-blur-md' : ''
      } cursor-grab active:cursor-grabbing`}
      style={{
        background: active
          ? 'linear-gradient(180deg, #3a3a42 0%, #2d2d32 100%)'
          : 'linear-gradient(180deg, #323238 0%, #26262b 100%)',
      }}
      onPointerDown={startMove}
    >
      {appIconId && <AppIcon id={appIconId} size={18} />}
      <span className="flex-1 text-left text-[12px] font-medium truncate text-gray-200 pointer-events-none">
        {win.title}
      </span>
      <div className="flex shrink-0 h-full">
        {win.minimizable && (
          <GnomeBtn label="Свернуть" onClick={() => onMinimize(win.id)}>
            −
          </GnomeBtn>
        )}
        {win.maximizable && (
          <GnomeBtn label="Развернуть" onClick={() => onMaximize(win.id)}>
            □
          </GnomeBtn>
        )}
        {win.closable && (
          <GnomeBtn label="Закрыть" onClick={() => onClose(win.id)} danger>
            ×
          </GnomeBtn>
        )}
      </div>
    </div>
  );
}

function GnomeBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`w-9 h-9 flex items-center justify-center text-gray-300 text-sm hover:bg-white/10 ${
        danger ? 'hover:bg-[#c01c28] hover:text-white' : ''
      }`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function ResizeHandles({
  startResize,
  isLinux,
}: {
  startResize: (edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => (e: React.PointerEvent) => void;
  isLinux: boolean;
}) {
  return (
    <>
      <div className="absolute top-0 left-3 right-3 cursor-n-resize z-20" style={{ height: RESIZE }} onPointerDown={startResize('n')} />
      <div className="absolute bottom-0 left-3 right-3 cursor-s-resize z-20" style={{ height: RESIZE }} onPointerDown={startResize('s')} />
      <div className="absolute left-0 top-3 bottom-3 cursor-w-resize z-20" style={{ width: RESIZE }} onPointerDown={startResize('w')} />
      <div className="absolute right-0 top-3 bottom-3 cursor-e-resize z-20" style={{ width: RESIZE }} onPointerDown={startResize('e')} />
      <div
        className={`absolute right-0 bottom-0 w-5 h-5 cursor-se-resize z-30 ${
          isLinux ? 'bg-[#367bf0]/20' : 'bg-gradient-to-tl from-black/10 to-transparent rounded-tl-lg'
        }`}
        onPointerDown={startResize('se')}
      />
    </>
  );
}

function TrafficLight({
  color,
  label,
  onClick,
}: {
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/10 hover:brightness-90 transition-transform hover:scale-110"
      style={{ backgroundColor: color }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
  );
}
