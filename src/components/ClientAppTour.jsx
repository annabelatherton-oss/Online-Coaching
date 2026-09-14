import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Step 0 has no page/selectors - it's a plain welcome card, shown wherever the client happens to
// be. Every step after that navigates to the given route and spotlights a real feature already on
// that page. Each step lists its selectors from most to least specific: the first one tries to hit
// the actual feature (e.g. the meal Swap button); if that never shows up - because this client
// doesn't have a plan/programme assigned yet - it falls back to the page's heading instead, so the
// tour still lands somewhere real on every screen rather than going blank.
const STEPS = [
  {
    path: null,
    selectors: [],
    emoji: '👋',
    title: 'Welcome to your plan',
    body: "Everything from your coach lives here. Quick look around — 30 seconds.",
  },
  {
    path: '/client/meals',
    selectors: ['[data-tour="meal-swap-button"]', '[data-tour="meals-heading"]'],
    emoji: '🍽️',
    title: 'My Meal Plan',
    body: "Your meals for the week. Don't fancy something? Swap it, or tap a meal for the full recipe.",
  },
  {
    path: '/client/shopping-list',
    selectors: ['[data-tour="shopping-day-count"]', '[data-tour="shopping-fallback"]'],
    emoji: '🛒',
    title: 'Shopping List',
    body: "Tell it how many days you'll eat each option and get one shopping list for the week.",
  },
  {
    path: '/client/training',
    selectors: ['[data-tour="training-day-card"]', '[data-tour="training-heading"]'],
    emoji: '💪',
    title: 'My Training',
    body: 'Tap a day to see the exercises, sets, reps and video demos.',
  },
  {
    path: '/client/checkin',
    selectors: ['[data-tour="checkin-heading"]'],
    emoji: '✅',
    title: 'Weekly check-in',
    body: 'Log your weight, photos and how the week went here every Friday.',
  },
  {
    path: '/client/todos',
    selectors: ['[data-tour="daily-habits"]', '[data-tour="todos-heading"]'],
    emoji: '📋',
    title: 'Daily habits',
    body: 'Tick off the habits your coach set for you, right here, each day.',
  },
  {
    path: '/client/messages',
    selectors: ['[data-tour="message-compose"]', '[data-tour="messages-heading"]'],
    emoji: '💬',
    title: 'Message your coach',
    body: 'Questions, swaps, life getting in the way — message your coach straight from here.',
  },
]

const STORAGE_KEY = 'clientTourSeen_v1'
const FIND_TIMEOUT_MS = 5000
const FIND_POLL_MS = 100

export function shouldAutoShowTour() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  } catch {
    return false
  }
}

// Tries each selector in order (most specific first) and returns the first match that's actually
// visible on screen - a display:none/zero-size element (e.g. a hidden duplicate elsewhere in the
// DOM) doesn't count.
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

  // Navigate to this step's page (if needed) and locate its target, polling since the page's own
  // data still has to load. If nothing on the selector list ever shows up, skip to the next step
  // rather than leaving the client staring at a tour that never moves on.
  useEffect(() => {
    setRect(null)
    if (!current.path) return // welcome card - nothing to find
    if (location.pathname !== current.path) navigate(current.path)

    let cancelled = false
    let elapsed = 0
    const poll = setInterval(() => {
      if (cancelled) return
      const el = findVisible(current.selectors)
      if (el) {
        clearInterval(poll)
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setTimeout(() => {
          if (!cancelled) setRect(el.getBoundingClientRect())
        }, 350)
        return
      }
      elapsed += FIND_POLL_MS
      if (elapsed >= FIND_TIMEOUT_MS) {
        clearInterval(poll)
        if (!cancelled && step < STEPS.length - 1) setStep(s => s + 1)
      }
    }, FIND_POLL_MS)

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

  // Put the tooltip on whichever side of the spotlight has more room, otherwise (welcome step)
  // just centre it on screen.
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
