/**
 * Core System Kernel Interfaces
 * 
 * Defines the central kernel that coordinates all system components.
 */

/**
 * System event structure for the global event bus
 */
export interface SystemEvent {
  /** Event type identifier */
  type: string;
  /** Event timestamp in milliseconds */
  timestamp: number;
  /** Event payload data */
  data: any;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: SystemEvent) => void;

/**
 * Base interface for all system components
 */
export interface ISystemComponent {
  /** Unique component name */
  name: string;
  /** Initialize the component */
  initialize(): Promise<void>;
  /** Shutdown the component and cleanup resources */
  shutdown(): Promise<void>;
}

/**
 * System Kernel interface - central coordinator for all system components
 * 
 * **Validates: Requirements 1.2**
 */
export interface ISystemKernel {
  // Lifecycle
  /** Initialize the kernel and all registered components */
  initialize(): Promise<void>;
  /** Shutdown the kernel and all components */
  shutdown(): Promise<void>;
  
  // Component registry
  /** Register a system component */
  registerComponent(name: string, component: ISystemComponent): void;
  /** Get a registered component by name */
  getComponent<T>(name: string): T;
  
  // Event bus
  /** Emit a system event */
  emit(event: SystemEvent): void;
  /** Subscribe to system events */
  on(eventType: string, handler: EventHandler): void;
  /** Unsubscribe from system events */
  off(eventType: string, handler: EventHandler): void;
}
