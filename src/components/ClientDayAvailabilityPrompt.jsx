import { DayAvailabilityRows } from './DayAvailability'

const STORAGE_KEY = 'clientDayAvailabilityPromptSeen_v1'

export function shouldAutoShowDayAvailabilityPrompt() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  } catch {
    return false
  }
}

function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
}

// Shown once, the first time a client opens the app — asks them to mark any days they can't
// train, or days already taken by something else (a sport, a club), so their coach can plan
// training around it from the start instead of finding out after assigning a session. They can
// always come back and change this later from My Profile.
export default function ClientDayAvailabilityPrompt({ clientId, coachId, dayPreferences, onClose }) {
  function done() {
    markSeen()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Before we start — your training availability</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mark a day as "Can't train" if you're unable to do any training that day due to other
            commitments, or note what you're doing instead (a sport, a class) — your coach will
            plan your training around it.
          </p>
        </div>
        <div className="px-6">
          <DayAvailabilityRows clientId={clientId} coachId={coachId} dayPreferences={dayPreferences} />
        </div>
        <div className="px-6 py-4 flex justify-end">
          <button onClick={done} className="btn-primary py-1.5 px-4 text-sm">Done</button>
        </div>
      </div>
    </div>
  )
}
