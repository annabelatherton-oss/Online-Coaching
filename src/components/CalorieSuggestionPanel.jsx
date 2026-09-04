import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { suggestCalorieTarget, GOAL_LABELS } from '../lib/calorieSuggestion'

/**
 * Shows a suggested calorie target for a client, built from their stats (height,
 * age, sex, activity level) and how their weight has actually moved over roughly
 * the last 2 weeks compared to what's expected for their goal. Used on the Meal
 * Plan tab and in both check-in response flows so the same reasoning is available
 * wherever a coach might change the number.
 */
export default function CalorieSuggestionPanel({ client, currentTarget, onApply, compact = false }) {
  const [weightPoints, setWeightPoints] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: weightData }, { data: checkinData }] = await Promise.all([
        supabase.from('weight_entries').select('weight_kg, recorded_at').eq('client_id', client.id).order('recorded_at', { ascending: true }),
        supabase.from('client_checkins').select('weight_kg, submitted_at, updated_at').eq('client_id', client.id).not('weight_kg', 'is', null),
      ])
      const manual = weightData || []
      const manualDates = new Set(manual.map(e => e.recorded_at))
      const fromCheckins = (checkinData || [])
        .map(c => ({ weight_kg: c.weight_kg, recorded_at: (c.submitted_at || c.updated_at || '').split('T')[0] }))
        .filter(c => c.recorded_at && !manualDates.has(c.recorded_at))
      const combined = [...manual, ...fromCheckins]
        .filter(p => p.recorded_at && p.weight_kg != null)
        .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
      if (!cancelled) setWeightPoints(combined)
    }
    load()
    return () => { cancelled = true }
  }, [client.id])

  if (weightPoints === null) return null

  const result = suggestCalorieTarget(client, weightPoints, currentTarget)

  if (!result.ready) {
    return (
      <div className={`rounded-xl bg-gray-50 dark:bg-gray-800/40 px-3 py-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <p className="text-gray-500 dark:text-gray-400">
          Add {result.missing.join(', ')} to get a suggested calorie target.
        </p>
      </div>
    )
  }

  const toneClass = {
    keep: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10',
    baseline: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40',
    increase_cardio: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10',
    decrease_calories: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10',
    increase_calories: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10',
  }[result.recommendation.type]

  return (
    <div className={`rounded-xl px-3 py-2.5 space-y-1.5 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>
          Suggested: {Math.round(result.suggestedTarget)} kcal/day
        </p>
        {onApply && result.suggestedTarget !== currentTarget && (
          <button
            type="button"
            onClick={() => onApply(Math.round(result.suggestedTarget))}
            className="text-xs font-medium underline hover:no-underline flex-shrink-0"
          >
            Apply
          </button>
        )}
      </div>
      <p className={compact ? 'text-[11px]' : 'text-xs'}>{result.recommendation.message}</p>
      {!compact && (
        <p className="text-[11px] opacity-75">
          BMR ~{Math.round(result.bmr)} kcal · TDEE ~{Math.round(result.tdee)} kcal
          {result.hasTrend && (
            <> · {result.weeklyRateKg >= 0 ? '+' : ''}{result.weeklyRateKg.toFixed(2)} kg/week since {new Date(result.trendFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</>
          )}
          {client.goal_type && <> · Goal: {GOAL_LABELS[client.goal_type]}</>}
        </p>
      )}
    </div>
  )
}
