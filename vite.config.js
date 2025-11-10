import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 🚨 CRITICAL: Disable code splitting to avoid the utils chunk error
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    // 🚨 CRITICAL: Define global objects to prevent undefined errors
    'process.env': {},
    global: 'window',
    'global.Request': 'window.Request || class Request {}'
  },
  base: '/',
  optimizeDeps: {
    // 🚨 CRITICAL: Force include all dependencies to prevent chunking issues
    include: [
      'react', 
      'react-dom', 
      'axios', 
      'jwt-decode',
      'bootstrap',
      'socket.io-client'
    ]
  },
  // 🚨 CRITICAL: Disable certain optimizations that cause issues
  esbuild: {
    target: 'es2020'
  }
});