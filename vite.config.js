import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'jwt-decode']
        }
      }
      // 🚨 REMOVED: external: ['agora-rtc-sdk'] - This was causing the MIME type error
    }
  },
  define: {
    'process.env': {},
    // 🆕 ADDED: Global polyfill for Agora
    global: 'globalThis'
  },
  // Netlify specific configuration
  base: '/',
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    // 🚨 REMOVED: exclude: ['agora-rtc-sdk'] - This was preventing proper handling
    include: ['react', 'react-dom', 'axios', 'jwt-decode']
  },
  // 🆕 ADDED: Resolve configuration for Agora
  resolve: {
    alias: {
      // Ensure Agora and other libs work properly
      'agora-rtc-sdk': false // Prevent bundling issues
    }
  }
});