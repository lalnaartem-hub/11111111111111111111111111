export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  time: number;
  level: LogLevel;
  source: string;
  message: string;
}

const MAX_ENTRIES = 200;
let nextId = 1;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

function push(level: LogLevel, source: string, message: string): void {
  entries.unshift({
    id: nextId++,
    time: Date.now(),
    level,
    source,
    message,
  });
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  listeners.forEach((l) => l());
}

export function logInfo(source: string, message: string): void {
  push('info', source, message);
}

export function logWarn(source: string, message: string): void {
  push('warn', source, message);
}

export function logError(source: string, message: string): void {
  push('error', source, message);
}

export function getLogEntries(): readonly LogEntry[] {
  return entries;
}

export function subscribeLogs(handler: () => void): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function clearLogs(): void {
  entries.length = 0;
  listeners.forEach((l) => l());
}

let consoleHooked = false;

export function hookConsole(): void {
  if (consoleHooked) return;
  consoleHooked = true;
  const orig = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };
  console.log = (...args: unknown[]) => {
    logInfo('console', args.map(String).join(' '));
    orig.log(...args);
  };
  console.warn = (...args: unknown[]) => {
    logWarn('console', args.map(String).join(' '));
    orig.warn(...args);
  };
  console.error = (...args: unknown[]) => {
    logError('console', args.map(String).join(' '));
    orig.error(...args);
  };
}
