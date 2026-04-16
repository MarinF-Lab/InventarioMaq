const CACHE_NAME = 'inventario-v1.0.0';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-192-maskable.png',
  'icon-512.png',
  'icon-512-maskable.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Error al cachear:', err))
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network First con fallback a cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clonar la respuesta para cachearla
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si es una navegación y no hay cache, mostrar offline.html
            if (event.request.mode === 'navigate') {
              return caches.match('index.html');
            }
            return new Response('Sin conexión a internet', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Sincronización en segundo plano para subir documentos pendientes
self.addEventListener('sync', event => {
  console.log('Sync event:', event.tag);
  if (event.tag === 'sync-documents') {
    event.waitUntil(syncPendingDocuments());
  }
});

// Push notifications (opcional)
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva actualización',
    icon: 'icon-192.png',
    badge: 'icon-192-maskable.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Inventario', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Función para sincronizar documentos pendientes (ejemplo)
async function syncPendingDocuments() {
  try {
    const pendingDocs = await getPendingDocuments();
    for (const doc of pendingDocs) {
      await uploadDocument(doc);
    }
    console.log('Documentos sincronizados:', pendingDocs.length);
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}

// Placeholder para funciones de sincronización
async function getPendingDocuments() {
  // Aquí iría la lógica para obtener documentos pendientes de IndexedDB
  return [];
}

async function uploadDocument(doc) {
  // Aquí iría la lógica para subir el documento a Firebase Storage
  console.log('Subiendo documento:', doc);
}