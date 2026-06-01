import V86 from 'v86/build/libv86.mjs';
import { createFat12Floppy, analyzeExecutable } from './fat12';

const FREEDOS_SIZE = 33_554_432;
const WIN98_HDA_SIZE = 300 * 1024 * 1024;
const V86_HOST = 'https://i.copy.sh/';

export type EmulatorStatus = 'idle' | 'loading' | 'running' | 'error';
export type BootProfile = 'freedos' | 'win98';

export interface EmulatorRunOptions {
  screenContainer: HTMLElement;
  memoryMB?: number;
  bootProfile?: BootProfile;
  floppyFile?: { name: string; data: Uint8Array; kind?: 'dos' | 'com' | 'pe' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type V86Instance = any;

export class V86Runtime {
  private emulator: V86Instance | null = null;
  private status: EmulatorStatus = 'idle';
  private statusListeners = new Set<(s: EmulatorStatus, msg?: string) => void>();
  private bootProfile: BootProfile = 'freedos';

  onStatus(handler: (s: EmulatorStatus, msg?: string) => void): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  private setStatus(s: EmulatorStatus, msg?: string): void {
    this.status = s;
    this.statusListeners.forEach((h) => h(s, msg));
  }

  getStatus(): EmulatorStatus {
    return this.status;
  }

  getBootProfile(): BootProfile {
    return this.bootProfile;
  }

  async start(options: EmulatorRunOptions): Promise<void> {
    this.destroy();

    const kind = options.floppyFile?.kind ?? inferKind(options.floppyFile?.data);
    const profile: BootProfile =
      options.bootProfile ?? (kind === 'pe' ? 'win98' : 'freedos');
    this.bootProfile = profile;

    const memoryMB =
      profile === 'win98'
        ? Math.max(options.memoryMB ?? 128, 128)
        : options.memoryMB ?? 64;

    if (profile === 'win98') {
      this.setStatus(
        'loading',
        'Загрузка Windows 98 (~300 МБ, первый раз может занять несколько минут)…'
      );
    } else {
      this.setStatus('loading', 'Загрузка BIOS и FreeDOS…');
    }

    const fda = options.floppyFile
      ? { buffer: createFat12Floppy(options.floppyFile.name, options.floppyFile.data) }
      : undefined;

    const base = {
      wasm_path: '/v86/v86.wasm',
      memory_size: memoryMB * 1024 * 1024,
      vga_memory_size: 4 * 1024 * 1024,
      screen_container: options.screenContainer,
      bios: { url: '/bios/seabios.bin' },
      vga_bios: { url: '/bios/vgabios.bin' },
      fda,
      autostart: true,
      disable_keyboard: false,
      mouse: true,
    };

    if (profile === 'win98') {
      this.emulator = new V86({
        ...base,
        hda: {
          url: `${V86_HOST}windows98/.img`,
          size: WIN98_HDA_SIZE,
          async: true,
          fixed_chunk_size: 256 * 1024,
          use_parts: true,
        },
        boot_order: fda ? 0x102 : 0x201,
        mac_address_translation: true,
        state: { url: `${V86_HOST}windows98_state-v2.bin.zst` },
      });
      this.emulator.add_listener('emulator-loaded', () => {
        this.setStatus(
          'running',
          fda
            ? 'Windows 98: откройте «Мой компьютер» → «Дисковод A:» → запустите .exe'
            : 'Windows 98 запущена'
        );
      });
    } else {
      this.emulator = new V86({
        ...base,
        vga_memory_size: 2 * 1024 * 1024,
        hda: {
          url: `${V86_HOST}freedos722.img`,
          async: true,
          size: FREEDOS_SIZE,
        },
        boot_order: fda ? 0x102 : 0x201,
      });
      this.emulator.add_listener('emulator-loaded', () => {
        this.setStatus('running', fda ? 'FreeDOS: перейдите на A: и запустите файл' : 'FreeDOS запущен');
      });
    }

    await this.emulator.run();
  }

  destroy(): void {
    if (this.emulator) {
      try {
        this.emulator.destroy();
      } catch {
        /* ignore */
      }
      this.emulator = null;
    }
    this.setStatus('idle');
  }

  sendScancode(scancode: number): void {
    this.emulator?.keyboard_send_scancode(scancode);
  }

  static analyzeFile(data: Uint8Array, _filename: string) {
    return analyzeExecutable(data);
  }
}

function inferKind(data?: Uint8Array): 'dos' | 'com' | 'pe' | undefined {
  if (!data) return undefined;
  return analyzeExecutable(data).kind === 'pe'
    ? 'pe'
    : analyzeExecutable(data).kind === 'dos'
      ? 'dos'
      : 'com';
}

export async function loadFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export async function loadFromPath(
  readFile: (path: string) => Promise<Uint8Array>,
  path: string
): Promise<{ name: string; data: Uint8Array }> {
  const name = path.split('/').pop() ?? 'program.exe';
  const data = await readFile(path);
  return { name, data };
}
