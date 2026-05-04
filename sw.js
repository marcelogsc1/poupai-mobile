// PoupAí — Service Worker
// Estratégia: Cache First para assets estáticos, Network First para o HTML principal

const CACHE_NAME = 'poupai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Instalação: pré-cache dos assets estáticos
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Ativação: remove caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: Network First para HTML, Cache First para o resto
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // Ignora requisições não-GET e requests de terceiros (Firebase, Google Fonts)
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // HTML principal: Network First (sempre tenta buscar a versão mais recente)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(request, clone); });
          return response;
        })
        .catch(function() {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Assets estáticos: Cache First
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(request, clone); });
        return response;
      });
    })
  );
});
