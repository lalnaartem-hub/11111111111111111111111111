import type { StorageManager } from '@browser-os/storage-manager';
import type { Window } from '@browser-os/types';
import type { AppId } from '../store/system';

export interface SessionWindow {
  window: Window;
  appId: AppId;
}

export interface SessionState {
  windows: SessionWindow[];
  timestamp: number;
}

const SESSION_KEY = 'system.session';

export async function saveSession(
  storage: StorageManager,
  windows: SessionWindow[]
): Promise<void> {
  const state: SessionState = { windows, timestamp: Date.now() };
  await storage.set(SESSION_KEY, state);
}

export async function loadSession(storage: StorageManager): Promise<SessionState | null> {
  const state = await storage.get(SESSION_KEY);
  if (!state || typeof state !== 'object') return null;
  return state as SessionState;
}
