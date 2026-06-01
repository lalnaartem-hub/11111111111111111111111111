import { useState } from 'react';
import type { BrowserVariant } from '../services/browser';
import { normalizeUrl } from '../services/browser';

interface BrowserAppProps {
  initialUrl?: string;
  variant?: BrowserVariant;
}

const QUICK = [
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
  { label: 'Wikipedia', url: 'https://ru.wikipedia.org/wiki/Kali_Linux' },
  { label: 'Kali.org', url: 'https://www.kali.org/' },
  { label: 'GitHub', url: 'https://github.com/' },
];

export function BrowserApp({ initialUrl, variant = 'chromium' }: BrowserAppProps) {
  const isFirefox = variant === 'firefox';
  const home = normalizeUrl(initialUrl ?? 'https://duckduckgo.com/');
  const [input, setInput] = useState(home);
  const [frameUrl, setFrameUrl] = useState(home);
  const [note, setNote] = useState<string | null>(null);

  const openExternal = (raw: string) => {
    const url = normalizeUrl(raw);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) {
      setNote('Браузер заблокировал вкладку. Разрешите всплывающие окна для localhost.');
    } else {
      setNote(null);
    }
  };

  const tryEmbed = (raw: string) => {
    const url = normalizeUrl(raw);
    setInput(url);
    setFrameUrl(url);
    setNote('Если экран пустой — нажмите «Новая вкладка» (сайт блокирует встраивание).');
  };

  return (
    <div
      className={`flex flex-col h-full min-h-[400px] ${
        isFirefox ? 'bg-[#1c1b22] text-gray-100' : 'bg-[#f5f5f7] text-gray-900'
      }`}
    >
      <div
        className={`flex flex-wrap items-center gap-2 p-2 border-b shrink-0 ${
          isFirefox ? 'border-[#393443] bg-[#2b2a33]' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${
            isFirefox ? 'bg-[#ff7139]' : 'bg-[#1a73e8]'
          }`}
          onClick={() => openExternal(input)}
        >
          ↗ Новая вкладка
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs border border-current opacity-80 hover:opacity-100"
          onClick={() => tryEmbed(input)}
        >
          В окне
        </button>
        <form
          className="flex flex-1 min-w-[140px] gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            openExternal(input);
          }}
        >
          <input
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm outline-none border ${
              isFirefox
                ? 'bg-[#1c1b22] border-[#393443] text-white'
                : 'bg-white border-gray-300'
            }`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Адрес или поиск…"
          />
        </form>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            isFirefox ? 'text-[#ff7139] bg-[#ff7139]/15' : 'text-[#1a73e8] bg-blue-50'
          }`}
        >
          {isFirefox ? 'Firefox' : 'Chromium'}
        </span>
      </div>

      {note && (
        <p className={`text-xs px-3 py-2 shrink-0 ${isFirefox ? 'text-amber-400' : 'text-amber-700'}`}>
          {note}
        </p>
      )}

      <div className="flex flex-wrap gap-1 px-2 py-1 shrink-0">
        {QUICK.map((q) => (
          <button
            key={q.url}
            type="button"
            className={`px-2 py-1 rounded text-[11px] ${
              isFirefox ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => openExternal(q.url)}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="flex-1 relative min-h-[240px] bg-white border-t border-gray-200">
        <iframe
          key={frameUrl}
          title="Browser"
          src={frameUrl}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen; clipboard-read; clipboard-write; autoplay"
        />
      </div>

      <p className={`text-[10px] px-3 py-2 shrink-0 ${isFirefox ? 'text-gray-500' : 'text-gray-500'}`}>
        Рекомендуем «Новая вкладка» — так открываются Google, YouTube и любые сайты. «В окне» работает
        для DuckDuckGo, Wikipedia и части сайтов.
      </p>
    </div>
  );
}
