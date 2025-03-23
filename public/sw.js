
// Service Worker for Dental Schedule Sync PWA

// Cache name includes version to allow for easy updates
const CACHE_NAME = 'dental-schedule-sync-v1';

// URLs to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event: Cache critical assets
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve from cache, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Handle synchronization requests for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

// Function to sync appointments when back online
async function syncAppointments() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = JSON.parse(localStorage.getItem('offlineAppointments') || '[]');
    
    if (offlineData.length === 0) {
      return;
    }
    
    // Process each offline entry
    const processPromises = offlineData.map(async (entry) => {
      // Here would be API call to sync with server
      console.log('Syncing appointment:', entry);
    });
    
    await Promise.all(processPromises);
    
    // Clear offline data after successful sync
    localStorage.removeItem('offlineAppointments');
    
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
