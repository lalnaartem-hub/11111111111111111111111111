import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon, type AppIconId } from '@browser-os/gui-shell';
import type { StorageManager } from '@browser-os/storage-manager';
import { focusOrLaunch } from '../bootstrap';
import { STORE_APPS, STORE_CATEGORIES, type StoreApp, type StoreCategory } from '../services/appCatalog';
import { installApp, loadInstalled, uninstallApp } from '../services/installedApps';
import { useSystemStore } from '../store/system';
import type { OsMode } from '../services/settings';
import { saveSettings } from '../services/settings';
import { applyOsTheme, themePatchForOs } from '../services/osTheme';

function mapIcon(id: string): AppIconId {
  const m: Record<string, AppIconId> = {
    terminal: 'terminal',
    files: 'files',
    emulator: 'emulator',
    calculator: 'calculator',
    editor: 'editor',
    taskmanager: 'taskmanager',
    settings: 'settings',
    welcome: 'welcome',
  };
  return m[id] ?? 'welcome';
}

export function AppStoreApp() {
  const kernel = useSystemStore((s) => s.kernel);
  const settings = useSystemStore((s) => s.settings);
  const setSettings = useSystemStore((s) => s.setSettings);
  const showNotification = useSystemStore((s) => s.showNotification);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<StoreCategory | 'all'>('featured');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<StoreApp | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!kernel) return;
    const storage = kernel.getComponent<StorageManager>('storage');
    void loadInstalled(storage).then(setInstalled);
  }, [kernel]);

  const filtered = useMemo(() => {
    return STORE_APPS.filter((app) => {
      if (category !== 'all' && app.category !== category) return false;
      if (query && !app.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [category, query]);

  const featured = STORE_APPS.filter((a) => a.featured);

  const toggleInstall = async (app: StoreApp) => {
    if (!kernel) return;
    setBusy(app.id);
    const storage = kernel.getComponent<StorageManager>('storage');
    const isInstalled = installed.has(app.id);

    if (isInstalled && !['browser-terminal', 'files-plus'].includes(app.id)) {
      const next = await uninstallApp(storage, app.id, installed);
      setInstalled(next);
      showNotification({ title: 'Удалено', message: app.name });
    } else if (!isInstalled) {
      const next = await installApp(storage, app.id, installed);
      setInstalled(next);
      if (app.packageName === 'theme-linux') {
        const patch = themePatchForOs('linux', settings.wallpaper, settings.accentColor);
        const nextSettings = {
          ...settings,
          osMode: 'linux' as OsMode,
          osPickerDone: true,
          ...patch,
        };
        setSettings(nextSettings);
        applyOsTheme('linux');
        await saveSettings(storage, nextSettings);
      } else if (app.packageName === 'theme-macos') {
        const patch = themePatchForOs('macos', settings.wallpaper, settings.accentColor);
        const nextSettings = {
          ...settings,
          osMode: 'macos' as OsMode,
          osPickerDone: true,
          ...patch,
        };
        setSettings(nextSettings);
        applyOsTheme('macos');
        await saveSettings(storage, nextSettings);
      }
      showNotification({ title: 'Установлено', message: app.name, duration: 3000 });
    }
    setBusy(null);
  };

  const openApp = (app: StoreApp) => {
    if (!installed.has(app.id) && !app.featured) {
      showNotification({ title: 'App Store', message: 'Сначала установите приложение' });
      return;
    }
    if (app.launchAppId) focusOrLaunch(app.launchAppId);
    else showNotification({ title: app.name, message: 'Скоро в следующем обновлении' });
  };

  return (
    <div className="app-store-app flex h-full min-h-[480px] bg-[#f5f5f7] text-sm">
      <aside className="w-36 shrink-0 border-r border-gray-200 bg-white/90 p-2 overflow-auto">
        {STORE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`w-full text-left px-2 py-2 rounded-lg text-xs mb-0.5 ${
              category === c.id ? 'bg-[#007aff] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="app-store-header p-4 border-b border-gray-200 bg-white/80">
          <h1 className="text-2xl font-bold text-gray-900">App Store</h1>
          <p className="text-xs text-gray-500 mt-0.5">Приложения, темы и пакеты для Browser OS</p>
          <input
            type="search"
            placeholder="Поиск приложений, игр, тем…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-3 w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff]/40"
          />
        </div>

        <div className="flex-1 overflow-auto p-4">
          {category === 'featured' || category === 'all' ? (
            <section className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Рекомендуем
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                {featured.map((app, i) => (
                  <motion.article
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#007aff] to-[#5856d6] p-4 text-white shadow-lg cursor-pointer"
                    onClick={() => setSelected(app)}
                  >
                    <AppIcon id={mapIcon(app.icon)} size={48} />
                    <h3 className="font-semibold mt-2">{app.name}</h3>
                    <p className="text-xs text-white/80 line-clamp-2">{app.description}</p>
                    <span className="absolute top-3 right-3 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      ★ {app.rating}
                    </span>
                  </motion.article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((app) => (
              <StoreCard
                key={app.id}
                app={app}
                installed={installed.has(app.id)}
                busy={busy === app.id}
                onSelect={() => setSelected(app)}
                onInstall={() => void toggleInstall(app)}
                onOpen={() => openApp(app)}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <StoreDetail
            app={selected}
            installed={installed.has(selected.id)}
            onClose={() => setSelected(null)}
            onInstall={() => void toggleInstall(selected)}
            onOpen={() => openApp(selected)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StoreCard({
  app,
  installed,
  busy,
  onSelect,
  onInstall,
  onOpen,
}: {
  app: StoreApp;
  installed: boolean;
  busy: boolean;
  onSelect: () => void;
  onInstall: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.article
      layout
      className="app-store-card flex gap-3 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
      whileHover={{ y: -2 }}
    >
      <AppIcon id={mapIcon(app.icon)} size={56} />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
        <p className="text-[11px] text-gray-500 line-clamp-2">{app.description}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          ★ {app.rating} · {app.downloads} · {app.size}
        </p>
        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={busy}
            onClick={onInstall}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              installed
                ? 'bg-gray-100 text-gray-600'
                : 'bg-[#007aff] text-white hover:bg-[#0066d6]'
            }`}
          >
            {busy ? '…' : installed ? 'Удалить' : 'Установить'}
          </button>
          {installed && app.launchAppId && (
            <button
              type="button"
              onClick={onOpen}
              className="px-3 py-1 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
            >
              Открыть
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function StoreDetail({
  app,
  installed,
  onClose,
  onInstall,
  onOpen,
}: {
  app: StoreApp;
  installed: boolean;
  onClose: () => void;
  onInstall: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[9500] flex items-center justify-center p-4 bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-w-md w-full rounded-2xl bg-white p-6 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <AppIcon id={mapIcon(app.icon)} size={72} />
          <div>
            <h2 className="text-xl font-bold">{app.name}</h2>
            <p className="text-xs text-gray-500">{app.developer}</p>
            <p className="text-xs text-amber-600 mt-1">★ {app.rating} · {app.downloads}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{app.longDescription}</p>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onInstall}
            className="flex-1 py-2 rounded-xl bg-[#007aff] text-white text-sm font-medium"
          >
            {installed ? 'Удалить' : 'Установить'}
          </button>
          {installed && app.launchAppId && (
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium"
            >
              Открыть
            </button>
          )}
        </div>
        <button type="button" className="w-full mt-2 text-xs text-gray-400" onClick={onClose}>
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
}
