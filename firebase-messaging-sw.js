/* Service worker: نیشاندانی نۆتیفیکەیشن + ژمارە لەسەر ئایکۆنی ئەپ
   دەبێت لە ڕیشەی سایتەکەدا بێت (هاوشانی index.html) */
const ICON = 'icon-192.png';   // ئەگەر ناوی ئایکۆنەکەت جیاوازە لێرە بیگۆڕە

async function setBadge(n) {
  try {
    if (n > 0) { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(n); }
    else { if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge(); }
  } catch (e) {}
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = { data: { body: event.data && event.data.text() } }; }
  const d = p.data || p.notification || p;
  const title = d.title || 'ئاگادارکردنەوە';
  const opts = {
    body: d.body || '',
    icon: d.icon || ICON,
    badge: ICON,
    tag: d.tag || ('n' + Date.now() + Math.random().toString(36).slice(2, 6)),   // تاگی جیاواز = هەر نۆتیفیکەیشنێک ژمارەیەک زیاد دەکات
    data: { url: d.url || './' },
    dir: 'rtl', lang: 'ckb'
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, opts);   // پێویستە هەمیشە پیشان بدرێت (iOS/Chrome)
    const list = await self.registration.getNotifications();
    await setBadge(list.length);
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const list = await self.registration.getNotifications();
    await setBadge(list.length);
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  })());
});

// کاتێک ئەپ دەکرێتەوە: هەموو نۆتیفیکەیشنەکان دادەخرێن و ژمارە دەسڕدرێتەوە
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR') {
    event.waitUntil((async () => {
      (await self.registration.getNotifications()).forEach(n => n.close());
      await setBadge(0);
    })());
  }
});
