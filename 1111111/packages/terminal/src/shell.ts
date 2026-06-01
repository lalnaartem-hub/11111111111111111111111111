import type { CommandResult, IFileSystem } from '@browser-os/types';
import { joinPath, normalizePath } from '@browser-os/file-system';
import type { ShellMode } from './shell-mode';

export class Shell {
  private cwd = '/home';
  private mode: ShellMode = 'unix';
  private env: Record<string, string> = {
    HOME: '/home',
    USER: 'user',
    SHELL: '/bin/bash',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOSTNAME: 'browser-os',
  };
  private history: string[] = [];
  private fakePackages = new Set(['curl', 'git', 'vim', 'htop', 'neofetch']);

  constructor(private readonly fs: IFileSystem) {}

  setMode(mode: ShellMode): void {
    this.mode = mode;
    this.env.SHELL = mode === 'windows' ? 'cmd.exe' : '/bin/bash';
  }

  getMode(): ShellMode {
    return this.mode;
  }

  getCwd(): string {
    return this.cwd;
  }

  setCwd(path: string): void {
    this.cwd = normalizePath(path);
  }

  getHistory(): string[] {
    return [...this.history];
  }

  setEnv(key: string, value: string): void {
    this.env[key] = value;
  }

  getEnv(key: string): string | undefined {
    return this.env[key];
  }

  async execute(commandLine: string): Promise<CommandResult> {
    const trimmed = commandLine.trim();
    if (!trimmed) return { exitCode: 0, stdout: '', stderr: '' };

    this.history.push(trimmed);

    try {
      const segments = this.parsePipeline(trimmed);
      let lastStdout = '';

      for (const segment of segments) {
        const { cmd, args, redirects } = this.parseSegment(segment);
        const input = redirects.stdinFile
          ? new TextDecoder().decode(await this.fs.readFile(redirects.stdinFile))
          : lastStdout;
        const result = await this.runCommand(cmd, args, input);
        if (result.exitCode !== 0) return result;

        if (redirects.stdoutFile) {
          const data = new TextEncoder().encode(result.stdout);
          if (redirects.stdoutAppend) {
            const existing = await this.fs.readFile(redirects.stdoutFile).catch(() => new Uint8Array());
            const merged = new Uint8Array(existing.length + data.length);
            merged.set(existing);
            merged.set(data, existing.length);
            await this.fs.writeFile(redirects.stdoutFile, merged);
          } else {
            await this.fs.writeFile(redirects.stdoutFile, data);
          }
          lastStdout = '';
        } else {
          lastStdout = result.stdout;
        }
      }

      return { exitCode: 0, stdout: lastStdout, stderr: '' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 1, stdout: '', stderr: message };
    }
  }

  async complete(partial: string): Promise<string[]> {
    const trimmed = partial.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length <= 1) {
      const cmds =
        this.mode === 'windows'
          ? ['dir', 'cd', 'cls', 'type', 'copy', 'del', 'md', 'rd', 'echo', 'help', 'ver', 'tree']
          : [
              'ls',
              'cd',
              'pwd',
              'mkdir',
              'rm',
              'cp',
              'mv',
              'cat',
              'echo',
              'clear',
              'help',
              'whoami',
              'uname',
              'touch',
              'grep',
              'find',
              'head',
              'tail',
              'wc',
              'chmod',
              'sudo',
              'apt',
              'export',
              'env',
              'date',
              'hostname',
              'which',
              'history',
              'neofetch',
              'htop',
              'firefox',
              'chromium',
              'nmap',
              'curl',
              'nano',
              'vim',
              'ip',
              'ifconfig',
              'ping',
              'python3',
              'git',
              'df',
            ];
      return cmds.filter((c) => c.startsWith(parts[0] ?? ''));
    }
    const last = parts[parts.length - 1] ?? '';
    const dir = last.includes('/') ? dirnameOf(last) : this.cwd;
    const prefix = basenameOf(last);
    try {
      const entries = await this.fs.readDir(dir);
      return entries
        .map((entry) => {
          const name = entry.name + (entry.type === 'directory' ? '/' : '');
          const base = last.includes('/') ? `${dirnameOf(last)}/` : '';
          return base + name;
        })
        .filter((n) => n.startsWith(last) || n.includes(prefix));
    } catch {
      return [];
    }
  }

  private parsePipeline(line: string): string[] {
    return line.split('|').map((s) => s.trim());
  }

  private parseSegment(segment: string): {
    cmd: string;
    args: string[];
    redirects: Redirects;
  } {
    const redirects: Redirects = {};
    const tokens: string[] = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(segment)) !== null) {
      tokens.push(m[1] ?? m[2] ?? m[3]);
    }

    const args: string[] = [];
    let cmd = '';
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === '>' && tokens[i + 1]) {
        redirects.stdoutFile = this.resolve(tokens[++i]);
        redirects.stdoutAppend = false;
        continue;
      }
      if (t === '>>' && tokens[i + 1]) {
        redirects.stdoutFile = this.resolve(tokens[++i]);
        redirects.stdoutAppend = true;
        continue;
      }
      if (t === '<' && tokens[i + 1]) {
        redirects.stdin = undefined;
        redirects.stdinFile = this.resolve(tokens[++i]);
        continue;
      }
      if (!cmd) cmd = t;
      else args.push(t);
    }
    return { cmd, args, redirects };
  }

  private async runCommand(
    cmd: string,
    args: string[],
    pipeInput: string
  ): Promise<CommandResult> {
    if (this.mode === 'windows') {
      return this.runWindowsCommand(cmd, args, pipeInput);
    }
    return this.runUnixCommand(cmd, args, pipeInput);
  }

  private async runWindowsCommand(
    cmd: string,
    args: string[],
    stdin: string
  ): Promise<CommandResult> {
    const lower = cmd.toLowerCase();
    switch (lower) {
      case 'help':
        return {
          exitCode: 0,
          stdout:
            'dir cd cls type copy del md rd ren echo ver tree\nПример: dir C:\\Users',
          stderr: '',
        };
      case 'cls':
      case 'clear':
        return { exitCode: 0, stdout: '\x1b[2J\x1b[H', stderr: '' };
      case 'ver':
        return { exitCode: 0, stdout: 'Browser OS [Version 10.0.22631.0]\n', stderr: '' };
      case 'echo':
        return { exitCode: 0, stdout: (args.join(' ') || stdin) + '\r\n', stderr: '' };
      case 'cd':
      case 'chdir': {
        const target = args[0] ? this.resolve(args[0].replace(/\\/g, '/')) : this.env.HOME ?? '/home';
        if (!(await this.fs.exists(target))) {
          return { exitCode: 1, stdout: '', stderr: `The system cannot find the path specified.\r\n` };
        }
        this.cwd = target;
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'dir': {
        const pathArg = args.find((a) => !a.startsWith('/') && !a.startsWith('-'));
        const path = pathArg ? this.resolve(pathArg) : this.cwd;
        const entries = await this.fs.readDir(path);
        const wide = args.some((a) => a.toLowerCase() === '/w');
        if (wide) {
          const cols = entries.map((e) => e.name.padEnd(14)).join(' ');
          return { exitCode: 0, stdout: ` Directory of ${path}\r\n\r\n${cols}\r\n`, stderr: '' };
        }
        let out = ` Volume in drive C is BROWSER-OS\r\n Directory of ${path}\r\n\r\n`;
        for (const e of entries) {
          const tag = e.type === 'directory' ? '<DIR>' : '';
          const dt = new Date(e.modifiedAt).toLocaleDateString('en-US');
          const tm = new Date(e.modifiedAt).toLocaleTimeString('en-US', { hour12: true });
          out += `${dt.padEnd(10)} ${tm.padEnd(10)} ${tag.padEnd(6)} ${e.name}\r\n`;
        }
        out += `\r\n${entries.length} File(s)\r\n`;
        return { exitCode: 0, stdout: out, stderr: '' };
      }
      case 'type': {
        if (!args[0]) return { exitCode: 1, stdout: '', stderr: 'Required parameter missing\r\n' };
        const data = await this.fs.readFile(this.resolve(args[0]));
        return { exitCode: 0, stdout: new TextDecoder().decode(data), stderr: '' };
      }
      case 'copy': {
        if (args.length < 2) return { exitCode: 1, stdout: '', stderr: 'The syntax of the command is incorrect.\r\n' };
        await this.fs.copy(this.resolve(args[0]), this.resolve(args[1]));
        return { exitCode: 0, stdout: '        1 file(s) copied.\r\n', stderr: '' };
      }
      case 'del':
      case 'erase': {
        for (const a of args) {
          const full = this.resolve(a);
          const stat = await this.fs.stat(full);
          if (stat.isDirectory) await this.fs.deleteDir(full, true);
          else await this.fs.deleteFile(full);
        }
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'md':
      case 'mkdir': {
        for (const a of args) await this.fs.createDir(this.resolve(a));
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'rd':
      case 'rmdir': {
        for (const a of args) await this.fs.deleteDir(this.resolve(a), true);
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'ren':
      case 'rename': {
        if (args.length < 2) return { exitCode: 1, stdout: '', stderr: 'The syntax of the command is incorrect.\r\n' };
        await this.fs.move(this.resolve(args[0]), this.resolve(args[1]));
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'tree': {
        const path = args[0] ? this.resolve(args[0]) : this.cwd;
        const tree = await this.buildTree(path, '', 0, 3);
        return { exitCode: 0, stdout: tree + '\r\n', stderr: '' };
      }
      default:
        return { exitCode: 1, stdout: '', stderr: `'${cmd}' is not recognized as an internal or external command.\r\n` };
    }
  }

  private async buildTree(path: string, prefix: string, depth: number, maxDepth: number): Promise<string> {
    if (depth > maxDepth) return '';
    const name = path.split('/').pop() || path;
    let out = `${prefix}${name}\r\n`;
    if (depth >= maxDepth) return out;
    try {
      const entries = await this.fs.readDir(path);
      for (const e of entries) {
        if (e.type === 'directory') {
          out += await this.buildTree(e.path, prefix + '  ', depth + 1, maxDepth);
        }
      }
    } catch {
      /* ignore */
    }
    return out;
  }

  private async runUnixCommand(
    cmd: string,
    args: string[],
    pipeInput: string
  ): Promise<CommandResult> {
    const stdin = pipeInput;

    switch (cmd) {
      case 'help':
        return {
          exitCode: 0,
          stdout:
            'GNU/Linux shell (Browser OS)\n' +
            'ls -la  cd  pwd  mkdir  rm  cp  mv  cat  echo  clear  touch\n' +
            'grep  find  head  tail  wc  chmod  sudo  apt  export  env\n' +
            'whoami  uname  hostname  date  which  history\n' +
            'Перенаправление: cmd > file, cmd >> file, cmd < file | pipe',
          stderr: '',
        };
      case 'whoami':
        return { exitCode: 0, stdout: `${this.env.USER}\n`, stderr: '' };
      case 'hostname':
        return { exitCode: 0, stdout: `${this.env.HOSTNAME}\n`, stderr: '' };
      case 'uname':
        return {
          exitCode: 0,
          stdout: args.includes('-a')
            ? 'Linux browser-os 6.5.0-browser #1 SMP x86_64 GNU/Linux\n'
            : 'Linux\n',
          stderr: '',
        };
      case 'date':
        return { exitCode: 0, stdout: new Date().toString() + '\n', stderr: '' };
      case 'env':
        return {
          exitCode: 0,
          stdout: Object.entries(this.env)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n') + '\n',
          stderr: '',
        };
      case 'export': {
        const eq = args[0]?.indexOf('=');
        if (eq && eq > 0) {
          const key = args[0].slice(0, eq);
          this.env[key] = args[0].slice(eq + 1);
          return { exitCode: 0, stdout: '', stderr: '' };
        }
        return { exitCode: 1, stdout: '', stderr: 'export: invalid syntax\n' };
      }
      case 'history':
        return {
          exitCode: 0,
          stdout: this.history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') + '\n',
          stderr: '',
        };
      case 'which':
        return {
          exitCode: 0,
          stdout: args[0] ? `/usr/bin/${args[0]}\n` : '',
          stderr: args[0] ? '' : 'which: missing argument\n',
        };
      case 'sudo': {
        const rest = args.join(' ').trim();
        if (!rest) return { exitCode: 1, stdout: '', stderr: 'usage: sudo <command>\n' };
        return this.execute(rest);
      }
      case 'apt': {
        const sub = args[0];
        if (sub === 'update') {
          return {
            exitCode: 0,
            stdout: 'Hit:1 http://archive.browser-os/ubuntu jammy InRelease\nReading package lists... Done\n',
            stderr: '',
          };
        }
        if (sub === 'install' && args[1]) {
          this.fakePackages.add(args[1]);
          return {
            exitCode: 0,
            stdout: `Reading package lists... Done\nBuilding dependency tree... Done\nSetting up ${args[1]} (1.0.0) ...\n`,
            stderr: '',
          };
        }
        return { exitCode: 1, stdout: '', stderr: 'E: Invalid operation apt\n' };
      }
      case 'touch': {
        for (const a of args) {
          const p = this.resolve(a);
          if (!(await this.fs.exists(p))) {
            await this.fs.writeFile(p, new Uint8Array());
          }
        }
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'grep': {
        const pattern = args[0];
        const paths = args.slice(1).length ? args.slice(1) : [this.cwd];
        let out = '';
        for (const p of paths) {
          const full = this.resolve(p);
          const stat = await this.fs.stat(full);
          if (stat.isDirectory) {
            const entries = await this.fs.readDir(full);
            for (const e of entries) {
              if (e.type !== 'file') continue;
              const text = new TextDecoder().decode(await this.fs.readFile(e.path));
              if (text.includes(pattern)) out += `${e.path}:${text.split('\n').find((l) => l.includes(pattern))}\n`;
            }
          } else {
            const text = new TextDecoder().decode(await this.fs.readFile(full));
            for (const line of text.split('\n')) {
              if (line.includes(pattern)) out += `${line}\n`;
            }
          }
        }
        return { exitCode: 0, stdout: out, stderr: '' };
      }
      case 'find': {
        const start = args[0] ? this.resolve(args[0]) : this.cwd;
        const lines: string[] = [];
        await this.walkFind(start, lines);
        return { exitCode: 0, stdout: lines.join('\n') + (lines.length ? '\n' : ''), stderr: '' };
      }
      case 'head':
      case 'tail': {
        const n = parseInt(args.find((a) => a.startsWith('-'))?.slice(1) ?? '10', 10);
        const path = args.find((a) => !a.startsWith('-'));
        if (!path) return { exitCode: 1, stdout: '', stderr: `${cmd}: missing file\n` };
        const text = new TextDecoder().decode(await this.fs.readFile(this.resolve(path)));
        const lines = text.split('\n');
        const slice = cmd === 'head' ? lines.slice(0, n) : lines.slice(-n);
        return { exitCode: 0, stdout: slice.join('\n') + '\n', stderr: '' };
      }
      case 'wc': {
        const path = args[args.length - 1];
        if (!path) return { exitCode: 1, stdout: '', stderr: 'wc: missing file\n' };
        const text = new TextDecoder().decode(await this.fs.readFile(this.resolve(path)));
        const lines = text.split('\n').length;
        const words = text.split(/\s+/).filter(Boolean).length;
        return {
          exitCode: 0,
          stdout: ` ${lines} ${words} ${text.length} ${path}\n`,
          stderr: '',
        };
      }
      case 'chmod':
        return { exitCode: 0, stdout: '', stderr: '' };
      case 'firefox':
      case 'chromium':
      case 'google-chrome': {
        const url = args[0] ?? 'https://duckduckgo.com';
        dispatchOpenUrl(url, cmd === 'firefox' ? 'firefox' : 'chromium');
        return { exitCode: 0, stdout: `Opening ${url}\n`, stderr: '' };
      }
      case 'xdg-open': {
        const target = args[0] ?? '';
        if (target.startsWith('http')) {
          dispatchOpenUrl(target, 'chromium');
          return { exitCode: 0, stdout: '', stderr: '' };
        }
        dispatchOpenApp('editor', { path: this.resolve(target) });
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'nano':
      case 'vim':
      case 'vi': {
        const p = args[0] ? this.resolve(args[0]) : `${this.cwd}/file.txt`;
        dispatchOpenApp('editor', { path: p });
        return { exitCode: 0, stdout: `Opened ${p} in editor\n`, stderr: '' };
      }
      case 'curl': {
        const url = args[args.length - 1] ?? 'https://duckduckgo.com';
        dispatchOpenUrl(url, 'chromium');
        return { exitCode: 0, stdout: `HTTP/1.1 200 OK\nOpened in browser: ${url}\n`, stderr: '' };
      }
      case 'ping': {
        const host = args[0] ?? '127.0.0.1';
        return {
          exitCode: 0,
          stdout: `PING ${host} 56(84) bytes of data.\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.4 ms\n`,
          stderr: '',
        };
      }
      case 'ip':
      case 'ifconfig':
        return {
          exitCode: 0,
          stdout:
            'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n' +
            '    inet 10.0.2.15  netmask 255.255.255.0\n' +
            '    inet6 fe80::5054:ff:fe12:3456  prefixlen 64\n',
          stderr: '',
        };
      case 'nmap': {
        const host = args[args.length - 1] ?? '127.0.0.1';
        return {
          exitCode: 0,
          stdout:
            `Starting Nmap 7.94 ( https://nmap.org )\n` +
            `Nmap scan report for ${host}\n` +
            `PORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n`,
          stderr: '',
        };
      }
      case 'python3':
      case 'python':
        return {
          exitCode: 0,
          stdout: 'Python 3.11.2 (Browser OS)\n>>> exit()\n',
          stderr: '',
        };
      case 'git':
        return {
          exitCode: 0,
          stdout: `git version 2.39.0 (browser-os)\n${args.join(' ') || 'status'}\n`,
          stderr: '',
        };
      case 'df':
        return {
          exitCode: 0,
          stdout: 'Filesystem      Size  Used Avail Use% Mounted on\nbrowser-os      512M  128M  384M  25% /\n',
          stderr: '',
        };
      case 'neofetch':
        return {
          exitCode: 0,
          stdout: [
            '       .---.   user@browser-os',
            '      /     \\  ---------------',
            '      \\.@-@./  OS: Browser OS Linux x86_64',
            "       '---'   Kernel: 6.5.0-browser",
            '       |   |    Shell: bash',
            '       |   |    Terminal: Browser OS',
            "       '---'",
          ].join('\n') + '\n',
          stderr: '',
        };
      case 'htop':
        return {
          exitCode: 0,
          stdout:
            '  PID USER  CPU% MEM%  COMMAND\n' +
            '    1 root   2.1  12M  systemd\n' +
            '  142 user   0.5   8M  bash\n' +
            '  201 user   1.2  24M  browser-os-gui\n',
          stderr: '',
        };
      case 'clear':
        return { exitCode: 0, stdout: '\x1b[2J\x1b[H', stderr: '' };
      case 'pwd':
        return { exitCode: 0, stdout: this.cwd + '\n', stderr: '' };
      case 'echo':
        return { exitCode: 0, stdout: (args.join(' ') || stdin) + '\n', stderr: '' };
      case 'cd': {
        const target = args[0] ? this.resolve(args[0]) : this.env.HOME ?? '/home';
        if (!(await this.fs.exists(target))) {
          return { exitCode: 1, stdout: '', stderr: `cd: ${target}: No such directory\n` };
        }
        const stat = await this.fs.stat(target);
        if (!stat.isDirectory) {
          return { exitCode: 1, stdout: '', stderr: `cd: not a directory: ${target}\n` };
        }
        this.cwd = target;
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'ls': {
        const flags = args.filter((a) => a.startsWith('-')).join('');
        const pathArgs = args.filter((a) => !a.startsWith('-'));
        const path = pathArgs[0] ? this.resolve(pathArgs[0]) : this.cwd;
        const entries = await this.fs.readDir(path);
        if (flags.includes('l')) {
          let out = `total ${entries.length}\n`;
          for (const e of entries) {
            const perm = e.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = String(e.size).padStart(6);
            const date = new Date(e.modifiedAt).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            out += `${perm} 1 ${this.env.USER} ${this.env.USER} ${size} ${date} ${e.name}${e.type === 'directory' ? '/' : ''}\n`;
          }
          return { exitCode: 0, stdout: out, stderr: '' };
        }
        const lines = entries.map((e) => {
          const suffix = e.type === 'directory' ? '/' : '';
          return `${e.name}${suffix}`;
        });
        const cols = flags.includes('1') ? lines.join('\n') : lines.join('  ');
        return { exitCode: 0, stdout: cols + (lines.length ? '\n' : ''), stderr: '' };
      }
      case 'mkdir': {
        for (const a of args) {
          await this.fs.createDir(this.resolve(a));
        }
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'rm': {
        const recursive = args.includes('-r') || args.includes('-rf');
        const paths = args.filter((a) => !a.startsWith('-'));
        for (const p of paths) {
          const full = this.resolve(p);
          const stat = await this.fs.stat(full);
          if (stat.isDirectory) await this.fs.deleteDir(full, recursive);
          else await this.fs.deleteFile(full);
        }
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'cp': {
        if (args.length < 2) {
          return { exitCode: 1, stdout: '', stderr: 'cp: missing operands\n' };
        }
        await this.fs.copy(this.resolve(args[0]), this.resolve(args[1]));
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'mv': {
        if (args.length < 2) {
          return { exitCode: 1, stdout: '', stderr: 'mv: missing operands\n' };
        }
        await this.fs.move(this.resolve(args[0]), this.resolve(args[1]));
        return { exitCode: 0, stdout: '', stderr: '' };
      }
      case 'cat': {
        const paths = args.length ? args : [];
        if (paths.length === 0 && stdin) {
          return { exitCode: 0, stdout: stdin, stderr: '' };
        }
        let out = '';
        for (const p of paths) {
          const data = await this.fs.readFile(this.resolve(p));
          out += new TextDecoder().decode(data);
        }
        return { exitCode: 0, stdout: out, stderr: '' };
      }
      default:
        if (cmd.startsWith('#!') || cmd.endsWith('.sh')) {
          return { exitCode: 0, stdout: stdin, stderr: '' };
        }
        return { exitCode: 127, stdout: '', stderr: `${cmd}: command not found\n` };
    }
  }

  private async walkFind(path: string, lines: string[]): Promise<void> {
    lines.push(path);
    try {
      const entries = await this.fs.readDir(path);
      for (const e of entries) {
        if (e.type === 'directory') await this.walkFind(e.path, lines);
        else lines.push(e.path);
      }
    } catch {
      /* ignore */
    }
  }

  private resolve(path: string): string {
    const p = path.replace(/\\/g, '/');
    if (p.startsWith('/')) return normalizePath(p);
    if (p === '~' || p.startsWith('~/')) {
      return normalizePath(joinPath(this.env.HOME ?? '/home', p.slice(2)));
    }
    return normalizePath(joinPath(this.cwd, p));
  }
}

interface Redirects {
  stdin?: string;
  stdinFile?: string;
  stdoutFile?: string;
  stdoutAppend?: boolean;
}

function dirnameOf(p: string): string {
  const i = p.lastIndexOf('/');
  return i <= 0 ? '/' : p.slice(0, i);
}

function basenameOf(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? p : p.slice(i + 1);
}

function dispatchOpenUrl(url: string, variant: 'chromium' | 'firefox'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('browser-os:open-url', { detail: { url, variant } })
  );
}

function dispatchOpenApp(appId: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('browser-os:open-app', { detail: { appId, props } }));
}
