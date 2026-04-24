const CACHE = 'aq-antivirus-v2';
const FILES = [
  './antivirus-alequebec-3.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Share Target: recibir archivo compartido ──────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Interceptar POST del Share Target
  if (e.request.method === 'POST' && url.pathname.includes('antivirus-alequebec-3.html')) {
    e.respondWith((async () => {
      const formData = await e.request.formData();
      const file = formData.get('file');

      // Redirigir a la app y enviar el archivo via postMessage
      const client = await self.clients.get(e.clientId) ||
                     (await self.clients.matchAll({ type: 'window' }))[0];

      if (client && file) {
        client.postMessage({ type: 'SHARE_FILE', file });
      }

      // Redirigir a la app principal
      return Response.redirect('./antivirus-alequebec-3.html', 303);
    })());
    return;
  }

  // No interceptar VirusTotal
  if (e.request.url.includes('virustotal')) return;

  e.respondWith(
    fetch(e.request)
      .then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
