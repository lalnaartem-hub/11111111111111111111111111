import { useEffect, useState } from 'react';
import type { IFileSystem } from '@browser-os/types';
import { useSystemStore } from '../store/system';

interface TextEditorAppProps {
  initialPath?: string;
}

export function TextEditorApp({ initialPath = '/home/notes.txt' }: TextEditorAppProps) {
  const kernel = useSystemStore((s) => s.kernel);
  const [path, setPath] = useState(initialPath);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!kernel) return;
    const fs = kernel.getComponent<IFileSystem>('file-system');
    fs.readFile(path)
      .then((data) => setContent(new TextDecoder().decode(data)))
      .catch(() => setContent(''));
  }, [kernel, path]);

  const save = async () => {
    if (!kernel) return;
    const fs = kernel.getComponent<IFileSystem>('file-system');
    await fs.writeFile(path, new TextEncoder().encode(content));
    setDirty(false);
    setStatus('Сохранено');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-[240px]">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-window-border bg-macos-gray-50 text-xs">
        <input
          className="flex-1 font-mono border border-window-border rounded px-2 py-0.5"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        <button
          type="button"
          className="px-2 py-0.5 rounded bg-macos-blue text-white"
          onClick={() => void save()}
        >
          Сохранить
        </button>
        {dirty && <span className="text-amber-600">●</span>}
        {status && <span className="text-green-600">{status}</span>}
      </div>
      <textarea
        className="flex-1 w-full p-3 font-mono text-sm resize-none outline-none"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
        spellCheck={false}
      />
    </div>
  );
}
