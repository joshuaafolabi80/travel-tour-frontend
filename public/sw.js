// Simple Service Worker for The Conclave Academy
const CACHE_NAME = 'conclave-academy-simple-v1';

self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle non-GET requests and external resources
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Only provide fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('Network error', { status: 408 });
      })
  );
});