import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadDailyMealOptions } from '../lib/dailyMealOptions'
import { addMacros } from './MealPlanView'
import ClientTreatLog from './ClientTreatLog'

const MULTIPLIER_PRESETS = [0, 0.5, 1, 1.5, 2]
const CHOICE_LABELS = { a: 'Option A', b: 'Option B', everyday: 'Everyday meals' }

/**
 * The meal-tracking half of My Daily Plan: for the given day, a client picks which of their three
 * meal options (Option A, Option B, or their fixed Everyday meals) they're actually following,
 * then can scale any of those meals up/down (0 = skipped) to make room for a treat without ever
 * touching their standing weekly plan or client_everyday_meals — this is purely a per-day log.
 * `dateISO` drives everything here, including which day's treats show below, so browsing to a
 * different day on the week strip shows and edits that day, not always today.
 */
export default function ClientDailyMealTracker({ clientId, dateISO }) {
  const [options, setOptions] = useState(null)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [choice, setChoice] = useState(null)
  const [multipliers, setMultipliers] = useState({})
  const [dayLoading, setDayLoading] = useState(true)
  const [savingChoice, setSavingChoice] = useState(false)

  useEffect(() => {
    if (!clientId) return
    loadDailyMealOptions(clientId).then(data => { setOptions(data); setOptionsLoading(false) })
  }, [clientId])

  useEffect(() => {
    if (!clientId || !dateISO) return
    setDayLoading(true)
    async function loadDay() {
      const [{ data: choiceRow }, { data: logRows }] = await Promise.all([
        supabase.from('client_daily_meal_choice').select('choice').eq('client_id', clientId).eq('log_date', dateISO).maybeSingle(),
        supabase.from('client_daily_meal_log').select('slot_key, quantity_multiplier').eq('client_id', clientId).eq('log_date', dateISO),
      ])
      setChoice(choiceRow?.choice || null)
      const m = {}
      for (const r of (logRows || [])) m[r.slot_key] = r.quantity_multiplier
      setMultipliers(m)
      setDayLoading(false)
    }
    loadDay()
  }, [clientId, dateISO])

  async function pickChoice(next) {
    setSavingChoice(true)
    await supabase.from('client_daily_meal_choice').upsert(
      { client_id: clientId, log_date: dateISO, choice: next, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,log_date' },
    )
    setSavingChoice(false)
    setChoice(next)
    setMultipliers({})
  }

  async function setMultiplier(slotKey, value) {
    setMultipliers(prev => ({ ...prev, [slotKey]: value }))
    await supabase.from('client_daily_meal_log').upsert(
      { client_id: clientId, log_date: dateISO, slot_key: slotKey, quantity_multiplier: value, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,log_date,slot_key' },
    )
  }

  if (optionsLoading || dayLoading) return null
  // No active plan assignment at all yet — nothing to track against.
  if (!options) return null

  const optionList = { a: options.optionA, b: options.optionB, everyday: options.everyday }
  const slots = choice ? optionList[choice] : null

  const actualTotal = slots
    ? slots.reduce((acc, s) => {
        const mult = multipliers[s.key] ?? 1
        return addMacros(acc, { cal: s.macros.cal * mult, prot: s.macros.prot * mult, carb: s.macros.carb * mult, fat: s.macros.fat * mult })
      }, { cal: 0, prot: 0, carb: 0, fat: 0 })
    : { cal: 0, prot: 0, carb: 0, fat: 0 }

  return (
    <div className="space-y-4">
      <div data-tour="daily-meals" className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Meals</h2>
          {choice && (
            <button type="button" onClick={() => setChoice(null)} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
              Change ({CHOICE_LABELS[choice]})
            </button>
          )}
        </div>

        {!choice ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {['a', 'b', 'everyday'].map(opt => {
              const list = optionList[opt]
              const total = list.reduce((acc, s) => addMacros(acc, s.macros), { cal: 0, prot: 0, carb: 0, fat: 0 })
              const disabled = list.length === 0
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled || savingChoice}
                  onClick={() => pickChoice(opt)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-left hover:border-brand-300 dark:hover:border-brand-700 transition-colors disabled:opacity-40"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{CHOICE_LABELS[opt]}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {disabled ? 'Not set up yet' : `${Math.round(total.cal)} kcal`}
                  </p>
                </button>
              )
            })}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-2">{CHOICE_LABELS[choice]} isn't set up yet.</p>
        ) : (
          <div className="space-y-1">
            {slots.map(s => {
              const mult = multipliers[s.key] ?? 1
              return (
                <div key={s.key} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${mult === 0 ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{s.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {MULTIPLIER_PRESETS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMultiplier(s.key, p)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          mult === p ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {p === 0 ? '0' : `×${p}`}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {choice && (
        <ClientTreatLog
          clientId={clientId}
          coachId={options.coachId}
          ingredientLib={options.ingredientLib}
          dailyMacroTargets={options.dailyMacroTargets}
          planDailyTotal={actualTotal}
          date={dateISO}
        />
      )}
    </div>
  )
}
