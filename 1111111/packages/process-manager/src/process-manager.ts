import type {
  IProcessManager,
  ISystemComponent,
  IPCMessage,
  Process,
  SpawnOptions,
} from '@browser-os/types';
import { ProcessState, Signal } from '@browser-os/types';

const DEFAULT_MEMORY_LIMIT = 512 * 1024 * 1024;

interface ProcessRecord extends Process {
  executable: string;
  args: string[];
  memoryLimit: number;
  messageHandlers: Array<(message: IPCMessage) => void>;
}

export class ProcessManager implements IProcessManager, ISystemComponent {
  readonly name = 'process-manager';

  private processes = new Map<number, ProcessRecord>();
  private nextPid = 1;

  private resourceTimer: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    this.processes.clear();
    this.nextPid = 1;
    this.resourceTimer = setInterval(() => this.tickResources(), 2000);
  }

  async shutdown(): Promise<void> {
    if (this.resourceTimer) clearInterval(this.resourceTimer);
    for (const pid of [...this.processes.keys()]) {
      await this.kill(pid, Signal.SIGTERM);
    }
  }

  async spawn(
    executable: string,
    args: string[],
    options?: SpawnOptions
  ): Promise<Process> {
    const pid = this.nextPid++;
    const record: ProcessRecord = {
      pid,
      name: executable.split('/').pop() ?? executable,
      state: ProcessState.RUNNING,
      parentPid: null,
      startTime: new Date(),
      memoryUsage: 0,
      cpuUsage: 0,
      executable,
      args,
      memoryLimit: options?.memoryLimit ?? DEFAULT_MEMORY_LIMIT,
      messageHandlers: [],
    };
    record.memoryUsage = 12 * 1024 * 1024 + Math.floor(Math.random() * 8 * 1024 * 1024);
    this.processes.set(pid, record);
    return this.toProcess(record);
  }

  tickResources(): void {
    for (const record of this.processes.values()) {
      if (record.state !== ProcessState.RUNNING) continue;
      record.memoryUsage += Math.floor(Math.random() * 4096);
      record.cpuUsage = Math.min(100, record.cpuUsage + (Math.random() - 0.5) * 10);
      if (record.memoryUsage > record.memoryLimit) {
        record.state = ProcessState.TERMINATED;
        this.processes.delete(record.pid);
      }
    }
  }

  async kill(pid: number, _signal?: Signal): Promise<void> {
    const record = this.processes.get(pid);
    if (!record) return;
    record.state = ProcessState.TERMINATED;
    this.processes.delete(pid);
  }

  getProcess(pid: number): Process | null {
    const record = this.processes.get(pid);
    return record ? this.toProcess(record) : null;
  }

  listProcesses(): Process[] {
    return [...this.processes.values()]
      .filter((p) => p.state !== ProcessState.TERMINATED)
      .map((p) => this.toProcess(p));
  }

  async sendMessage(pid: number, message: IPCMessage): Promise<void> {
    const record = this.processes.get(pid);
    if (!record) throw new Error(`Process ${pid} not found`);
    record.messageHandlers.forEach((handler) => handler(message));
  }

  onMessage(pid: number, handler: (message: IPCMessage) => void): void {
    const record = this.processes.get(pid);
    if (!record) throw new Error(`Process ${pid} not found`);
    record.messageHandlers.push(handler);
  }

  private toProcess(record: ProcessRecord): Process {
    return {
      pid: record.pid,
      name: record.name,
      state: record.state,
      parentPid: record.parentPid,
      startTime: record.startTime,
      memoryUsage: record.memoryUsage,
      cpuUsage: record.cpuUsage,
    };
  }
}
