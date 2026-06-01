/**
 * Window Manager Interfaces
 * 
 * Defines window lifecycle, positioning, z-ordering, and user interactions.
 */

/**
 * Window state enumeration
 */
export enum WindowState {
  /** Normal window state */
  NORMAL = 'normal',
  /** Window is minimized */
  MINIMIZED = 'minimized',
  /** Window is maximized */
  MAXIMIZED = 'maximized',
  /** Window is in fullscreen mode */
  FULLSCREEN = 'fullscreen',
}

/**
 * Window creation options
 */
export interface WindowOptions {
  /** Window title */
  title: string;
  /** Window width in pixels */
  width: number;
  /** Window height in pixels */
  height: number;
  /** X position (optional, auto-positioned if not specified) */
  x?: number;
  /** Y position (optional, auto-positioned if not specified) */
  y?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Whether window can be resized */
  resizable?: boolean;
  /** Whether window can be moved */
  movable?: boolean;
  /** Whether window can be closed */
  closable?: boolean;
  /** Whether window can be minimized */
  minimizable?: boolean;
  /** Whether window can be maximized */
  maximizable?: boolean;
  /** Whether window has transparency */
  transparent?: boolean;
  /** Whether window has a frame/decorations */
  frame?: boolean;
}

/**
 * Window information
 */
export interface Window {
  /** Unique window identifier */
  id: string;
  /** Window title */
  title: string;
  /** X position in pixels */
  x: number;
  /** Y position in pixels */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Minimum width in pixels */
  minWidth: number;
  /** Minimum height in pixels */
  minHeight: number;
  /** Z-index for stacking order */
  zIndex: number;
  /** Current window state */
  state: WindowState;
  /** Associated process ID */
  processId: number;
  /** Whether window can be resized */
  resizable: boolean;
  /** Whether window can be moved */
  movable: boolean;
  /** Whether window can be closed */
  closable: boolean;
  /** Whether window can be minimized */
  minimizable: boolean;
  /** Whether window can be maximized */
  maximizable: boolean;
}

/**
 * Window Manager interface - controls window lifecycle and positioning
 * 
 * **Validates: Requirements 1.2**
 */
export interface IWindowManager {
  // Window lifecycle
  /** Create a new window */
  createWindow(options: WindowOptions): Window;
  /** Close a window */
  closeWindow(windowId: string): void;
  
  // Window state
  /** Minimize a window */
  minimizeWindow(windowId: string): void;
  /** Maximize a window */
  maximizeWindow(windowId: string): void;
  /** Restore a window to normal state */
  restoreWindow(windowId: string): void;
  
  // Window positioning
  /** Move a window to new coordinates */
  moveWindow(windowId: string, x: number, y: number): void;
  /** Resize a window */
  resizeWindow(windowId: string, width: number, height: number): void;
  
  // Z-order
  /** Focus a window and bring to front */
  focusWindow(windowId: string): void;
  /** Get the currently active window */
  getActiveWindow(): Window | null;
  
  // Queries
  /** Get window information by ID */
  getWindow(windowId: string): Window | null;
  /** List all windows */
  listWindows(): Window[];
}
