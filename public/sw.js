/**
 * public/sw.js
 *
 * Service Worker for Learnova Push Notifications.
 * Handles background push event listener triggers, notification click handling,
 * and navigating users to the appropriate page when clicking timetable notifications.
 */

self.addEventListener('push', function(event) {
  let data = { 
    title: 'Upcoming Class Reminder', 
    body: 'You have a class starting in 10 minutes!', 
    subject: 'Class Alert', 
    room: 'Room' 
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
    icon: '/logo-icon.png',
    badge: '/logo-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/timetable'
    },
    actions: [
      { action: 'open', title: 'View Timetable' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const targetUrl = event.notification.data.url || '/timetable';
      
      // If a tab is already open with the dashboard/timetable, focus it
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
