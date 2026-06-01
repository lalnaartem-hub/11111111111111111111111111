import { useState } from 'react';
import { useSystemStore } from '../store/system';
import {
  saveSettings,
  WALLPAPER_PRESETS,
  wallpaperPreviewStyle,
  type SystemSettings,
} from '../services/settings';
import type { StorageManager } from '@browser-os/storage-manager';
import { LogPanel } from './LogPanel';
import { applyOsTheme, themePatchForOs } from '../services/osTheme';
import { applyShellTheme } from '../services/shellTheme';
import type { OsMode } from '../services/settings';

const CATEGORIES = [
  { id: 'appearance', label: 'Оформление' },
  { id: 'desktop', label: 'Рабочий стол' },
  { id: 'dock', label: 'Dock' },
  { id: 'windows', label: 'Окна' },
  { id: 'emulator', label: 'Эмулятор' },
  { id: 'system', label: 'Система' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

export function SettingsApp() {
  const settings = useSystemStore((s) => s.settings);
  const setSettings = useSystemStore((s) => s.setSettings);
  const showNotification = useSystemStore((s) => s.showNotification);
  const kernel = useSystemStore((s) => s.kernel);
  const [category, setCategory] = useState<CategoryId>('appearance');

  const update = async (patch: Partial<SystemSettings>) => {
    const next = { ...settings, ...patch };
    if (patch.theme) {
      applyShellTheme(patch.theme, next.osMode);
    }
    setSettings(next);
    if (kernel) {
      const storage = kernel.getComponent<StorageManager>('storage');
      await saveSettings(storage, next);
    }
  };

  const dark = settings.theme === 'dark';

  return (
    <div
      className="settings-app flex h-full min-h-[360px] text-sm"
      style={{
        backgroundColor: dark ? '#1c1c1e' : '#f5f5f7',
        color: dark ? '#f5f5f7' : '#1c1c1e',
      }}
    >
      <aside
        className="w-40 border-r p-2 shrink-0"
        style={{
          backgroundColor: dark ? '#2c2c2e' : 'rgba(255,255,255,0.8)',
          borderColor: dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
        }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`w-full text-left px-2 py-2 rounded-lg text-xs mb-0.5 transition-colors ${
              category === c.id
                ? 'bg-[#007aff] text-white'
                : dark
                  ? 'text-gray-400 hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </aside>
      <div className="flex-1 p-5 overflow-auto space-y-5">
        {category === 'appearance' && (
          <>
            <Section title="Тема" dark={dark}>
              <p
                className="text-xs mb-2"
                style={{ color: dark ? '#98989d' : '#6e6e73' }}
              >
                Сейчас: <strong>{settings.theme === 'dark' ? 'тёмная' : 'светлая'}</strong>
                {settings.osMode === 'linux'
                  ? ' (в Kali многое уже тёмное — для контраста выберите macOS в «Система»)'
                  : ''}
              </p>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      applyShellTheme(t, settings.osMode);
                      void update({ theme: t });
                      showNotification({
                        title: 'Тема',
                        message:
                          t === 'dark'
                            ? 'Включена тёмная тема (меню, dock, окна, приложения).'
                            : 'Включена светлая тема.',
                        duration: 3500,
                      });
                    }}
                    className="px-4 py-2 rounded-lg border-2 font-medium"
                    style={{
                      borderColor: settings.theme === t ? '#007aff' : dark ? '#48484a' : '#d1d1d6',
                      backgroundColor:
                        settings.theme === t
                          ? dark
                            ? 'rgba(0,122,255,0.35)'
                            : 'rgba(0,122,255,0.12)'
                          : dark
                            ? '#2c2c2e'
                            : '#fff',
                      color: dark ? '#f5f5f7' : '#1c1c1e',
                    }}
                  >
                    {t === 'light' ? 'Светлая' : 'Тёмная'}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Акцентный цвет">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => void update({ accentColor: e.target.value })}
                className="h-9 w-14 rounded cursor-pointer"
              />
            </Section>
            <Section title="Размер шрифта">
              <input
                type="range"
                min={12}
                max={20}
                value={settings.fontSize}
                onChange={(e) => void update({ fontSize: Number(e.target.value) })}
                className="w-full max-w-xs"
              />
              <span className="ml-2 text-gray-500">{settings.fontSize}px</span>
            </Section>
            <Section title="Масштаб интерфейса">
              <input
                type="range"
                min={0.85}
                max={1.15}
                step={0.05}
                value={settings.uiScale}
                onChange={(e) => void update({ uiScale: Number(e.target.value) })}
                className="w-full max-w-xs"
              />
              <span className="ml-2 text-gray-500">{Math.round(settings.uiScale * 100)}%</span>
            </Section>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => void update({ highContrast: e.target.checked })}
              />
              Высокая контрастность
            </label>
          </>
        )}

        {category === 'desktop' && (
          <>
            <Section title="Обои" dark={dark}>
              <p className="text-xs mb-2" style={{ color: dark ? '#98989d' : '#6e6e73' }}>
                Обои: запустите <code>setup-wallpapers.cmd</code> (создаёт SVG без интернета) или
                при старте <code>start-dev.cmd</code>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {WALLPAPER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void update({ wallpaper: p.value })}
                    className={`h-16 rounded-lg border-2 bg-cover bg-center ${
                      settings.wallpaper === p.value
                        ? 'border-[#007aff]'
                        : 'border-transparent'
                    }`}
                    style={wallpaperPreviewStyle(p.value)}
                    title={p.label}
                  />
                ))}
              </div>
              <input
                className={`w-full border rounded-lg px-3 py-2 text-xs ${
                  dark
                    ? 'border-white/15 bg-[#2c2c2e] text-gray-100'
                    : 'border-gray-200 bg-white'
                }`}
                placeholder="Свой URL обоев…"
                value={settings.wallpaper}
                onChange={(e) => void update({ wallpaper: e.target.value })}
              />
            </Section>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showDesktopClock}
                onChange={(e) => void update({ showDesktopClock: e.target.checked })}
              />
              Показывать часы в меню
            </label>
          </>
        )}

        {category === 'dock' && (
          <>
            <Section title="Позиция Dock">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2"
                value={settings.dockPosition}
                onChange={(e) =>
                  void update({
                    dockPosition: e.target.value as SystemSettings['dockPosition'],
                  })
                }
              >
                <option value="bottom">Снизу</option>
                <option value="left">Слева</option>
                <option value="right">Справа</option>
              </select>
            </Section>
            <Section title="Увеличение иконок при наведении">
              <input
                type="range"
                min={1}
                max={1.5}
                step={0.05}
                value={settings.dockMagnification}
                onChange={(e) =>
                  void update({ dockMagnification: Number(e.target.value) })
                }
                className="w-full max-w-xs"
              />
            </Section>
            <Section title="Размер иконок Dock">
              <input
                type="range"
                min={36}
                max={64}
                step={4}
                value={settings.dockIconSize}
                onChange={(e) => void update({ dockIconSize: Number(e.target.value) })}
                className="w-full max-w-xs"
              />
              <span className="ml-2 text-gray-500">{settings.dockIconSize}px</span>
            </Section>
          </>
        )}

        {category === 'windows' && (
          <>
            <Section title="Прозрачность окон">
              <input
                type="range"
                min={0.85}
                max={1}
                step={0.01}
                value={settings.windowOpacity}
                onChange={(e) => void update({ windowOpacity: Number(e.target.value) })}
                className="w-full max-w-xs"
              />
            </Section>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.windowBlur}
                onChange={(e) => void update({ windowBlur: e.target.checked })}
              />
              Размытие заголовка окна
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.windowShadows}
                onChange={(e) => void update({ windowShadows: e.target.checked })}
              />
              Тени окон
            </label>
            <Section title="Скругление углов окон">
              <input
                type="range"
                min={0}
                max={20}
                value={settings.windowCornerRadius}
                onChange={(e) => void update({ windowCornerRadius: Number(e.target.value) })}
                className="w-full max-w-xs"
              />
              <span className="ml-2 text-gray-500">{settings.windowCornerRadius}px</span>
            </Section>
            <Section title="Прозрачность строки меню">
              <input
                type="range"
                min={0.7}
                max={1}
                step={0.05}
                value={settings.menuBarOpacity}
                onChange={(e) => void update({ menuBarOpacity: Number(e.target.value) })}
                className="w-full max-w-xs"
              />
            </Section>
          </>
        )}

        {category === 'emulator' && (
          <Section title="Память эмулятора (МБ)">
            <input
              type="range"
              min={32}
              max={128}
              step={16}
              value={settings.emulatorMemoryMB}
              onChange={(e) => void update({ emulatorMemoryMB: Number(e.target.value) })}
              className="w-full max-w-xs"
            />
            <span className="ml-2">{settings.emulatorMemoryMB} МБ</span>
            <p className="text-xs text-gray-500 mt-2">
              Больше памяти — стабильнее FreeDOS, но выше нагрузка на браузер.
            </p>
          </Section>
        )}

        {category === 'system' && (
          <>
            <Section title="Режим интерфейса (ОС)">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['macos', 'macOS'],
                    ['linux', 'Kali Linux'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      const patch = themePatchForOs(
                        id as OsMode,
                        settings.wallpaper,
                        settings.accentColor
                      );
                      void update({
                        osMode: id as OsMode,
                        osPickerDone: true,
                        dockPosition: patch.dockPosition ?? settings.dockPosition,
                        ...patch,
                      });
                      applyOsTheme(id as OsMode);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs ${
                      settings.osMode === id
                        ? 'border-[#007aff] bg-[#007aff]/10'
                        : 'border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Скорость анимаций">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2"
                value={settings.animationSpeed}
                onChange={(e) =>
                  void update({
                    animationSpeed: e.target.value as SystemSettings['animationSpeed'],
                  })
                }
              >
                <option value="slow">Медленно</option>
                <option value="normal">Обычно</option>
                <option value="fast">Быстро</option>
              </select>
            </Section>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => void update({ reduceMotion: e.target.checked })}
              />
              Уменьшить анимации
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.restoreSession}
                onChange={(e) => void update({ restoreSession: e.target.checked })}
              />
              Восстанавливать окна при запуске
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showDesktopClock}
                onChange={(e) => void update({ showDesktopClock: e.target.checked })}
              />
              Часы в строке меню
            </label>
            <Section title="Горячие клавиши">
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>Ctrl+F — Файлы</li>
                <li>Ctrl+T — Терминал</li>
                <li>Ctrl+, — Настройки</li>
                <li>Ctrl+E — Редактор</li>
                <li>Ctrl+Shift+E — Эмулятор</li>
                <li>Ctrl+A — App Store</li>
                <li>Ctrl+W — закрыть окно</li>
                <li>Ctrl+M — свернуть окно</li>
              </ul>
            </Section>
            <Section title="Журнал системы">
              <LogPanel />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  dark,
}: {
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section>
      <h3
        className={`font-semibold mb-2 ${dark ? 'text-gray-100' : 'text-gray-900'}`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}
