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
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    // 🆕 ADD: Polyfill for global objects
    'global.Request': 'undefined'
  },
  base: '/',
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'jwt-decode'],
    // 🆕 ADD: Exclude problematic dependencies
    exclude: ['agora-rtc-sdk']
  },
  // 🆕 ADD: Resolve configuration
  resolve: {
    alias: {
      // Prevent bundling issues
      './runtimeConfig': './runtimeConfig.browser'
    }
  },
  // 🆕 ADD: Esbuild configuration
  esbuild: {
    target: 'es2020',
    supported: {
      'top-level-await': true
    }
  }
});