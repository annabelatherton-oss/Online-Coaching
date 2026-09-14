import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Three kinds of step:
//  - 'welcome': plain intro, nothing to point at.
//  - 'nav': points at a section's link in the menu, so the client sees where to find it themselves
//     before the tour jumps there for them (opens the mobile nav drawer if it's closed).
//  - 'page': navigates to a real page and spotlights one real feature on it. Selectors are listed
//     most-to-least specific - the first is the actual feature (e.g. the meal Swap button); if
//     that never shows up (this client has no plan/programme assigned yet) it falls back to the
//     page's own heading, so the tour always lands on something real.
// Nothing ever auto-advances - the client taps Next at their own pace, always.
const STEPS = [
  { kind: 'welcome', title: 'Welcome to your plan', body: "Let's take a look around — tap Next whenever you're ready to move on." },

  { kind: 'nav', navSelector: '[data-tour="nav-meals"]', title: 'My Meal Plan', body: "First up — find this in your menu anytime you want to see your meals for the week." },
  { kind: 'page', path: '/client/meals', selectors: ['[data-tour="meals-week-banner"]', '[data-tour="meals-heading"]'], title: 'Your week at a glance', body: "Shows which week of your plan you're on, and your daily calorie target." },
  { kind: 'page', path: '/client/meals', selectors: ['[data-tour="meal-card"]', '[data-tour="meals-heading"]'], title: 'Your meals', body: 'Tap any meal to see the full recipe and ingredients.' },
  { kind: 'page', path: '/client/meals', selectors: ['[data-tour="meal-swap-button"]', '[data-tour="meals-heading"]'], title: 'Swap a meal', body: "Don't fancy it? Tap Swap to pick another option with similar macros." },
  { kind: 'page', path: '/client/meals', selectors: ['[data-tour="meals-daily-totals"]', '[data-tour="meals-heading"]'], title: 'Daily totals', body: 'See your total calories and macros for the day here.' },

  { kind: 'nav', navSelector: '[data-tour="nav-shopping"]', title: 'Shopping List', body: "Next — your Shopping List. It's in your menu too." },
  { kind: 'page', path: '/client/shopping-list', selectors: ['[data-tour="shopping-day-count"]', '[data-tour="shopping-fallback"]'], title: 'Set your days', body: "This is what builds your shopping list — tell it how many days you'll eat each option. Option A and B are completely interchangeable, so mix and match however suits your week." },
  { kind: 'page', path: '/client/shopping-list', selectors: ['[data-tour="shopping-items"]', '[data-tour="shopping-fallback"]'], title: 'Your shopping list', body: 'Everything you need, totalled up and grouped by category — tick items off as you shop.' },

  { kind: 'nav', navSelector: '[data-tour="nav-training"]', title: 'My Training', body: 'Next — My Training, found here in your menu.' },
  { kind: 'page', path: '/client/training', selectors: ['[data-tour="training-day-card"]', '[data-tour="training-heading"]'], title: 'Your workouts', body: 'Tap a day to see the exercises, sets, reps and video demos.' },

  { kind: 'nav', navSelector: '[data-tour="nav-checkin"]', title: 'Check-in', body: 'Next — your weekly Check-in.' },
  { kind: 'page', path: '/client/checkin', selectors: ['[data-tour="checkin-weight"]', '[data-tour="checkin-heading"]'], title: 'Weekly check-in', body: 'Log your weight, photos and how the week went here every Friday.' },

  { kind: 'nav', navSelector: '[data-tour="nav-todos"]', title: 'My Daily Plan', body: 'Next — My Daily Plan.' },
  { kind: 'page', path: '/client/todos', selectors: ['[data-tour="daily-habits"]', '[data-tour="todos-heading"]'], title: 'Daily habits', body: 'Tick off the habits your coach set for you each day.' },
  { kind: 'page', path: '/client/todos', selectors: ['[data-tour="todos-add-task"]', '[data-tour="todos-heading"]'], title: 'Your own tasks', body: 'Add anything else you want to track day-to-day.' },

  { kind: 'nav', navSelector: '[data-tour="nav-messages"]', title: 'Messages', body: 'Last one — Messages.' },
  { kind: 'page', path: '/client/messages', selectors: ['[data-tour="message-compose"]', '[data-tour="messages-heading"]'], title: 'Message your coach', body: 'Questions, swaps, life getting in the way — message your coach straight from here.' },
]

const STORAGE_KEY = 'clientTourSeen_v1'
const POLL_MS = 100
const CARD_ZONE_HALF_HEIGHT = 110 // keeps spotlighted elements clear of the centred card's vertical band

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

export default function ClientAppTour({ onClose, setSidebarOpen }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function stop() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    setSidebarOpen?.(false)
    navigate('/client')
    onClose()
  }

  // Locate this step's target (a nav link or a real page feature), navigating / opening the nav
  // drawer first if needed. Keeps polling for as long as the tour is on this step - no timeout, no
  // auto-advance. The client always decides when to move on.
  useEffect(() => {
    setRect(null)

    if (current.kind === 'welcome') { setSidebarOpen?.(false); return }

    if (current.kind === 'nav') {
      setSidebarOpen?.(true)
    } else {
      setSidebarOpen?.(false)
      if (location.pathname !== current.path) navigate(current.path)
    }

    const selectors = current.kind === 'nav' ? [current.navSelector] : current.selectors
    let cancelled = false
    const poll = setInterval(() => {
      if (cancelled) return
      const el = findVisible(selectors)
      if (!el) return
      clearInterval(poll)
      // Scroll it to the top portion of the screen, clear of the card's zone in the vertical
      // centre - the card sits in the same comfortable spot on every step, so the target needs to
      // stay out of its way rather than the other way round.
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      setTimeout(() => {
        if (cancelled) return
        let r = el.getBoundingClientRect()
        const cardZoneTop = window.innerHeight / 2 - CARD_ZONE_HALF_HEIGHT
        if (r.bottom > cardZoneTop) {
          const main = document.querySelector('main')
          if (main) {
            main.scrollTop += (r.bottom - cardZoneTop) + 16
            r = el.getBoundingClientRect()
          }
        }
        setRect(r)
      }, 350)
    }, POLL_MS)

    return () => { cancelled = true; clearInterval(poll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Keep the spotlight glued to its target through window resizes / orientation changes.
  useEffect(() => {
    const selectors = current.kind === 'nav' ? [current.navSelector] : current.kind === 'page' ? current.selectors : null
    if (!selectors) return
    function reposition() {
      const el = findVisible(selectors)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [step, current])

  const pad = 8
  const spotlightBox = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Transparent while a spotlight is up (its own box-shadow paints the dark backdrop),
          dim on the welcome step / while still looking for this step's target. */}
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

      {/* Always centred on screen with clear space around it on every side - never flush against
          the top, bottom, or edges of the phone. The spotlight moves around to show what's being
          explained; the card explaining it stays put in the same comfortable spot. */}
      <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 pointer-events-auto">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{current.title}</h2>
            <button onClick={stop} className="flex-shrink-0 text-[11px] font-medium text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 mt-0.5">
              Skip
            </button>
          </div>
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
                className="text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3.5 py-1.5 rounded-lg"
              >
                {isLast ? "Let's go" : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
