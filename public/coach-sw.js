// Service worker for coach push notifications — a separate file/scope (/coach/) from
// public/sw.js (scoped to /client/) so the two roles can show distinct default text without
// needing an encrypted push payload (the app doesn't implement Web Push payload encryption;
// every push arrives with no data, so the notification shown is always this hardcoded default).
self.addEventListener('push', event => {
  let data = { title: 'Check-ins Due', body: "It's Friday — time to review your clients' check-ins ✅", url: '/coach/checkins' }
  try {
    const parsed = event.data?.json()
    if (parsed) data = { ...data, ...parsed }
  } catch (_) {
    if (event.data?.text()) data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      // No tag: a shared tag across every coach push (Friday reminder, a check-in just submitted,
      // a new message) made a later one silently REPLACE an earlier one still sitting undismissed
      // in Notification Center — no sound, no banner, no lock-screen alert, just a quiet content
      // swap — rather than showing its own alert. Once one coach notification went unread, every
      // notification after it died the same silent way. Each push is now fully independent.
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const target = event.notification.data?.url || '/coach/checkins'
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(target)
    })
  )
})
