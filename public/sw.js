const CACHE_NAME = 'video-cache-v1';
const VIDEO_URL = '/hologram1.mp4';

// Install event - cache the video file
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching video file...');
        return cache.add(VIDEO_URL);
      })
      .then(() => {
        console.log('Video cached successfully');
      })
      .catch((error) => {
        console.log('Failed to cache video:', error);
      })
  );
});

// Fetch event - serve cached video
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('hologram1.mp4')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('Serving video from cache');
            return response;
          }
          console.log('Video not in cache, fetching from network');
          return fetch(event.request);
        })
        .catch((error) => {
          console.log('Cache fetch failed:', error);
          return fetch(event.request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 