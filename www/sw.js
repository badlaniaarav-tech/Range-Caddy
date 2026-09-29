/* Range Caddy service worker.
   Its only job is the ongoing "practice" notification: keeping it on screen while a drill is
   running, and routing its buttons (Pause / Finish / Next) back into the open app. */
const TAG = 'rc-practice';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/* The page asks us to show or clear the notification — a service worker registration is the
   only way to get one with buttons that survives the app being in the background. */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'show') {
    self.registration.showNotification(d.title, d.options);
  } else if (d.type === 'clear') {
    self.registration.getNotifications({ tag: TAG })
      .then(list => list.forEach(n => n.close()));
  }
});

/* Tapping the notification body opens the app; tapping a button sends the action through. */
self.addEventListener('notificationclick', e => {
  const action = e.action || 'open';
  if (action !== 'pause') e.notification.close();
  e.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = clients.find(c => 'focus' in c);
    if (client) {
      await client.focus();
      client.postMessage({ type: 'notif-action', action });
    } else {
      await self.clients.openWindow('./index.html?rcAction=' + encodeURIComponent(action));
    }
  })());
});
