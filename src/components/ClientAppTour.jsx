import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Every step navigates to a real page and spotlights one real feature on it, with a compact
// callout (not a big modal) pointing at it. Each step lists its selectors from most to least
// specific: the first is the actual feature (e.g. the meal Swap button); if that never shows up -
// because this client doesn't have a plan/programme assigned yet - it falls back to the page's
// heading instead, so the tour always lands on something real. No auto-advance anywhere - the
// client taps Next to move on, at their own pace.
const STEPS = [
  {
    path: null,
    selectors: [],
    title: 'Welcome to your plan',
    body: "Let's take a look around — tap Next whenever you're ready to move on.",
  },
  {
    path: '/client/meals',
    selectors: ['[data-tour="meals-week-banner"]', '[data-tour="meals-heading"]'],
    title: 'Your week at a glance',
    body: "Shows which week of your plan you're on, and your daily calorie target.",
  },
  {
    path: '/client/meals',
    selectors: ['[data-tour="meal-card"]', '[data-tour="meals-heading"]'],
    title: 'Your meals',
    body: 'Tap any meal to see the full recipe and ingredients.',
  },
  {
    path: '/client/meals',
    selectors: ['[data-tour="meal-swap-button"]', '[data-tour="meals-heading"]'],
    title: 'Swap a meal',
    body: "Don't fancy it? Tap Swap to pick another option with similar macros.",
  },
  {
    path: '/client/meals',
    selectors: ['[data-tour="meals-daily-totals"]', '[data-tour="meals-heading"]'],
    title: 'Daily totals',
    body: 'See your total calories and macros for the day here.',
  },
  {
    path: '/client/shopping-list',
    selectors: ['[data-tour="shopping-day-count"]', '[data-tour="shopping-fallback"]'],
    title: 'Set your days',
    body: "Tell it how many days you'll eat each meal option this week.",
  },
  {
    path: '/client/shopping-list',
    selectors: ['[data-tour="shopping-items"]', '[data-tour="shopping-fallback"]'],
    title: 'Your shopping list',
    body: 'Everything you need, grouped by category — tick items off as you shop.',
  },
  {
    path: '/client/training',
    selectors: ['[data-tour="training-day-card"]', '[data-tour="training-heading"]'],
    title: 'Your workouts',
    body: 'Tap a day to see the exercises, sets, reps and video demos.',
  },
  {
    path: '/client/checkin',
    selectors: ['[data-tour="checkin-weight"]', '[data-tour="checkin-heading"]'],
    title: 'Weekly check-in',
    body: 'Log your weight, photos and how the week went here every Friday.',
  },
  {
    path: '/client/todos',
    selectors: ['[data-tour="daily-habits"]', '[data-tour="todos-heading"]'],
    title: 'Daily habits',
    body: 'Tick off the habits your coach set for you each day.',
  },
  {
    path: '/client/todos',
    selectors: ['[data-tour="todos-add-task"]', '[data-tour="todos-heading"]'],
    title: 'Your own tasks',
    body: 'Add anything else you want to track day-to-day.',
  },
  {
    path: '/client/messages',
    selectors: ['[data-tour="message-compose"]', '[data-tour="messages-heading"]'],
    title: 'Message your coach',
    body: 'Questions, swaps, life getting in the way — message your coach straight from here.',
  },
]

const STORAGE_KEY = 'clientTourSeen_v1'
const POLL_MS = 100

export function shouldAutoShowTour() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  } catch {
    return false
  }
}

// Returns the first match that's actually visible on screen - a display:none/zero-size element
// (e.g. a hidden duplicate elsewhere in the DOM) doesn't count.
function findVisible(selectors) {
  for (const sel of selectors) {
    const matches = document.querySelectorAll(sel)
    for (const el of matches) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) return el
    }
  }
  return null
}

export default function ClientAppTour({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function stop() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    navigate('/client')
    onClose()
  }

  // Navigate to this step's page (if needed) and locate its target. Keeps polling for as long as
  // the tour is on this step - no timeout, no auto-advance. The client is always the one who
  // decides when to move on.
  useEffect(() => {
    setRect(null)
    if (!current.path) return // welcome card - nothing to find
    if (location.pathname !== current.path) navigate(current.path)

    let cancelled = false
    const poll = setInterval(() => {
      if (cancelled) return
      const el = findVisible(current.selectors)
      if (el) {
        clearInterval(poll)
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setTimeout(() => {
          if (!cancelled) setRect(el.getBoundingClientRect())
        }, 350)
      }
    }, POLL_MS)

    return () => { cancelled = true; clearInterval(poll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Keep the spotlight glued to its target through window resizes / orientation changes.
  useEffect(() => {
    if (current.selectors.length === 0) return
    function reposition() {
      const el = findVisible(current.selectors)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [step, current.selectors])

  const pad = 8
  const spotlightBox = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }

  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 400
  const tooltipBelow = !spotlightBox || (viewportH - spotlightBox.top - spotlightBox.height) > spotlightBox.top
  const stillLooking = current.path && !spotlightBox

  // Small callout, not a big centred card: anchored just above/below the spotlight and roughly
  // aligned with it horizontally (clamped so it never runs off the sides of the screen).
  const bubbleWidth = 260
  const bubbleLeft = spotlightBox
    ? Math.min(Math.max(spotlightBox.left + spotlightBox.width / 2 - bubbleWidth / 2, 12), viewportW - bubbleWidth - 12)
    : viewportW / 2 - bubbleWidth / 2

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Blocks clicks on the rest of the app for the whole tour - transparent while a spotlight is
          up (its own box-shadow paints the dark backdrop), dim on the welcome step / while still
          looking for this step's target. */}
      <div className={`fixed inset-0 transition-opacity duration-200 ${spotlightBox ? '' : 'bg-black/50'}`} />
      {spotlightBox && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightBox.top,
            left: spotlightBox.left,
            width: spotlightBox.width,
            height: spotlightBox.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 3px #ec4899',
          }}
        />
      )}

      {/* Skip is always reachable, even while still looking for a target. */}
      <button
        onClick={stop}
        className="fixed top-4 right-4 text-xs font-medium text-white/80 hover:text-white bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full"
      >
        Skip tour
      </button>

      {stillLooking && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70 text-sm">
          Loading…
        </div>
      )}

      {(current.path === null || spotlightBox) && (
        <div
          className="fixed"
          style={{
            width: bubbleWidth,
            left: bubbleLeft,
            ...(spotlightBox
              ? tooltipBelow
                ? { top: Math.min(spotlightBox.top + spotlightBox.height + 12, viewportH - 180) }
                : { top: Math.max(spotlightBox.top - 168, 12) }
              : { top: '50%', transform: 'translateY(-50%)' }),
          }}
        >
          {spotlightBox && (
            <div
              className="w-3 h-3 bg-white dark:bg-gray-900 rotate-45 absolute"
              style={{
                left: Math.min(
                  Math.max(spotlightBox.left + spotlightBox.width / 2 - bubbleLeft - 6, 14),
                  bubbleWidth - 26
                ),
                ...(tooltipBelow ? { top: -5 } : { bottom: -5 }),
              }}
            />
          )}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 relative">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1 pr-4">{current.title}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{current.body}</p>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{step + 1} of {STEPS.length}</span>
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)} className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    Back
                  </button>
                )}
                <button
                  onClick={() => (isLast ? stop() : setStep(s => s + 1))}
                  className="text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg"
                >
                  {isLast ? "Let's go" : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
