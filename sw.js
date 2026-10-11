// PoupAí: substitui o service worker do app anterior. Ele limpa o cache antigo, se desliga
// e recarrega as abas abertas, para todo mundo receber a versão nova do index.html.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try { var keys = await caches.keys(); await Promise.all(keys.map(function (k) { return caches.delete(k); })); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try { var list = await self.clients.matchAll({ type: 'window' }); list.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} }); } catch (e) {}
  })());
});
