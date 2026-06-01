import { focusOrLaunch } from '../bootstrap';

export type BrowserVariant = 'chromium' | 'firefox';

export function openBrowser(url = 'https://duckduckgo.com', variant: BrowserVariant = 'chromium'): void {
  void focusOrLaunch('browser', variant === 'firefox' ? 'Firefox' : 'Chromium', 960, 620, {
    initialUrl: normalizeUrl(url),
    variant,
  });
}

export function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) return 'https://duckduckgo.com';
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes('.') && !t.includes(' ')) return `https://${t}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(t)}`;
}

export function registerBrowserBridge(): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ url?: string; variant?: BrowserVariant }>).detail;
    openBrowser(detail?.url, detail?.variant);
  };
  window.addEventListener('browser-os:open-url', handler);
  return () => window.removeEventListener('browser-os:open-url', handler);
}
