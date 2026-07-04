// Fui! App - Unified Service Worker
// Handles both PWA caching and Firebase Cloud Messaging

// ============================================
// 1. Firebase Cloud Messaging (Push Notifications)
// ============================================
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAp6L9g15aptaYhV9RdDUEDqoHFQkT6MRY",
  authDomain: "fui-app-4c062.firebaseapp.com",
  projectId: "fui-app-4c062",
  storageBucket: "fui-app-4c062.firebasestorage.app",
  messagingSenderId: "850666707584",
  appId: "1:850666707584:web:4a21a34fbed1a24b38e465",
  measurementId: "G-WJ60LBY3BZ"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Fui!';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663097022226/kzfSj4x7eR8vE8AeXUkeWP/fui-icon-192-v4_389b0447.png',
    badge: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663097022226/kzfSj4x7eR8vE8AeXUkeWP/fui-icon-192-v4_389b0447.png',
    data: payload.data,
    tag: 'fui-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle dynamic config messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log('[SW] Received dynamic config (already initialized)');
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    event.notification?.data?.FCM_MSG?.data?.url ||
    '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl !== '/' && 'navigate' in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ============================================
// 2. PWA Caching (network-first para SPA)
// ============================================
const CACHE_NAME = 'fui-app-v4';
const urlsToCache = ['/index.html', '/manifest.json'];

// Install event - cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — navegação SPA: rede primeiro; assets: cache com fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  if (
    event.request.url.includes('firebaseinstallations.googleapis.com') ||
    event.request.url.includes('fcmregistrations.googleapis.com') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  // Rotas do app (SPA) — sempre rede primeiro para evitar HTML stale
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;

          if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|webp|ico)$/)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => undefined);
    })
  );
});
