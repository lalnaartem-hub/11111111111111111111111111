/**
 * Process Manager Interfaces
 * 
 * Defines process lifecycle, resource management, and inter-process communication.
 */

import { WindowOptions } from './window-manager';

/**
 * Process state enumeration
 */
export enum ProcessState {
  /** Process is currently running */
  RUNNING = 'running',
  /** Process is paused */
  PAUSED = 'paused',
  /** Process has terminated */
  TERMINATED = 'terminated',
}

/**
 * Process signal types
 */
export enum Signal {
  /** Terminate signal */
  SIGTERM = 'SIGTERM',
  /** Kill signal (force terminate) */
  SIGKILL = 'SIGKILL',
  /** Interrupt signal */
  SIGINT = 'SIGINT',
  /** Stop signal */
  SIGSTOP = 'SIGSTOP',
  /** Continue signal */
  SIGCONT = 'SIGCONT',
}

/**
 * Process spawn options
 */
export interface SpawnOptions {
  /** Current working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Memory limit in bytes */
  memoryLimit?: number;
  /** Window options if process needs a window */
  windowOptions?: WindowOptions;
}

/**
 * Process information
 */
export interface Process {
  /** Unique process identifier */
  pid: number;
  /** Process name */
  name: string;
  /** Current process state */
  state: ProcessState;
  /** Parent process ID (null for root processes) */
  parentPid: number | null;
  /** Process start time */
  startTime: Date;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Current CPU usage percentage (0-100) */
  cpuUsage: number;
}

/**
 * Inter-process communication message
 */
export interface IPCMessage {
  /** Sender process ID */
  from: number;
  /** Recipient process ID */
  to: number;
  /** Message type */
  type: string;
  /** Message payload */
  data: any;
  /** Message timestamp */
  timestamp: number;
}

/**
 * IPC message handler function
 */
export type MessageHandler = (message: IPCMessage) => void;

/**
 * Process Manager interface - manages application lifecycle and IPC
 * 
 * **Validates: Requirements 1.2**
 */
export interface IProcessManager {
  // Process lifecycle
  /** Spawn a new process */
  spawn(executable: string, args: string[], options?: SpawnOptions): Promise<Process>;
  /** Terminate a process */
  kill(pid: number, signal?: Signal): Promise<void>;
  
  // Process queries
  /** Get process information by PID */
  getProcess(pid: number): Process | null;
  /** List all processes */
  listProcesses(): Process[];
  
  // IPC
  /** Send a message to a process */
  sendMessage(pid: number, message: IPCMessage): Promise<void>;
  /** Register a message handler for a process */
  onMessage(pid: number, handler: MessageHandler): void;
}
