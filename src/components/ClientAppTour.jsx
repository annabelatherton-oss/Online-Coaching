import { useEffect, useState } from 'react'

// Points at the sidebar nav links rather than in-page content - a brand-new client's meal plan,
// training, etc. might not be set up yet, so anything living inside those pages may not exist to
// point at. The nav items are always there regardless of what data the account has, so the tour
// never gets stuck or ends up pointing at nothing.
const STEPS = [
  {
    selector: null,
    emoji: '👋',
    title: 'Welcome to your plan',
    body: "Here's where everything lives. Quick look around — 30 seconds.",
  },
  {
    selector: '[data-tour="nav-meals"]',
    emoji: '🍽️',
    title: 'My Meal Plan',
    body: "Your meals for the week. Don't fancy something? Swap it, or tap a meal for the full recipe.",
  },
  {
    selector: '[data-tour="nav-shopping"]',
    emoji: '🛒',
    title: 'Shopping List',
    body: 'Pick how many of each meal you need this week and get one shopping list, ready to tick off.',
  },
  {
    selector: '[data-tour="nav-training"]',
    emoji: '💪',
    title: 'My Training',
    body: 'Your workouts with sets, reps, and video demos for every exercise.',
  },
  {
    selector: '[data-tour="nav-checkin"]',
    emoji: '✅',
    title: 'Check-in',
    body: 'Log your weight, photos and how the week went here every Friday.',
  },
  {
    selector: '[data-tour="nav-todos"]',
    emoji: '📋',
    title: 'My Daily Plan',
    body: 'Tick off the daily habits your coach set for you.',
  },
  {
    selector: '[data-tour="nav-messages"]',
    emoji: '💬',
    title: 'Message your coach',
    body: 'Questions, swaps, life getting in the way — message your coach straight from here.',
  },
]

const STORAGE_KEY = 'clientTourSeen_v1'
const FIND_TIMEOUT_MS = 1500
const FIND_POLL_MS = 50

// The nav links render twice in the DOM (a desktop sidebar that's always mounted but CSS-hidden
// on small screens, plus a mobile overlay copy) - a plain querySelector would grab whichever
// comes first, which on a phone is the invisible desktop one. Pick the one actually on screen.
function findVisible(selector) {
  const matches = document.querySelectorAll(selector)
  for (const el of matches) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

export function shouldAutoShowTour() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  } catch {
    return false
  }
}

export default function ClientAppTour({ onClose, setSidebarOpen }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function stop() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    setSidebarOpen?.(false)
    onClose()
  }

  // Nav items only exist in the DOM on mobile once the sidebar overlay is open (on desktop the
  // sidebar is always mounted, so this is a no-op there). Poll briefly for the target since it
  // needs at least one render after opening the sidebar.
  useEffect(() => {
    setRect(null)
    if (!current.selector) { setSidebarOpen?.(false); return }
    setSidebarOpen?.(true)

    let cancelled = false
    let elapsed = 0
    const poll = setInterval(() => {
      if (cancelled) return
      const el = findVisible(current.selector)
      if (el) {
        clearInterval(poll)
        setRect(el.getBoundingClientRect())
        return
      }
      elapsed += FIND_POLL_MS
      if (elapsed >= FIND_TIMEOUT_MS) clearInterval(poll)
    }, FIND_POLL_MS)

    return () => { cancelled = true; clearInterval(poll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    if (!current.selector) return
    function reposition() {
      const el = findVisible(current.selector)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [step, current.selector])

  const pad = 8
  const spotlightBox = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }

  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const tooltipBelow = !spotlightBox || (viewportH - spotlightBox.top - spotlightBox.height) > spotlightBox.top

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Blocks clicks on the rest of the app for the whole tour - transparent while a spotlight is
          up (its own box-shadow paints the dark backdrop), opaque on the selector-less welcome step. */}
      <div className={`fixed inset-0 ${spotlightBox ? '' : 'bg-black/60'}`} />
      {spotlightBox && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightBox.top,
            left: spotlightBox.left,
            width: spotlightBox.width,
            height: spotlightBox.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #ec4899',
          }}
        />
      )}

      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-sm px-4"
        style={
          spotlightBox
            ? tooltipBelow
              ? { top: Math.min(spotlightBox.top + spotlightBox.height + 16, viewportH - 220) }
              : { top: Math.max(spotlightBox.top - 232, 16) }
            : { top: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-5 relative">
          <button
            onClick={stop}
            className="absolute top-3.5 right-4 text-xs font-medium text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          >
            Skip
          </button>

          <div className="text-4xl mb-3">{current.emoji}</div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">{current.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{current.body}</p>

          <div className="flex items-center justify-center gap-1.5 mt-5 mb-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand-500' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-shrink-0">
                Back
              </button>
            )}
            <button onClick={() => (isLast ? stop() : setStep(s => s + 1))} className="btn-primary flex-1">
              {isLast ? "Let's go" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
