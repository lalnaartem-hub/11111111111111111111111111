import { useEffect, useState } from 'react';
import type { IProcessManager, Process } from '@browser-os/types';
import { ProcessState, Signal } from '@browser-os/types';
import { useSystemStore } from '../store/system';

export function TaskManagerApp() {
  const kernel = useSystemStore((s) => s.kernel);
  const [processes, setProcesses] = useState<Process[]>([]);

  useEffect(() => {
    if (!kernel) return;
    const pm = kernel.getComponent<IProcessManager>('process-manager');
    const tick = () => setProcesses(pm.listProcesses());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [kernel]);

  const kill = async (pid: number) => {
    if (!kernel || !confirm(`Завершить процесс ${pid}?`)) return;
    const pm = kernel.getComponent<IProcessManager>('process-manager');
    await pm.kill(pid, Signal.SIGTERM);
    setProcesses(pm.listProcesses());
  };

  const totalMem = processes.reduce((s, p) => s + p.memoryUsage, 0);
  const memWarning = totalMem > 400 * 1024 * 1024;

  return (
    <div className="p-3 text-xs h-full overflow-auto">
      {memWarning && (
        <p className="mb-2 text-amber-700 bg-amber-50 px-2 py-1 rounded">
          Использование памяти выше 400 МБ
        </p>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b border-window-border text-macos-gray-500">
            <th className="py-1">PID</th>
            <th>Имя</th>
            <th>Состояние</th>
            <th>Память</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr key={p.pid} className="border-b border-window-border/50">
              <td className="py-1 font-mono">{p.pid}</td>
              <td>{p.name}</td>
              <td>{p.state}</td>
              <td>{(p.memoryUsage / 1024).toFixed(0)} KB</td>
              <td>
                {p.state === ProcessState.RUNNING && (
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => void kill(p.pid)}
                  >
                    Завершить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {processes.length === 0 && (
        <p className="text-macos-gray-400 mt-4">Нет активных процессов</p>
      )}
    </div>
  );
}
