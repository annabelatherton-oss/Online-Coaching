// Service worker for push notifications
self.addEventListener('push', event => {
  let data = { title: 'Weekly Check-in', body: "It's Friday — time to log your check-in! 💪", url: '/client/checkin' }
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
      tag: 'checkin-reminder',       // replaces any existing reminder notification
      renotify: false,
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const target = event.notification.data?.url || '/client/checkin'
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
