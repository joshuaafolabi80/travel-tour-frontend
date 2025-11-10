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
      // Externalize Agora to prevent bundling issues
      external: ['agora-rtc-sdk']
    }
  },
  define: {
    'process.env': {}
  },
  // Netlify specific configuration
  base: '/', // Important for Netlify routing
  preview: {
    port: 4173,
    host: true
  },
  // CRITICAL: Ensure external scripts are handled properly
  optimizeDeps: {
    exclude: ['agora-rtc-sdk'], // Agora is loaded via CDN, don't try to bundle it
    include: ['react', 'react-dom', 'axios', 'jwt-decode'] // Explicitly include core deps
  },
  // Additional configuration for better Agora compatibility
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});