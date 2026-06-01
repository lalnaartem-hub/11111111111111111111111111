import { useSystemStore } from '../store/system';

export function useShellDark(): boolean {
  return useSystemStore((s) => s.settings.theme === 'dark');
}
