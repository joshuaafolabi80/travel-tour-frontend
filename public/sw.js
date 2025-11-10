// Enhanced Service Worker for The Conclave Academy
const CACHE_NAME = 'conclave-academy-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';

// 🚨 CRITICAL: URLs to cache immediately
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://res.cloudinary.com/dnc3s4u7q/image/upload/v1760389693/conclave_logo_ygplob.jpg'
];

// 🚨 CRITICAL: External resources to cache
const EXTERNAL_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://download.agora.io/sdk/release/AgoraRTC_N.js'
];

// 🚨 CRITICAL: Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// 🚨 CRITICAL: Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// 🚨 CRITICAL: Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Agora SDK requests
  if (event.request.method !== 'GET' || 
      event.request.url.includes('download.agora.io') ||
      event.request.url.includes('travel-tour-academy-backend.onrender.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise make network request
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            
            // 🚨 CRITICAL: Fallback for HTML requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Fallback for other requests
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
      })
  );
});

// 🚨 CRITICAL: Message event for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_NEW_ROUTE') {
    caches.open(STATIC_CACHE)
      .then((cache) => {
        cache.add(event.data.url);
      });
  }
});

// 🚨 CRITICAL: Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here if needed
  console.log('🔄 Performing background sync');
}