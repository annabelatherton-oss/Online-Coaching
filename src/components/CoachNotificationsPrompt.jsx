import { useState } from 'react'
import { registerPushNotifications } from '../lib/pushNotifications'

const STORAGE_KEY = 'coachNotificationsPromptSeen_v1'

// Mirrors ClientNotificationsPrompt.jsx — same reason it exists: iOS silently ignores
// Notification.requestPermission() unless it's called directly inside a user gesture (a tap),
// so CoachLayout's old "just register on login" effect never actually showed the permission
// prompt at all, and no coach ever had a real push_subscriptions row. This puts the request
// behind an explicit button tap instead.
export function shouldAutoShowNotificationsPrompt() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return false
    if (typeof Notification === 'undefined') return false
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    return Notification.permission === 'default'
  } catch {
    return false
  }
}

function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
}

export default function CoachNotificationsPrompt({ coachId, onClose }) {
  const [requesting, setRequesting] = useState(false)

  async function enable() {
    setRequesting(true)
    await registerPushNotifications({ coachId })
    setRequesting(false)
    markSeen()
    onClose()
  }

  function notNow() {
    markSeen()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-2">🔔</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Turn on notifications</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
          Get notified the moment a client checks in or sends you a message — you'll be asked to
          confirm this in your browser.
        </p>
        <button onClick={enable} disabled={requesting} className="btn-primary w-full mt-5 py-2">
          {requesting ? 'Requesting…' : 'Enable notifications'}
        </button>
        <button onClick={notNow} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-3 font-medium">
          Not now
        </button>
      </div>
    </div>
  )
}
