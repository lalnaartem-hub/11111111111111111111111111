import { AnimatePresence } from 'framer-motion';
import type { Window } from '@browser-os/types';
import { WindowState } from '@browser-os/types';
import { WindowFrame, type WindowChromeOptions } from './WindowFrame';
import type { AppIconId } from './AppIcons';

interface WindowLayerProps {
  windows: Window[];
  activeWindowId: string | null;
  getAppIconId?: (windowId: string) => AppIconId | undefined;
  chrome?: WindowChromeOptions;
  renderContent: (window: Window) => React.ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

export function WindowLayer({
  windows,
  activeWindowId,
  getAppIconId,
  chrome,
  renderContent,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
}: WindowLayerProps) {
  const visible = windows.filter((w) => w.state !== WindowState.MINIMIZED);
  const sorted = [...visible].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="absolute inset-0 pt-11 pb-[88px] pointer-events-none">
      <AnimatePresence mode="popLayout" initial={false}>
        {sorted.map((win) => (
          <WindowFrame
            key={win.id}
            window={win}
            active={win.id === activeWindowId}
            appIconId={getAppIconId?.(win.id)}
            chrome={chrome}
            onClose={onClose}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            onFocus={onFocus}
            onMove={onMove}
            onResize={onResize}
          >
            {renderContent(win)}
          </WindowFrame>
        ))}
      </AnimatePresence>
    </div>
  );
}
