import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

/**
 * Lets a client mark which of today's planned meals they actually ate. Unticking one excludes it
 * from `onChange`'s reported total for today only — resets every new calendar day, and never
 * touches the underlying weekly plan (client_week_meals). `slots` is this client's active meal-plan
 * slots for today (key, label, mealName, macros), computed by the caller from data it already has
 * loaded — kept a plain prop rather than refetched here to avoid a second source of truth for what
 * today's plan actually contains.
 */
export default function ClientDailyMealLog({ clientId, slots, onChange }) {
  const [eatenMap, setEatenMap] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState({})

  useEffect(() => {
    if (!clientId) return
    supabase
      .from('client_daily_meal_log')
      .select('slot_key, eaten')
      .eq('client_id', clientId)
      .eq('log_date', todayISO())
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(row => { map[row.slot_key] = row.eaten })
        setEatenMap(map)
        setLoaded(true)
      })
  }, [clientId])

  // Report today's actual (toggle-adjusted) total up to the parent whenever the slot list or the
  // log itself changes — a slot with no row yet defaults to eaten, matching how the day looks
  // before a client has touched anything.
  useEffect(() => {
    if (!loaded) return
    onChange(Object.fromEntries(slots.map(s => [s.key, eatenMap[s.key] !== false])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, eatenMap, slots.map(s => s.key).join(',')])

  async function toggle(slotKey) {
    const next = eatenMap[slotKey] === false ? true : false
    setEatenMap(prev => ({ ...prev, [slotKey]: next }))
    setSaving(prev => ({ ...prev, [slotKey]: true }))
    await supabase.from('client_daily_meal_log').upsert({
      client_id: clientId,
      log_date: todayISO(),
      slot_key: slotKey,
      eaten: next,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id,log_date,slot_key' })
    setSaving(prev => ({ ...prev, [slotKey]: false }))
  }

  if (!loaded || slots.length === 0) return null

  return (
    <div data-tour="daily-meal-log" className="card space-y-3">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Today's meals</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Untick anything you skipped today so your remaining macros stay accurate.</p>
      </div>
      <div className="space-y-1.5">
        {slots.map(s => {
          const eaten = eatenMap[s.key] !== false
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              disabled={saving[s.key] || !s.mealName}
              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors disabled:opacity-50 ${
                eaten ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    eaten
                      ? 'bg-brand-500 border-brand-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {eaten && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm truncate ${eaten ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{s.label}</p>
                  {s.mealName && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.mealName}</p>}
                </div>
              </div>
              {s.mealName && (
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">{Math.round(s.macros?.cal || 0)} kcal</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
