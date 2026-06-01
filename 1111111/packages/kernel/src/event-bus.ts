import type { EventHandler, SystemEvent } from '@browser-os/types';

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on(eventType: string, handler: EventHandler): void {
    let set = this.handlers.get(eventType);
    if (!set) {
      set = new Set();
      this.handlers.set(eventType, set);
    }
    set.add(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  emit(event: SystemEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    typeHandlers?.forEach((handler) => handler(event));

    const wildcard = this.handlers.get('*');
    wildcard?.forEach((handler) => handler(event));
  }
}
