import type { StorageManager } from '@browser-os/storage-manager';

const KEY = 'appstore.installed';

const BUILTIN = new Set([
  'browser-terminal',
  'files-plus',
  'calc',
  'editor',
  'welcome',
]);

export async function loadInstalled(storage: StorageManager): Promise<Set<string>> {
  const raw = await storage.get(KEY);
  const list = Array.isArray(raw) ? (raw as string[]) : [];
  return new Set([...BUILTIN, ...list]);
}

export async function saveInstalled(storage: StorageManager, ids: Set<string>): Promise<void> {
  const custom = [...ids].filter((id) => !BUILTIN.has(id));
  await storage.set(KEY, custom);
}

export async function installApp(storage: StorageManager, id: string, current: Set<string>): Promise<Set<string>> {
  const next = new Set(current);
  next.add(id);
  await saveInstalled(storage, next);
  return next;
}

export async function uninstallApp(
  storage: StorageManager,
  id: string,
  current: Set<string>
): Promise<Set<string>> {
  if (BUILTIN.has(id)) return current;
  const next = new Set(current);
  next.delete(id);
  await saveInstalled(storage, next);
  return next;
}
