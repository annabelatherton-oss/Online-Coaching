import { useState } from 'react'

const TOUR_STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to your plan',
    body: "Everything from your coach lives here — meals, training, check-ins, and more. Quick 30-second tour.",
  },
  {
    emoji: '🍽️',
    title: 'My Meal Plan',
    body: "Your meals for the week. Don't fancy something? Swap it for another option, or tap a meal for the full recipe.",
  },
  {
    emoji: '🛒',
    title: 'Shopping List',
    body: 'Pick how many of each meal you need this week and get one shopping list, ready to tick off as you shop.',
  },
  {
    emoji: '💪',
    title: 'My Training',
    body: 'Your workouts with sets, reps, and video demos for every exercise — log your weights as you go.',
  },
  {
    emoji: '✅',
    title: 'Check-in & Daily Plan',
    body: 'Do your check-in (weight, photos, how the week went) and tick off daily habits from your Daily Plan.',
  },
  {
    emoji: '💬',
    title: 'Message your coach anytime',
    body: 'Questions, swaps, life getting in the way — message your coach straight from the app.',
  },
]

const STORAGE_KEY = 'clientTourSeen_v1'

export function shouldAutoShowTour() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  } catch {
    return false
  }
}

export default function ClientAppTour({ onClose }) {
  const [step, setStep] = useState(0)
  const isLast = step === TOUR_STEPS.length - 1
  const s = TOUR_STEPS[step]

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={finish}
          className="absolute top-4 right-4 text-xs font-medium text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        >
          Skip
        </button>

        <div className="text-5xl mb-4">{s.emoji}</div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{s.body}</p>

        <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand-500' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={() => setStep(st => st - 1)} className="btn-secondary flex-shrink-0">
              Back
            </button>
          )}
          <button onClick={() => (isLast ? finish() : setStep(st => st + 1))} className="btn-primary flex-1">
            {isLast ? "Let's go" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
