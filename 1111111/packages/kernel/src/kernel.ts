import type {
  EventHandler,
  ISystemComponent,
  ISystemKernel,
  SystemEvent,
} from '@browser-os/types';
import { ComponentRegistry } from './component-registry';
import { EventBus } from './event-bus';

const DEFAULT_INIT_ORDER = [
  'storage',
  'file-system',
  'process-manager',
  'window-manager',
  'emulator',
  'gui-shell',
] as const;

export interface KernelOptions {
  initOrder?: readonly string[];
}

export class SystemKernel implements ISystemKernel {
  private readonly registry = new ComponentRegistry();
  private readonly eventBus = new EventBus();
  private readonly initOrder: readonly string[];
  private initialized = false;

  constructor(options?: KernelOptions) {
    this.initOrder = options?.initOrder ?? DEFAULT_INIT_ORDER;
  }

  registerComponent(name: string, component: ISystemComponent): void {
    this.registry.register(name, component);
  }

  getComponent<T>(name: string): T {
    return this.registry.get<T>(name);
  }

  on(eventType: string, handler: EventHandler): void {
    this.eventBus.on(eventType, handler);
  }

  off(eventType: string, handler: EventHandler): void {
    this.eventBus.off(eventType, handler);
  }

  emit(event: SystemEvent): void {
    this.eventBus.emit(event);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const total = this.initOrder.filter((name) => this.registry.has(name)).length;
    let step = 0;

    for (const name of this.initOrder) {
      const component = this.registry.tryGet(name);
      if (!component) continue;

      step += 1;
      this.emit({
        type: 'boot:progress',
        timestamp: Date.now(),
        data: { component: name, step, total, percent: Math.round((step / total) * 100) },
      });

      this.emit({
        type: 'component:init:start',
        timestamp: Date.now(),
        data: { name },
      });

      try {
        await component.initialize();
      } catch (error) {
        console.error(`[kernel] Failed to initialize ${name}:`, error);
        this.emit({
          type: 'component:init:error',
          timestamp: Date.now(),
          data: { name, error: error instanceof Error ? error.message : String(error) },
        });
      }

      this.emit({
        type: 'component:init:complete',
        timestamp: Date.now(),
        data: { name },
      });
    }

    this.initialized = true;
    this.emit({ type: 'system:ready', timestamp: Date.now(), data: {} });
  }

  async shutdown(): Promise<void> {
    const order = [...this.initOrder].reverse();
    for (const name of order) {
      const component = this.registry.tryGet(name);
      if (!component) continue;
      try {
        await component.shutdown();
      } catch (error) {
        console.error(`[kernel] Failed to shutdown ${name}:`, error);
      }
    }
    this.initialized = false;
    this.emit({ type: 'system:shutdown', timestamp: Date.now(), data: {} });
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
