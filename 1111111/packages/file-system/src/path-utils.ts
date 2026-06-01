export function normalizePath(path: string): string {
  const trimmed = path.trim();
  const absolute = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const parts = absolute.split('/').filter((p) => p.length > 0);
  const stack: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      stack.pop();
    } else if (part !== '.') {
      stack.push(part);
    }
  }

  return stack.length === 0 ? '/' : `/${stack.join('/')}`;
}

export function joinPath(...segments: string[]): string {
  return normalizePath(segments.join('/'));
}

export function dirname(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return normalized.slice(0, lastSlash) || '/';
}

export function basename(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === '/') return '';
  return normalized.slice(normalized.lastIndexOf('/') + 1);
}

export function validatePath(path: string): void {
  if (!path.startsWith('/')) {
    throw new Error('Path must be absolute');
  }
  if (path.includes('\0')) {
    throw new Error('Invalid path');
  }
  normalizePath(path);
}

export const DEFAULT_PERMISSIONS = {
  read: true,
  write: true,
  execute: true,
} as const;
