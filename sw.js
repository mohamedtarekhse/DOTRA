const CACHE_NAME = 'dotra-gate-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './ceo.html',
  './manifest.json',
  './assets/logo.jpg',
  './css/styles.css',
  './js/icons.js',
  './js/i18n.js',
  './js/arabic-plate.js',
  './js/db.js',
  './js/auth.js',
  './js/ceo.js',
  './js/manager.js',
  './js/officer.js',
  './js/app.js',
  './js/qr-engine.js',
  './js/push.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🛡️ Purging legacy service worker cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // API requests go network-first with graceful fallback
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Application Scripts & HTML: Network-First with Cache Fallback (Ensures fresh code on update)
  if (event.request.url.endsWith('.js') || event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static Assets (Images, Fonts, CSS): Cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return networkResponse;
      });
    })
  );
});

// 🔔 Web Push Notification Received Event Handler
self.addEventListener('push', event => {
  let data = {
    title: '🔔 إشعار بوابة دوترا',
    body: 'تحديث جديد في نظام البوابات',
    url: './'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './assets/logo.jpg',
    badge: './assets/logo.jpg',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'دوترا للبوابات', options)
  );
});

// 🖱️ Notification Click Event Handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/') || client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

