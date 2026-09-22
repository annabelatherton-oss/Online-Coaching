const STORAGE_KEY = 'clientHomeScreenPromptSeen_v1'

function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

// Shown once, right after the app tour / training-availability prompt, the first time a client
// opens the app in an ordinary browser tab (never shown once they're already running it as an
// installed app) — installing it is what makes push notifications actually work, especially on
// iPhone, so this comes before ClientNotificationsPrompt in the onboarding chain.
export function shouldAutoShowHomeScreenPrompt() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return false
    return !isStandalone()
  } catch {
    return false
  }
}

function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
}

export default function ClientHomeScreenPrompt({ onClose }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isAndroid = /android/i.test(navigator.userAgent)

  function done() {
    markSeen()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-2">📲</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add this app to your Home Screen</h2>
        {isIOS ? (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            Tap the <strong>Share</strong> icon in Safari, then <strong>"Add to Home Screen"</strong>.
            This is what lets you get reminders and updates from your coach as notifications.
          </p>
        ) : isAndroid ? (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            Tap the <strong>⋮</strong> menu in Chrome, then <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            This is what lets you get reminders and updates from your coach as notifications.
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            Look for an install option in your browser's menu or address bar (often called
            "Install app" or "Add to Home screen"). This is what lets you get reminders and
            updates from your coach as notifications.
          </p>
        )}
        <button onClick={done} className="btn-primary w-full mt-5 py-2">Got it</button>
      </div>
    </div>
  )
}
