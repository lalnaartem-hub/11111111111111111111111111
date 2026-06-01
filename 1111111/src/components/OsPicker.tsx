import { motion } from 'framer-motion';
import type { OsMode } from '../services/settings';
import { OS_THEME_DEFAULTS, themePatchForOs } from '../services/osTheme';
import { useSystemStore } from '../store/system';

const OPTIONS: { id: OsMode; title: string; subtitle: string }[] = [
  {
    id: 'macos',
    title: 'macOS',
    subtitle: 'Dock снизу, светлые окна, кнопки ● ● ●',
  },
  {
    id: 'linux',
    title: 'Kali Linux',
    subtitle: 'Панель слева, тёмные окна GNOME, дракон на рабочем столе, bash',
  },
];

interface OsPickerProps {
  onSelect: (mode: OsMode) => void;
}

export function OsPicker({ onSelect }: OsPickerProps) {
  const settings = useSystemStore((s) => s.settings);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0a0a12]/95 backdrop-blur-xl p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Выберите рабочее пространство</h1>
        <p className="text-white/50 text-sm mb-10">Два разных интерфейса — macOS или Kali Linux</p>
        <div className="grid md:grid-cols-2 gap-6">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.id}
              type="button"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const patch = themePatchForOs(opt.id, settings.wallpaper, settings.accentColor);
                useSystemStore.getState().setSettings({
                  ...settings,
                  osMode: opt.id,
                  osPickerDone: true,
                  accentColor: patch.accentColor ?? OS_THEME_DEFAULTS[opt.id].accent,
                  wallpaper: patch.wallpaper ?? OS_THEME_DEFAULTS[opt.id].wallpaper,
                  dockPosition: patch.dockPosition ?? OS_THEME_DEFAULTS[opt.id].dockPosition,
                });
                onSelect(opt.id);
              }}
              className="text-left p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#367bf0]/50 hover:bg-white/10"
            >
              {opt.id === 'macos' ? (
                <div className="h-24 mb-4 rounded-xl bg-gradient-to-b from-[#5ac8fa]/30 to-[#007aff]/20 border border-white/10 flex items-end justify-center pb-2 gap-1">
                  <div className="w-8 h-8 rounded-lg bg-white/20" />
                  <div className="w-8 h-8 rounded-lg bg-white/20" />
                  <div className="w-8 h-8 rounded-lg bg-white/20" />
                </div>
              ) : (
                <div className="h-24 mb-4 rounded-xl bg-gradient-to-br from-[#0d1117] to-[#367bf0]/40 border border-[#367bf0]/30 flex items-center justify-center">
                  <span className="text-4xl font-black text-[#367bf0]/80">KALI</span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-white">{opt.title}</h2>
              <p className="text-xs text-white/50 mt-2">{opt.subtitle}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
