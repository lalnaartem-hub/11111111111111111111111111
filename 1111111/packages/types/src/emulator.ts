/**
 * Emulator Interfaces
 * 
 * Defines x86/x64 instruction execution using v86.
 */

/**
 * Emulator configuration
 */
export interface EmulatorConfig {
  /** Memory size in bytes */
  memory: number;
  /** URL to BIOS file */
  biosUrl: string;
  /** URL to VGA BIOS file */
  vgaBiosUrl: string;
  /** Boot order (0 = floppy, 1 = hard disk, 2 = CD-ROM) */
  bootOrder: number;
}

/**
 * Emulator state information
 */
export interface EmulatorState {
  /** Whether emulator is currently running */
  running: boolean;
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory usage in bytes */
  memoryUsage: number;
}

/**
 * Emulator snapshot for save/restore
 */
export interface EmulatorSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** CPU state */
  cpuState: any;
  /** Memory state */
  memoryState: Uint8Array;
  /** Device states */
  deviceStates: Record<string, any>;
}

/**
 * Input event for emulator
 */
export interface InputEvent {
  /** Event type (keyboard, mouse, etc.) */
  type: 'keyboard' | 'mouse' | 'touch';
  /** Event data */
  data: any;
}

/**
 * Output handler function
 */
export type OutputHandler = (output: EmulatorOutput) => void;

/**
 * Emulator output
 */
export interface EmulatorOutput {
  /** Output type (screen, serial, etc.) */
  type: 'screen' | 'serial' | 'audio';
  /** Output data */
  data: any;
}

/**
 * Emulator interface - provides x86/x64 instruction execution
 * 
 * **Validates: Requirements 1.2**
 */
export interface IEmulator {
  // Lifecycle
  /** Initialize the emulator with configuration */
  initialize(config: EmulatorConfig): Promise<void>;
  /** Start emulation */
  start(): void;
  /** Stop emulation */
  stop(): void;
  /** Reset emulator to initial state */
  reset(): void;
  
  // Execution
  /** Load and execute a binary executable */
  loadExecutable(path: string): Promise<void>;
  
  // State
  /** Get current emulator state */
  getState(): EmulatorState;
  /** Save emulator state to snapshot */
  saveState(): Promise<EmulatorSnapshot>;
  /** Restore emulator state from snapshot */
  restoreState(snapshot: EmulatorSnapshot): Promise<void>;
  
  // I/O
  /** Send input to emulator */
  sendInput(input: InputEvent): void;
  /** Register output handler */
  onOutput(handler: OutputHandler): void;
}
