import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// A day's value in clients.day_preferences is either absent (available, the default), the
// literal string 'unavailable' (can't train that day at all), or any other non-empty string —
// an activity note (e.g. "Football club") shown to the coach so they can plan training around
// it without that necessarily meaning the client can't also train that day.
export function DayAvailabilityRows({ clientId, dayPreferences, onChange }) {
  const [prefs, setPrefs] = useState(dayPreferences || {})
  const [activityDrafts, setActivityDrafts] = useState({})
  const [savingDay, setSavingDay] = useState(null)

  useEffect(() => { setPrefs(dayPreferences || {}) }, [dayPreferences])

  async function save(day, value) {
    const next = { ...prefs }
    if (!value) delete next[day]
    else next[day] = value
    setPrefs(next)
    onChange?.(next)
    setActivityDrafts(d => { const n = { ...d }; delete n[day]; return n })
    setSavingDay(day)
    await supabase.from('clients').update({ day_preferences: next }).eq('id', clientId)
    setSavingDay(null)
  }

  return (
    <div className="space-y-2">
      {DAY_NAMES.map(day => {
        const value = prefs[day]
        const isUnavailable = value === 'unavailable'
        const isActivity = !!value && value !== 'unavailable'
        const draft = activityDrafts[day] ?? (isActivity ? value : '')
        return (
          <div key={day} className="flex flex-wrap items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">{day}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => save(day, null)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  !value
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => save(day, 'unavailable')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isUnavailable
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Can't train
              </button>
            </div>
            <input
              type="text"
              value={draft}
              onChange={e => setActivityDrafts(d => ({ ...d, [day]: e.target.value }))}
              onBlur={() => {
                const trimmed = draft.trim()
                if (trimmed) save(day, trimmed)
                else if (isActivity) save(day, null)
                else setActivityDrafts(d => { const n = { ...d }; delete n[day]; return n })
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
              placeholder="Activity (e.g. Football club)"
              className="input text-xs py-1 flex-1 min-w-[9rem]"
            />
            {savingDay === day && <span className="text-xs text-gray-400 flex-shrink-0">Saving…</span>}
          </div>
        )
      })}
    </div>
  )
}
