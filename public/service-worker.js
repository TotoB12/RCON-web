// public/service-worker.js
self.addEventListener('install', () => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request)); // Always fetch from the network
  });
  