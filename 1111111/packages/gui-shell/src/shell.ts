import type { ISystemComponent } from '@browser-os/types';

export class GuiShell implements ISystemComponent {
  readonly name = 'gui-shell';

  async initialize(): Promise<void> {
    // UI is driven by React; kernel only tracks lifecycle.
  }

  async shutdown(): Promise<void> {}
}
