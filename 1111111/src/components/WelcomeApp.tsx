export function WelcomeApp() {
  return (
    <div className="welcome-app p-6 text-sm text-gray-700 leading-relaxed max-w-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Browser OS</h2>
      <p className="mb-3">
        Операционная система в браузере: виртуальная ФС в IndexedDB, окна с перетаскиванием и
        изменением размера, док и эмулятор DOS через v86.
      </p>
      <h3 className="font-semibold text-gray-800 mb-2">Быстрый старт</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
        <li>
          Файлы: <code className="text-xs bg-gray-100 px-1 rounded">/home/HELLO.COM</code> — тестовая
          DOS-программа
        </li>
        <li>Док — запуск приложений; повторный клик фокусирует окно</li>
        <li>Настройки → Оформление → Тёмная — тёмная тема всей оболочки</li>
        <li>
          <strong>Запуск .exe:</strong> Файлы → выберите файл → «Запустить», или Эмулятор → загрузить
          .com/.exe (DOS)
        </li>
      </ul>
      <h3 className="font-semibold text-gray-800 mb-2">Эмулятор</h3>
      <p className="text-xs text-gray-500 mb-4">
        Поддерживаются DOS .COM и DOS .EXE (формат MZ без Windows PE). Windows-программы (PE) —
        профиль Windows 98 в эмуляторе. При первом запуске скачивается FreeDOS.
      </p>
      <p className="text-xs text-gray-400">
        Спецификация: <code>.kiro/specs/browser-os/</code>
      </p>
    </div>
  );
}
