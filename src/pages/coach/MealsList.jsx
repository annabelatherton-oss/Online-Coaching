import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS, missingTiers, createMissingTiersForMeal } from '../../lib/calorieTierScaling'
import { normalizeMealSplit } from '../../lib/calorieSplit'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Evening Snack']

const CATEGORY_VALUE_MAP = {
  'All': 'all',
  'Breakfast': 'breakfast',
  'Lunch': 'lunch',
  'Dinner': 'dinner',
  'Snack': 'snack',
  'Pre-workout': 'pre_workout',
  'Evening Snack': 'evening_snack',
}

const CATEGORY_DISPLAY = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-workout',
  evening_snack: 'Evening Snack',
}

const CATEGORY_BADGE_COLOURS = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch: 'bg-green-100 text-green-700',
  dinner: 'bg-blue-100 text-blue-700',
  snack: 'bg-purple-100 text-purple-700',
  pre_workout: 'bg-orange-100 text-orange-700',
  evening_snack: 'bg-indigo-100 text-indigo-700',
}

function CategoryBadge({ category }) {
  const colours = CATEGORY_BADGE_COLOURS[category] || 'bg-gray-100 text-gray-600'
  const label = CATEGORY_DISPLAY[category] || category
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colours}`}>
      {label}
    </span>
  )
}

function round1(n) {
  return Math.round(n * 10) / 10
}

// Which calorie tiers a meal is still missing, based on its saved meal_tier_versions rows.
function missingTiersFor(meal) {
  const existing = new Set((meal.meal_tier_versions || []).map(v => v.calorie_tier))
  return missingTiers(existing)
}

export default function MealsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [meals, setMeals] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearchRaw] = useState(() => sessionStorage.getItem('mealsSearch') || '')
  const [categoryFilter, setCategoryFilterRaw] = useState(() => sessionStorage.getItem('mealsCategoryFilter') || 'All')

  function setSearch(val) { setSearchRaw(val); sessionStorage.setItem('mealsSearch', val) }
  function setCategoryFilter(val) { setCategoryFilterRaw(val); sessionStorage.setItem('mealsCategoryFilter', val) }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(null)
  const [autoRunDone, setAutoRunDone] = useState(false)

  async function loadMeals() {
    const [{ data, error }, { data: libData }] = await Promise.all([
      supabase
        .from('meals')
        .select(`
          id, name, category, photo_url, photo_position, instructions,
          meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, ingredient_id, scaling_type, unit, alternative_ingredient_ids),
          meal_tier_versions(calorie_tier)
        `)
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase.from('ingredients').select('*').eq('coach_id', profile.id),
    ])

    if (error) console.error(error)
    else setMeals(data || [])
    setLibrary(libData || [])
    setLoading(false)
  }

  useEffect(() => { loadMeals() }, [profile.id])

  // Save scroll position when leaving this page. useLayoutEffect cleanup fires before React
  // removes the DOM nodes, so main.scrollTop is still the real position at this point.
  useLayoutEffect(() => {
    const key = `scroll:${window.location.pathname}`
    return () => {
      const main = document.querySelector('main')
      if (main) sessionStorage.setItem(key, String(main.scrollTop))
    }
  }, [])

  // Restore scroll before the browser paints the loaded list so the user never sees position 0.
  useLayoutEffect(() => {
    if (loading) return
    const saved = parseInt(sessionStorage.getItem(`scroll:${window.location.pathname}`) || '0', 10)
    if (!saved) return
    const main = document.querySelector('main')
    if (main) main.scrollTop = saved
  }, [loading])

  const mealSplit = normalizeMealSplit(profile.meal_split)

  const mealsNeedingTiers = meals.filter(
    m => (m.meal_ingredients || []).length > 0 && m.category && missingTiersFor(m).length > 0
  )

  // Fill in any meals missing a calorie-tier version as soon as the library loads, so coaches
  // never have to remember to click "Create missing tiers" themselves.
  useEffect(() => {
    if (!loading && !autoRunDone && !bulkRunning && mealsNeedingTiers.length > 0) {
      setAutoRunDone(true)
      handleBulkCreateTiers()
    }
  }, [loading, meals])

  async function handleBulkCreateTiers() {
    const targets = mealsNeedingTiers
    if (targets.length === 0) return
    setBulkRunning(true)
    setBulkProgress({ done: 0, total: targets.length })
    const failed = []
    for (const meal of targets) {
      const existing = new Set((meal.meal_tier_versions || []).map(v => v.calorie_tier))
      try {
        const baseIngs = (meal.meal_ingredients || []).map(ing => ({
          ...ing,
          alternatives: (ing.alternative_ingredient_ids || []).map(id => ({ ingredient_id: id })),
        }))
        await createMissingTiersForMeal(meal.id, meal.category, baseIngs, library, mealSplit, existing)
      } catch (err) {
        console.error(`Failed to create calorie tiers for "${meal.name}":`, err)
        failed.push(meal.name)
      }
      setBulkProgress(p => ({ done: p.done + 1, total: p.total }))
    }
    setBulkRunning(false)
    setBulkProgress(null)
    await loadMeals()
    if (failed.length > 0) {
      alert(`Created missing calorie tiers for ${targets.length - failed.length} of ${targets.length} meals.\n\nFailed: ${failed.join(', ')}\n\nCheck the browser console for error details.`)
    }
  }

  async function handleDelete(id) {
    setDeleting(true)
    const { error } = await supabase.from('meals').delete().eq('id', id)
    if (error) {
      console.error(error)
      alert('Could not delete this meal: ' + error.message)
    } else {
      setMeals(prev => prev.filter(m => m.id !== id))
    }
    setDeleting(false)
    setConfirmDeleteId(null)
  }

  function calcTotals(ingredients) {
    const totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    for (const ing of (ingredients || [])) {
      totals.calories += ing.calories || 0
      totals.protein_g += ing.protein_g || 0
      totals.carbs_g += ing.carbs_g || 0
      totals.fat_g += ing.fat_g || 0
    }
    return {
      calories: round1(totals.calories),
      protein_g: round1(totals.protein_g),
      carbs_g: round1(totals.carbs_g),
      fat_g: round1(totals.fat_g),
    }
  }

  const filtered = meals.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      categoryFilter === 'All' || m.category === CATEGORY_VALUE_MAP[categoryFilter]
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {meals.length} meal{meals.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mealsNeedingTiers.length > 0 && (
            <button
              onClick={handleBulkCreateTiers}
              disabled={bulkRunning}
              className="btn-secondary"
              title="Generate any missing calorie-tier versions for every meal in your library, scaled from each meal's base recipe"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {bulkRunning
                ? `Creating tiers… ${bulkProgress?.done ?? 0}/${bulkProgress?.total ?? 0}`
                : `Create missing tiers (${mealsNeedingTiers.length})`}
            </button>
          )}
          <button
            onClick={() => navigate('/coach/meals/new')}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Meal
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search meals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          {meals.length === 0 ? (
            <>
              <p className="text-gray-400 dark:text-gray-500 mb-3">No meals in your library yet.</p>
              <button onClick={() => navigate('/coach/meals/new')} className="btn-primary">
                Add your first meal
              </button>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500">No meals match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(meal => {
            const totals = calcTotals(meal.meal_ingredients)
            const hasBase = (meal.meal_ingredients || []).length > 0
            const missingTierList = hasBase && meal.category ? missingTiersFor(meal) : null
            const photoUrl = meal.photo_url
              ? supabase.storage.from('meal-photos').getPublicUrl(meal.photo_url).data.publicUrl
              : null

            return (
              <div
                key={meal.id}
                onClick={() => navigate(`/coach/meals/${meal.id}`)}
                className="card relative cursor-pointer hover:shadow-md hover:border-pink-200 transition-all duration-150 p-0 overflow-hidden flex flex-col"
              >
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(meal.id) }}
                  title="Delete meal"
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                  </svg>
                </button>

                {/* Photo or placeholder */}
                <div className="aspect-[4/5] bg-pink-50 flex items-center justify-center overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={meal.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: meal.photo_position || '50% 50%' }}
                    />
                  ) : (
                    <svg className="w-12 h-12 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{meal.name}</h3>
                    {meal.category && <CategoryBadge category={meal.category} />}
                  </div>

                  {missingTierList && (
                    missingTierList.length === 0 ? (
                      <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-2">
                        All {CALORIE_TIERS.length} tiers
                      </span>
                    ) : (
                      <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 mb-2">
                        {CALORIE_TIERS.length - missingTierList.length}/{CALORIE_TIERS.length} tiers
                      </span>
                    )
                  )}

                  {/* Macros */}
                  {(meal.meal_ingredients || []).length > 0 ? (
                    <div className="mt-auto pt-3 border-t border-pink-50 grid grid-cols-4 gap-1 text-center">
                      <div>
                        <p className="text-xs text-gray-400">kcal</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{totals.calories}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">C</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{totals.carbs_g}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">P</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{totals.protein_g}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">F</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{totals.fat_g}g</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-auto pt-3 text-xs text-gray-400">No ingredients added yet</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setConfirmDeleteId(null)}>
          <div className="card max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delete this meal?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This removes it from your library and from any meal plans or templates it's used in. This can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} disabled={deleting} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
