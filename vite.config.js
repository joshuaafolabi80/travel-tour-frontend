import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    host: '0.0.0.0',
    port: 5173,
    // Added for better HMR and network access
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
      },
      // 🚨 REMOVED: Agora external reference
    }
  },
  define: {
    'process.env': {}
  },
  // FIX: Changed base from '/' to '' to use relative paths. 
  // This resolves the MIME type errors and white screen on Netlify.
  base: '', 
  preview: {
    port: 4173,
    host: true
  },
  // CRITICAL: Ensure external scripts are handled properly
  optimizeDeps: {
    // 🚨 REMOVED: Agora exclusion
    include: ['react', 'react-dom', 'axios', 'jwt-decode'] // Explicitly include core deps
  },
  // Additional configuration for better compatibility
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});