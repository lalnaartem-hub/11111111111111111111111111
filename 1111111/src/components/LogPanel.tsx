import { useEffect, useState } from 'react';
import {
  clearLogs,
  getLogEntries,
  subscribeLogs,
  type LogEntry,
} from '../services/systemLog';

export function LogPanel() {
  const [rows, setRows] = useState<readonly LogEntry[]>(() => getLogEntries());

  useEffect(() => subscribeLogs(() => setRows([...getLogEntries()])), []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">Последние события ядра и консоли</p>
        <button
          type="button"
          className="text-xs text-[#007aff] hover:underline"
          onClick={() => clearLogs()}
        >
          Очистить
        </button>
      </div>
      <div className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-gray-900 text-[11px] font-mono p-2 space-y-1">
        {rows.length === 0 ? (
          <p className="text-gray-500">Пока пусто</p>
        ) : (
          rows.slice(0, 50).map((row) => (
            <div key={row.id} className="text-gray-300">
              <span className="text-gray-500">
                {new Date(row.time).toLocaleTimeString('ru-RU')}{' '}
              </span>
              <span
                className={
                  row.level === 'error'
                    ? 'text-red-400'
                    : row.level === 'warn'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }
              >
                [{row.source}]
              </span>{' '}
              {row.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
