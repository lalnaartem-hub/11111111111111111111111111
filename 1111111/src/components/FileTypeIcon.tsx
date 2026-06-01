interface FileTypeIconProps {
  name: string;
  isDirectory: boolean;
  size?: number;
}

export function FileTypeIcon({ name, isDirectory, size = 20 }: FileTypeIconProps) {
  const s = size;
  if (isDirectory) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" className="shrink-0" aria-hidden>
        <path
          fill="#FFC107"
          d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
        />
      </svg>
    );
  }
  const lower = name.toLowerCase();
  if (/\.(exe|com|bat)$/.test(lower)) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" className="shrink-0" aria-hidden>
        <rect x="4" y="3" width="16" height="18" rx="2" fill="#5C6BC0" />
        <text x="12" y="14" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">
          EXE
        </text>
      </svg>
    );
  }
  if (/\.(txt|md)$/.test(lower)) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" className="shrink-0" aria-hidden>
        <path fill="#90CAF9" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
        <path fill="#E3F2FD" d="M14 2v6h6" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="shrink-0" aria-hidden>
      <path fill="#B0BEC5" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
    </svg>
  );
}
