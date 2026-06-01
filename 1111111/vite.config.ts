import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Без COOP/COEP — иначе не работают iframe-браузер и обои из интернета.
    // v86 эмулятор использует fallback без SharedArrayBuffer.
  },
  resolve: {
    alias: {
      '@browser-os/types': path.resolve(__dirname, './packages/types/src'),
      '@browser-os/storage-manager': path.resolve(__dirname, './packages/storage-manager/src'),
      '@browser-os/kernel': path.resolve(__dirname, './packages/kernel/src'),
      '@browser-os/file-system': path.resolve(__dirname, './packages/file-system/src'),
      '@browser-os/process-manager': path.resolve(__dirname, './packages/process-manager/src'),
      '@browser-os/window-manager': path.resolve(__dirname, './packages/window-manager/src'),
      '@browser-os/gui-shell': path.resolve(__dirname, './packages/gui-shell/src'),
      '@browser-os/emulator': path.resolve(__dirname, './packages/emulator/src'),
      '@browser-os/terminal': path.resolve(__dirname, './packages/terminal/src'),
      '@browser-os/api': path.resolve(__dirname, './packages/api/src'),
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['comlink'],
    include: ['v86'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'motion': ['framer-motion'],
          v86: ['v86'],
        },
      },
    },
  },
});
