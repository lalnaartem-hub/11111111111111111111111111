import type { OsMode } from './settings';

export type ShellTheme = 'light' | 'dark';

/** Сразу применяет тему ко всей странице (html/body + CSS-переменные). */
export function applyShellTheme(theme: ShellTheme, osMode: OsMode = 'macos'): void {
  const root = document.documentElement;
  const dark = theme === 'dark';
  const appRoot = document.getElementById('root');

  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', dark);

  document.body.classList.toggle('shell-dark', dark);
  document.body.classList.toggle('shell-light', !dark);
  document.body.style.backgroundColor = dark ? '#0a0a0c' : '#000000';
  document.body.style.colorScheme = dark ? 'dark' : 'light';

  if (appRoot) {
    appRoot.classList.toggle('shell-dark', dark);
    appRoot.classList.toggle('shell-light', !dark);
    appRoot.style.colorScheme = dark ? 'dark' : 'light';
  }

  root.style.setProperty('--shell-bg', dark ? '#1a1a1e' : '#f5f5f7');
  root.style.setProperty('--shell-surface', dark ? '#2c2c2e' : '#ffffff');
  root.style.setProperty('--shell-text', dark ? '#f5f5f7' : '#1c1c1e');
  root.style.setProperty('--shell-muted', dark ? '#98989d' : '#6e6e73');
  root.style.setProperty('--shell-border', dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)');
  root.style.setProperty(
    '--desktop-dim',
    dark && osMode === 'macos' ? 'rgba(0,0,0,0.45)' : 'transparent'
  );
}

export function isShellDark(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}
