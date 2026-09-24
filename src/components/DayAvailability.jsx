import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// A day's value in clients.day_preferences is either absent (available, the default), the
// literal string 'unavailable' (can't train that day at all), or any other non-empty string —
// an activity note (e.g. "Netball Club") shown to the coach so they can plan training around
// it without that necessarily meaning the client can't also train that day.
//
// Edits here are a local draft until "Submit" is pressed — one write, with a clear confirmation —
// rather than autosaving every button click/keystroke, so the client always knows exactly when
// their availability actually reached their coach.
//
// coachId is optional — when given, a submit that actually changed something both logs to
// client_activity_log (so it shows on the client's next check-in — see CheckinsTab in
// CoachClientProfile.jsx) and pushes the coach an immediate heads-up (see
// supabase/functions/send-day-preference-notification), from whichever of the three places a
// client can edit this (My Profile, the first-open prompt, or My Training) triggered it.
export function DayAvailabilityRows({ clientId, coachId, dayPreferences, onSaved }) {
  const [prefs, setPrefs] = useState(dayPreferences || {})
  const [savedPrefs, setSavedPrefs] = useState(dayPreferences || {}) // last known-saved state, for the diff a submit logs
  const [activityDrafts, setActivityDrafts] = useState({})
  const [dirty, setDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setPrefs(dayPreferences || {})
    setSavedPrefs(dayPreferences || {})
    setDirty(false)
  }, [dayPreferences])

  function setDay(day, value) {
    setPrefs(prev => {
      const next = { ...prev }
      if (!value) delete next[day]
      else next[day] = value
      return next
    })
    setActivityDrafts(d => { const n = { ...d }; delete n[day]; return n })
    setDirty(true)
    setJustSaved(false)
  }

  async function submit() {
    setSubmitting(true)
    setSaveError(null)
    const { error } = await supabase.from('clients').update({ day_preferences: prefs }).eq('id', clientId)
    setSubmitting(false)
    if (error) { setSaveError(error.message); return }

    setDirty(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
    onSaved?.(prefs)

    if (coachId) {
      const changedDays = DAY_NAMES.filter(d => (savedPrefs[d] ?? null) !== (prefs[d] ?? null))
      if (changedDays.length > 0) {
        const message = changedDays.map(day => {
          const v = prefs[day] ?? null
          return v === null ? `Marked ${day} as available again`
            : v === 'unavailable' ? `Marked ${day} as can't train`
            : `Noted ${day}: ${v}`
        }).join('; ')
        supabase.from('client_activity_log').insert({ client_id: clientId, coach_id: coachId, message })
        supabase.functions.invoke('send-day-preference-notification', { body: { message } }).catch(() => {})
      }
    }
    setSavedPrefs(prefs)
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
                onClick={() => setDay(day, null)}
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
                onClick={() => setDay(day, 'unavailable')}
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
              onChange={e => { setActivityDrafts(d => ({ ...d, [day]: e.target.value })); setDirty(true); setJustSaved(false) }}
              onBlur={() => {
                const trimmed = draft.trim()
                if (trimmed) setDay(day, trimmed)
                else if (isActivity) setDay(day, null)
                else setActivityDrafts(d => { const n = { ...d }; delete n[day]; return n })
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
              placeholder="Activity (e.g. Gym Class, Netball Club, Swimming, etc)"
              className="input text-xs py-1 flex-1 min-w-[9rem]"
            />
          </div>
        )
      })}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={!dirty || submitting}
          className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
        {justSaved && <span className="text-xs font-medium text-green-600 dark:text-green-400">Saved ✓</span>}
        {saveError && <span className="text-xs text-red-500">Couldn't save: {saveError}</span>}
      </div>
    </div>
  )
}
