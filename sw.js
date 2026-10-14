/* Service worker: يعمل بدون إنترنت. غيّر رقم الإصدار V عند أي تحديث لإجبار المتصفح على جلب الملفات الجديدة. */
const V = 'fireboq-v2.3';
const ASSETS = [
  './', 'index.html', 'style.css', 'app.js', 'xlsx.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'plex-arabic-400.woff2', 'plex-arabic-600.woff2', 'plex-arabic-700.woff2',
  'plex-latin-400.woff2', 'plex-latin-600.woff2', 'plex-latin-700.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الكاش أولاً (سريع وأوفلاين) مع تحديث الملف في الخلفية للمرة الجاية
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(V).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) return hit;
      const res = await net;
      if (res) return res;
      if (req.mode === 'navigate') return cache.match('index.html');
      return new Response('', { status: 504 });
    })
  );
});
