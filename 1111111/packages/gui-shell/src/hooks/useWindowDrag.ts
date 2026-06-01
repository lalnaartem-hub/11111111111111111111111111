import { useCallback, useEffect, useRef, useState } from 'react';
import type { Window } from '@browser-os/types';
import { WindowState } from '@browser-os/types';

export interface LiveBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseWindowDragOptions {
  win: Window;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onFocus: (id: string) => void;
}

export function useWindowDrag({ win, onMove, onResize, onFocus }: UseWindowDragOptions) {
  const [live, setLive] = useState<LiveBounds | null>(null);
  const interaction = useRef<
    | {
        type: 'move';
        startX: number;
        startY: number;
        winX: number;
        winY: number;
        winW: number;
        winH: number;
      }
    | {
        type: 'resize';
        edge: ResizeEdge;
        startX: number;
        startY: number;
        x: number;
        y: number;
        w: number;
        h: number;
      }
    | null
  >(null);

  const bounds: LiveBounds = live ?? {
    x: win.x,
    y: win.y,
    width: win.width,
    height: win.height,
  };

  useEffect(() => {
    if (!interaction.current) {
      setLive(null);
    }
  }, [win.id, win.x, win.y, win.width, win.height, win.state]);

  const liveRef = useRef<LiveBounds | null>(null);
  liveRef.current = live;

  const endInteraction = useCallback(() => {
    const data = interaction.current;
    const b = liveRef.current;
    if (!data || !b) return;
    if (data.type === 'move') {
      onMove(win.id, b.x, b.y);
    } else if (data.type === 'resize' && onResize) {
      onResize(win.id, b.width, b.height);
      onMove(win.id, b.x, b.y);
    }
    interaction.current = null;
    setLive(null);
  }, [onMove, onResize, win.id]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const data = interaction.current;
      if (!data) return;

      if (data.type === 'move') {
        const dx = e.clientX - data.startX;
        const dy = e.clientY - data.startY;
        const nx = Math.min(
          Math.max(0, data.winX + dx),
          Math.max(0, window.innerWidth - data.winW)
        );
        const ny = Math.min(
          Math.max(28, data.winY + dy),
          Math.max(28, window.innerHeight - 88 - data.winH)
        );
        setLive({ x: nx, y: ny, width: data.winW, height: data.winH });
      } else {
        const dx = e.clientX - data.startX;
        const dy = e.clientY - data.startY;
        let { x, y, w, h } = data;
        const minW = win.minWidth;
        const minH = win.minHeight;
        const edge = data.edge;

        if (edge.includes('e')) w = Math.max(minW, data.w + dx);
        if (edge.includes('w')) {
          w = Math.max(minW, data.w - dx);
          x = data.x + (data.w - w);
        }
        if (edge.includes('s')) h = Math.max(minH, data.h + dy);
        if (edge.includes('n')) {
          h = Math.max(minH, data.h - dy);
          y = data.y + (data.h - h);
        }

        const maxW = window.innerWidth - x;
        const maxH = window.innerHeight - 80 - y;
        w = Math.min(w, maxW);
        h = Math.min(h, maxH);

        setLive({ x, y, width: w, height: h });
      }
    };

    const onPointerUp = () => endInteraction();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [endInteraction, win.minWidth, win.minHeight, win.width, win.height]);

  const startMove = useCallback(
    (e: React.PointerEvent) => {
      if (!win.movable || win.state === WindowState.MAXIMIZED) return;
      e.preventDefault();
      onFocus(win.id);
      interaction.current = {
        type: 'move',
        startX: e.clientX,
        startY: e.clientY,
        winX: bounds.x,
        winY: bounds.y,
        winW: bounds.width,
        winH: bounds.height,
      };
      setLive({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
    },
    [win.movable, win.state, onFocus, win.id, bounds]
  );

  const startResize = useCallback(
    (edge: ResizeEdge) => (e: React.PointerEvent) => {
      if (!win.resizable || win.state === WindowState.MAXIMIZED || !onResize) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus(win.id);
      interaction.current = {
        type: 'resize',
        edge,
        startX: e.clientX,
        startY: e.clientY,
        x: bounds.x,
        y: bounds.y,
        w: bounds.width,
        h: bounds.height,
      };
      setLive({ ...bounds });
    },
    [win.resizable, win.state, onResize, onFocus, win.id, bounds]
  );

  return { bounds, startMove, startResize, isDragging: live !== null };
}
