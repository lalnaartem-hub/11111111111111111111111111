import { AnimatePresence, motion } from 'framer-motion';
import { useSystemStore } from '../store/system';

export function Notifications() {
  const items = useSystemStore((s) => s.notifications);
  const dismiss = useSystemStore((s) => s.dismissNotification);

  return (
    <div className="fixed top-9 right-4 z-[9500] flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {items.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 48, scale: 0.92, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 56, scale: 0.88, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.85 }}
            className="shell-notification pointer-events-auto rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.15)] px-4 py-3 text-sm"
          >
            <div className="flex justify-between gap-2">
              <strong className="text-gray-900">{n.title}</strong>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                onClick={() => dismiss(n.id)}
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mt-1">{n.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
