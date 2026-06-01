import { useEffect, useRef, useState } from 'react';
import { Shell, shellPrompt } from '@browser-os/terminal';
import { shellModeForOs } from '../services/osTheme';
import type { IFileSystem } from '@browser-os/types';
import { useSystemStore } from '../store/system';

function ansiToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\x1b\[2J\x1b\[H/g, '')
    .replace(/\x1b\[31m/g, '<span style="color:#f87171">')
    .replace(/\x1b\[32m/g, '<span style="color:#4ade80">')
    .replace(/\x1b\[33m/g, '<span style="color:#facc15">')
    .replace(/\x1b\[0m/g, '</span>');
}

export function TerminalApp() {
  const kernel = useSystemStore((s) => s.kernel);
  const osMode = useSystemStore((s) => s.settings.osMode);
  const shellRef = useRef<Shell | null>(null);
  const [, tick] = useState(0);
  const [lines, setLines] = useState<{ text: string; type: 'out' | 'err' }[]>([
    { text: 'Browser OS Terminal — help для команд', type: 'out' },
  ]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kernel) return;
    const fs = kernel.getComponent<IFileSystem>('file-system');
    if (!shellRef.current) shellRef.current = new Shell(fs);
    shellRef.current.setMode(shellModeForOs(osMode));
    tick((n) => n + 1);
  }, [kernel, osMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const runCommand = async (raw: string) => {
    const shell = shellRef.current;
    if (!shell || !raw.trim()) return;

    setLines((prev) => [...prev, { text: `$ ${raw}`, type: 'out' }]);
    const result = await shell.execute(raw);
    if (result.stdout) {
      if (result.stdout.includes('\x1b[2J')) {
        setLines([]);
      } else {
        setLines((prev) => [...prev, { text: result.stdout, type: 'out' }]);
      }
    }
    if (result.stderr) {
      setLines((prev) => [...prev, { text: result.stderr, type: 'err' }]);
    }
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const shell = shellRef.current;
    if (!shell) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const hist = shell.getHistory();
      if (hist.length === 0) return;
      const idx = historyIndex < 0 ? hist.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(idx);
      setInput(hist[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const hist = shell.getHistory();
      const idx = historyIndex < 0 ? -1 : historyIndex + 1;
      if (idx >= hist.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(idx);
        setInput(hist[idx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completions = await shell.complete(input);
      if (completions.length === 1) {
        const parts = input.split(/\s+/);
        parts[parts.length - 1] = completions[0];
        setInput(parts.join(' ') + (completions[0].endsWith('/') ? '' : ' '));
      } else if (completions.length > 1) {
        setLines((prev) => [...prev, { text: completions.join('  '), type: 'out' }]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[200px] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs">
      <div className="flex-1 overflow-auto p-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className={line.type === 'err' ? 'text-red-400' : ''}
            dangerouslySetInnerHTML={{ __html: ansiToHtml(line.text) }}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex border-t border-[#333] p-2 gap-2 shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          void runCommand(input);
          setInput('');
          setHistoryIndex(-1);
        }}
      >
        <span className="text-[#4ec9b0] shrink-0 whitespace-pre">
          {shellRef.current
            ? shellPrompt(shellRef.current.getMode(), shellRef.current.getCwd())
            : '$ '}
        </span>
        <input
          className="flex-1 bg-transparent outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoFocus
        />
      </form>
    </div>
  );
}
