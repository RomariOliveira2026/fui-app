// Firebase Cloud Messaging Service Worker
// This file redirects to the unified sw.js which handles both FCM and PWA caching
// Firebase requires this specific filename, so we keep it as a thin wrapper

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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log('[firebase-messaging-sw.js] Received dynamic config');
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
