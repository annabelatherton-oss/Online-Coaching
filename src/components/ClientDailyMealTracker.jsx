import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadDailyMealOptions } from '../lib/dailyMealOptions'
import { addMacros } from './MealPlanView'
import ClientTreatLog from './ClientTreatLog'

const CHOICE_LABELS = { a: 'Option A', b: 'Option B', everyday: 'Everyday meals' }
const EMPTY_MACROS = { cal: 0, prot: 0, carb: 0, fat: 0 }

/**
 * The meal-tracking half of My Daily Plan: all three meal options (Option A, Option B, and the
 * client's fixed Everyday meals) are listed out in full up front, so a client can see exactly
 * what's in each before choosing — they just say which one they actually had for the day, nothing
 * to scale or edit per meal. `dateISO` drives everything here, including which day's treats show
 * below, so browsing to a different day on the week strip shows and edits that day, not always
 * today.
 */
export default function ClientDailyMealTracker({ clientId, dateISO }) {
  const [options, setOptions] = useState(null)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [choice, setChoice] = useState(null)
  const [dayLoading, setDayLoading] = useState(true)
  const [savingChoice, setSavingChoice] = useState(false)

  useEffect(() => {
    if (!clientId) return
    loadDailyMealOptions(clientId).then(data => { setOptions(data); setOptionsLoading(false) })
  }, [clientId])

  useEffect(() => {
    if (!clientId || !dateISO) return
    setDayLoading(true)
    supabase.from('client_daily_meal_choice').select('choice').eq('client_id', clientId).eq('log_date', dateISO).maybeSingle()
      .then(({ data }) => { setChoice(data?.choice || null); setDayLoading(false) })
  }, [clientId, dateISO])

  async function pickChoice(opt) {
    const next = choice === opt ? null : opt
    setChoice(next)
    setSavingChoice(true)
    if (next) {
      await supabase.from('client_daily_meal_choice').upsert(
        { client_id: clientId, log_date: dateISO, choice: next, updated_at: new Date().toISOString() },
        { onConflict: 'client_id,log_date' },
      )
    } else {
      await supabase.from('client_daily_meal_choice').delete().eq('client_id', clientId).eq('log_date', dateISO)
    }
    setSavingChoice(false)
  }

  if (optionsLoading || dayLoading) return null
  // No active plan assignment at all yet — nothing to track against.
  if (!options) return null

  const optionList = { a: options.optionA, b: options.optionB, everyday: options.everyday }
  const optionTotal = list => list.reduce((acc, s) => addMacros(acc, s.macros), EMPTY_MACROS)
  const actualTotal = choice ? optionTotal(optionList[choice]) : EMPTY_MACROS

  return (
    <div className="space-y-4">
      <div data-tour="daily-meals" className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Meals</h2>

        {['a', 'b', 'everyday'].map(opt => {
          const list = optionList[opt]
          if (list.length === 0) return null
          const total = optionTotal(list)
          const isChosen = choice === opt
          return (
            <div
              key={opt}
              className={`card space-y-2 ${isChosen ? 'border-2 border-brand-400 dark:border-brand-600' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{CHOICE_LABELS[opt]}</p>
                <button
                  type="button"
                  disabled={savingChoice}
                  onClick={() => pickChoice(opt)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                    isChosen
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {isChosen ? '✓ Had this today' : 'I had this'}
                </button>
              </div>
              <div className="space-y-1">
                {list.map(s => (
                  <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-300 truncate">
                      <span className="text-gray-400 dark:text-gray-500">{s.label}: </span>
                      {s.name}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{Math.round(s.macros.cal)} kcal</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Total</span>
                <span className="tabular-nums">{Math.round(total.cal)} kcal · {Math.round(total.carb)}g C · {Math.round(total.prot)}g P · {Math.round(total.fat)}g F</span>
              </div>
            </div>
          )
        })}
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
