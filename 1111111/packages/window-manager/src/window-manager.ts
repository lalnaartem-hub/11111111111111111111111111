import type {
  ISystemComponent,
  ISystemKernel,
  IWindowManager,
  Window,
  WindowOptions,
} from '@browser-os/types';
import { WindowState } from '@browser-os/types';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

interface WindowRecord extends Window {
  savedBounds?: { x: number; y: number; width: number; height: number };
}

export class WindowManager implements IWindowManager, ISystemComponent {
  readonly name = 'window-manager';

  private windows = new Map<string, WindowRecord>();
  private activeWindowId: string | null = null;
  private nextZIndex = 10;
  private cascadeOffset = 0;

  constructor(private readonly kernel?: ISystemKernel) {}

  async initialize(): Promise<void> {
    this.windows.clear();
    this.activeWindowId = null;
    this.nextZIndex = 10;
    this.cascadeOffset = 0;
  }

  async shutdown(): Promise<void> {
    this.windows.clear();
    this.notify();
  }

  createWindow(options: WindowOptions, processId = 0): Window {
    const id = crypto.randomUUID();
    const minWidth = options.minWidth ?? MIN_WIDTH;
    const minHeight = options.minHeight ?? MIN_HEIGHT;
    const width = Math.max(options.width, minWidth);
    const height = Math.max(options.height, minHeight);

    const offset = this.cascadeOffset;
    this.cascadeOffset = (this.cascadeOffset + 28) % 200;

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const menuBarHeight = 28;
    const dockHeight = 72;

    const x = options.x ?? 80 + offset;
    const y = options.y ?? 48 + offset;
    const maxX = Math.max(0, viewportWidth - width);
    const maxY = Math.max(menuBarHeight, viewportHeight - dockHeight - height);

    const record: WindowRecord = {
      id,
      title: options.title,
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(menuBarHeight, y), maxY),
      width,
      height,
      minWidth,
      minHeight,
      zIndex: ++this.nextZIndex,
      state: WindowState.NORMAL,
      processId,
      resizable: options.resizable ?? true,
      movable: options.movable ?? true,
      closable: options.closable ?? true,
      minimizable: options.minimizable ?? true,
      maximizable: options.maximizable ?? true,
    };

    this.windows.set(id, record);
    this.focusWindow(id);
    this.notify();
    return { ...record };
  }

  closeWindow(windowId: string): void {
    if (!this.windows.delete(windowId)) return;
    if (this.activeWindowId === windowId) {
      const remaining = [...this.windows.values()].sort((a, b) => b.zIndex - a.zIndex);
      this.activeWindowId = remaining[0]?.id ?? null;
    }
    this.notify();
  }

  minimizeWindow(windowId: string): void {
    const win = this.windows.get(windowId);
    if (!win || !win.minimizable) return;
    win.state = WindowState.MINIMIZED;
    this.notify();
  }

  maximizeWindow(windowId: string): void {
    const win = this.windows.get(windowId);
    if (!win || !win.maximizable) return;
    if (win.state !== WindowState.MAXIMIZED) {
      win.savedBounds = { x: win.x, y: win.y, width: win.width, height: win.height };
      const menuBarHeight = 28;
      win.x = 0;
      win.y = menuBarHeight;
      win.width = window.innerWidth;
      win.height = window.innerHeight - menuBarHeight - 72;
      win.state = WindowState.MAXIMIZED;
    }
    this.focusWindow(windowId);
    this.notify();
  }

  restoreWindow(windowId: string): void {
    const win = this.windows.get(windowId);
    if (!win) return;
    if (win.state === WindowState.MINIMIZED) {
      win.state = WindowState.NORMAL;
      this.focusWindow(windowId);
      this.notify();
      return;
    }
    if (win.savedBounds) {
      win.x = win.savedBounds.x;
      win.y = win.savedBounds.y;
      win.width = win.savedBounds.width;
      win.height = win.savedBounds.height;
      win.savedBounds = undefined;
    }
    win.state = WindowState.NORMAL;
    this.focusWindow(windowId);
    this.notify();
  }

  moveWindow(windowId: string, x: number, y: number): void {
    const win = this.windows.get(windowId);
    if (!win || !win.movable || win.state === WindowState.MAXIMIZED) return;

    const maxX = Math.max(0, window.innerWidth - win.width);
    const maxY = Math.max(28, window.innerHeight - 72 - win.height);
    win.x = Math.min(Math.max(0, x), maxX);
    win.y = Math.min(Math.max(28, y), maxY);
    this.notify();
  }

  resizeWindow(windowId: string, width: number, height: number): void {
    const win = this.windows.get(windowId);
    if (!win || !win.resizable || win.state === WindowState.MAXIMIZED) return;

    win.width = Math.max(win.minWidth, width);
    win.height = Math.max(win.minHeight, height);
    this.moveWindow(windowId, win.x, win.y);
    this.notify();
  }

  focusWindow(windowId: string): void {
    const win = this.windows.get(windowId);
    if (!win || win.state === WindowState.MINIMIZED) return;
    win.zIndex = ++this.nextZIndex;
    this.activeWindowId = windowId;
    this.notify();
  }

  getActiveWindow(): Window | null {
    if (!this.activeWindowId) return null;
    const win = this.windows.get(this.activeWindowId);
    return win ? { ...win } : null;
  }

  getWindow(windowId: string): Window | null {
    const win = this.windows.get(windowId);
    return win ? { ...win } : null;
  }

  listWindows(): Window[] {
    return [...this.windows.values()]
      .filter((w) => w.state !== WindowState.MINIMIZED)
      .map((w) => ({ ...w }));
  }

  listAllWindows(): Window[] {
    return [...this.windows.values()].map((w) => ({ ...w }));
  }

  private notify(): void {
    this.kernel?.emit({
      type: 'windows:changed',
      timestamp: Date.now(),
      data: { windows: this.listAllWindows(), activeId: this.activeWindowId },
    });
  }
}
