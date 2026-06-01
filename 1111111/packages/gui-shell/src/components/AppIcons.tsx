/** SVG-иконки приложений в стиле macOS */
export type AppIconId =
  | 'welcome'
  | 'files'
  | 'terminal'
  | 'editor'
  | 'calculator'
  | 'taskmanager'
  | 'settings'
  | 'appstore'
  | 'emulator'
  | 'browser'
  | 'firefox';

interface IconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ id, size = 32, className = '' }: IconProps & { id: AppIconId }) {
  const s = size;
  const base = `drop-shadow-sm ${className}`;

  switch (id) {
    case 'welcome':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <defs>
            <linearGradient id="g-welcome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5ac8fa" />
              <stop offset="100%" stopColor="#007aff" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#g-welcome)" />
          <rect x="12" y="14" width="40" height="28" rx="4" fill="#fff" fillOpacity="0.95" />
          <rect x="16" y="34" width="32" height="4" rx="2" fill="#007aff" fillOpacity="0.5" />
        </svg>
      );
    case 'files':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <defs>
            <linearGradient id="g-files" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64d2ff" />
              <stop offset="100%" stopColor="#0a84ff" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#g-files)" />
          <path
            d="M20 18h16l8 8v22a4 4 0 01-4 4H20a4 4 0 01-4-4V22a4 4 0 014-4z"
            fill="#fff"
            fillOpacity="0.95"
          />
          <path d="M36 18v8h8" fill="none" stroke="#0a84ff" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    case 'terminal':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <rect width="64" height="64" rx="14" fill="#1c1c1e" />
          <rect x="10" y="12" width="44" height="40" rx="6" fill="#2c2c2e" stroke="#48484a" />
          <path
            d="M18 26l8 6-8 6"
            stroke="#30d158"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="30" y="36" width="16" height="3" rx="1.5" fill="#636366" />
        </svg>
      );
    case 'editor':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <defs>
            <linearGradient id="g-editor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#e5e5ea" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#g-editor)" stroke="#d1d1d6" strokeWidth="1" />
          <rect x="14" y="12" width="36" height="40" rx="3" fill="#fff" stroke="#c7c7cc" />
          <rect x="18" y="18" width="24" height="2" rx="1" fill="#007aff" />
          <rect x="18" y="24" width="28" height="2" rx="1" fill="#aeaeb2" />
          <rect x="18" y="30" width="20" height="2" rx="1" fill="#aeaeb2" />
        </svg>
      );
    case 'calculator':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <rect width="64" height="64" rx="14" fill="#636366" />
          <rect x="12" y="10" width="40" height="44" rx="8" fill="#1c1c1e" />
          <rect x="16" y="14" width="32" height="10" rx="3" fill="#2c2c2e" />
          <circle cx="22" cy="34" r="3" fill="#48484a" />
          <circle cx="32" cy="34" r="3" fill="#48484a" />
          <circle cx="42" cy="34" r="3" fill="#ff9f0a" />
          <circle cx="22" cy="44" r="3" fill="#48484a" />
          <circle cx="32" cy="44" r="3" fill="#48484a" />
          <circle cx="42" cy="44" r="3" fill="#ff9f0a" />
        </svg>
      );
    case 'taskmanager':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <rect width="64" height="64" rx="14" fill="#f2f2f7" stroke="#d1d1d6" />
          <rect x="12" y="36" width="8" height="16" rx="2" fill="#30d158" />
          <rect x="24" y="28" width="8" height="24" rx="2" fill="#007aff" />
          <rect x="36" y="20" width="8" height="32" rx="2" fill="#ff9f0a" />
          <rect x="48" y="32" width="8" height="20" rx="2" fill="#ff453a" />
        </svg>
      );
    case 'settings':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <defs>
            <linearGradient id="g-settings" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8e8e93" />
              <stop offset="100%" stopColor="#636366" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#g-settings)" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="#fff" strokeWidth="3" />
          <circle cx="32" cy="32" r="5" fill="#fff" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx={32 + 14 * Math.cos((deg * Math.PI) / 180)}
              cy={32 + 14 * Math.sin((deg * Math.PI) / 180)}
              r="3"
              fill="#fff"
            />
          ))}
        </svg>
      );
    case 'emulator':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <rect width="64" height="64" rx="14" fill="#1c1c1e" />
          <rect x="8" y="10" width="48" height="32" rx="4" fill="#30d158" fillOpacity="0.2" stroke="#30d158" />
          <text x="32" y="32" textAnchor="middle" fill="#30d158" fontSize="11" fontFamily="monospace">
            x86
          </text>
          <rect x="14" y="46" width="36" height="6" rx="2" fill="#636366" />
        </svg>
      );
    case 'browser':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <defs>
            <linearGradient id="g-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4285f4" />
              <stop offset="33%" stopColor="#ea4335" />
              <stop offset="66%" stopColor="#fbbc05" />
              <stop offset="100%" stopColor="#34a853" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#g-chrome)" />
          <circle cx="32" cy="32" r="12" fill="#fff" />
        </svg>
      );
    case 'firefox':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <circle cx="32" cy="32" r="28" fill="#ff7139" />
          <circle cx="38" cy="28" r="14" fill="#ff9500" opacity="0.9" />
          <ellipse cx="28" cy="38" rx="10" ry="8" fill="#ffcd9b" opacity="0.5" />
        </svg>
      );
    case 'appstore':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" className={base} aria-hidden>
          <defs>
            <linearGradient id="g-store" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5e5ce6" />
              <stop offset="100%" stopColor="#007aff" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#g-store)" />
          <path
            d="M32 14L48 44H16L32 14z"
            fill="#fff"
            fillOpacity="0.95"
            stroke="#fff"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="48" r="4" fill="#fff" fillOpacity="0.9" />
        </svg>
      );
    default:
      return null;
  }
}
