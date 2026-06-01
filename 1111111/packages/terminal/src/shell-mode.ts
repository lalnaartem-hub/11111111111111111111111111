export type ShellMode = 'unix' | 'windows';

export function shellPrompt(mode: ShellMode, cwd: string, user = 'user'): string {
  if (mode === 'windows') {
    const drive = cwd.startsWith('/') ? 'C:' : '';
    const winPath = cwd.replace(/\//g, '\\') || '\\';
    return `${drive}${winPath}> `;
  }
  const short = cwd === '/home' ? '~' : cwd.replace(/^\/home/, '~');
  return `${user}@browser-os:${short}$ `;
}
