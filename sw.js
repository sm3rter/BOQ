/* Service worker: يعمل بدون إنترنت، لكن الأولوية دايماً للنسخة الأحدث من السيرفر.
   غيّر رقم الإصدار V مع كل تحديث: بيتمسح الكاش القديم كله وبتتحمّل الملفات الجديدة تلقائي. */
const V = 'fireboq-v2.6';
const ASSETS = [
  './', 'index.html', 'style.css', 'app.js', 'xlsx.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'plex-arabic-400.woff2', 'plex-arabic-600.woff2', 'plex-arabic-700.woff2',
  'plex-latin-400.woff2', 'plex-latin-600.woff2', 'plex-latin-700.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(ASSETS.map(a =>
        fetch(new Request(a, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(a); return c.put(a, r); })
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الشبكة أولاً (مع مهلة 4 ثواني) ثم الكاش للأوفلاين
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const net = fetch(req.url, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    const quick = await Promise.race([net.catch(() => null), new Promise(r => setTimeout(() => r(null), 4000))]);
    if (quick && quick.ok) return quick;
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
    const late = await net.catch(() => null);
    return late || new Response('', { status: 504 });
  })());
});
