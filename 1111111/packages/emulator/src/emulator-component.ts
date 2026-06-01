import type { ISystemComponent } from '@browser-os/types';
import { V86Runtime } from './v86-runtime';

export class EmulatorComponent implements ISystemComponent {
  readonly name = 'emulator';
  readonly runtime = new V86Runtime();

  async initialize(): Promise<void> {}

  async shutdown(): Promise<void> {
    this.runtime.destroy();
  }
}
