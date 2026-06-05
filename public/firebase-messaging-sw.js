importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
// To get the push notifications working, we need to pass the same config.
// Since we don't have process.env here easily without bundling, we can listen for a message
// or use a placeholder if using a specific build script, but for now we expect the SW to receive it
// via a message from the client, or we could just inject it.
// Actually, firebase-messaging-sw doesn't strictly need API key if it's just receiving messages
// wait, it DOES need it to initialize app.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body,
          icon: payload.notification?.image || '/icon-192x192.png',
          data: payload.data,
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});
