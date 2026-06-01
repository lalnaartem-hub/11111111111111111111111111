import type { ISystemComponent } from '@browser-os/types';

export class ComponentRegistry {
  private components = new Map<string, ISystemComponent>();

  register(name: string, component: ISystemComponent): void {
    if (this.components.has(name)) {
      throw new Error(`Component already registered: ${name}`);
    }
    this.components.set(name, component);
  }

  get<T>(name: string): T {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component not found: ${name}`);
    }
    return component as T;
  }

  tryGet(name: string): ISystemComponent | undefined {
    return this.components.get(name);
  }

  has(name: string): boolean {
    return this.components.has(name);
  }
}
