const CACHE_NAME = 'lcp-v3'
const APP_SHELL_URLS = ['/', '/manifest.webmanifest', '/icon-192', '/icon-512', '/apple-icon']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (event.request.method !== 'GET') return
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return
  if (url.hostname.includes('supabase.co')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put('/', clone))
          return response
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match('/'))
    })
  )
})

self.addEventListener('push', event => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {
      title: 'Logbook Chirurgie',
      body: event.data ? event.data.text() : 'Nouvelle notification',
    }
  }

  const title = payload.title || 'Logbook Chirurgie'
  const options = {
    body: payload.body || 'Nouvelle notification',
    icon: payload.icon || '/icon-192',
    badge: payload.badge || '/icon-192',
    tag: payload.tag || 'lcp-notification',
    data: {
      url: payload.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client && client.url === targetUrl) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
