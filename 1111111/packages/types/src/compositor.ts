/**
 * Compositor Interfaces
 * 
 * Defines visual effects, animations, and efficient rendering.
 */

/**
 * Shadow configuration for windows
 */
export interface ShadowConfig {
  /** Horizontal shadow offset in pixels */
  offsetX: number;
  /** Vertical shadow offset in pixels */
  offsetY: number;
  /** Blur radius in pixels */
  blur: number;
  /** Shadow color (CSS color string) */
  color: string;
}

/**
 * Easing function type for animations
 */
export type EasingFunction = (t: number) => number;

/**
 * Animation configuration
 */
export interface Animation {
  /** Property to animate (e.g., 'x', 'y', 'opacity') */
  property: string;
  /** Starting value */
  from: any;
  /** Ending value */
  to: any;
  /** Duration in milliseconds */
  duration: number;
  /** Easing function */
  easing: EasingFunction;
}

/**
 * Compositor interface - handles visual effects and rendering
 * 
 * **Validates: Requirements 1.2**
 */
export interface ICompositor {
  // Rendering
  /** Trigger a render pass */
  render(): void;
  /** Mark a window or the entire scene as needing re-render */
  invalidate(windowId?: string): void;
  
  // Effects
  /** Set shadow effect for a window */
  setWindowShadow(windowId: string, shadow: ShadowConfig): void;
  /** Set opacity for a window */
  setWindowOpacity(windowId: string, opacity: number): void;
  
  // Animations
  /** Animate a window property */
  animate(windowId: string, animation: Animation): Promise<void>;
  /** Cancel ongoing animation for a window */
  cancelAnimation(windowId: string): void;
}
