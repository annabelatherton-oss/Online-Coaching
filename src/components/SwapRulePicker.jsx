import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { scaledSwapIngredient } from '../lib/mealSwaps'

/**
 * Lets a coach turn a one-off "swap ingredient" fix into a standing rule:
 * either "always swap this for this client" (applies wherever the disliked
 * ingredient shows up) or "just for this meal" (a reusable standard swap for
 * that meal, offered automatically to any other client who dislikes the same
 * ingredient in it).
 */
export default function SwapRulePicker({
  clientId, dislikeName, mealId, mealName, removeId, originalQty,
  ingredients, // full resolved ingredient list for the current meal instance, for the "this meal only" save
  library, onSaved, onClose,
}) {
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const results = search.length >= 1
    ? library.filter(l => l.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []

  async function saveGlobal(libIng) {
    setSaving(true); setError('')
    const { error } = await supabase.from('client_ingredient_swaps').upsert(
      { client_id: clientId, dislike_name: dislikeName, to_ingredient_id: libIng.id },
      { onConflict: 'client_id,dislike_name' }
    )
    setSaving(false)
    if (error) { setError('Could not save.'); return }
    onSaved()
  }

  async function saveForMeal(libIng) {
    setSaving(true); setError('')
    const replacement = scaledSwapIngredient(originalQty, libIng)
    const newIngredients = ingredients.map(ing => (ing.id === removeId) ? replacement : ing)
    const { error } = await supabase.from('meal_swap_options').upsert(
      { meal_id: mealId, dislike_name: dislikeName, label: `${libIng.name} instead of the disliked ingredient`, ingredients: newIngredients },
      { onConflict: 'meal_id,dislike_name' }
    )
    setSaving(false)
    if (error) { setError('Could not save.'); return }
    onSaved()
  }

  return (
    <div className="mt-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Set up a swap rule</p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <input
        autoFocus
        className="input text-sm py-1.5"
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search ingredients to swap to…"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {results.length > 0 && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {results.map(libIng => (
            <div key={libIng.id} className="px-2.5 py-2 flex items-center justify-between gap-2">
              <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{libIng.name}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveGlobal(libIng)}
                  className="text-xs bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded"
                  title="Always swap this ingredient for this client, in every meal, matching macros as closely as possible"
                >
                  Always swap
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveForMeal(libIng)}
                  className="text-xs border border-brand-300 text-brand-600 dark:text-brand-400 dark:border-brand-700 px-2 py-1 rounded"
                  title={`Save as the standard swap for ${mealName}`}
                >
                  Just for {mealName}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
