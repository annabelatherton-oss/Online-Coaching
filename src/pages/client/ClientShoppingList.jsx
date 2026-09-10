import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import { MEAL_GROUPS, ALL_SLOT_DEFS, getIngredients, formatAmount } from '../../components/MealPlanView'
import { loadSwapContext } from '../../lib/mealSwaps'

const CATEGORY_LABELS = {
  protein: 'Protein',
  carbohydrates: 'Carbs',
  vegetables: 'Vegetables',
  fats: 'Fats',
  toppings: 'Toppings & Extras',
  snacks: 'Snacks',
  other: 'Other',
}
const CATEGORY_ORDER = ['protein', 'carbohydrates', 'vegetables', 'fats', 'toppings', 'snacks', 'other']

function PhotoModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <img src={item.photo} alt={item.name} className="w-full aspect-square object-cover" />
        <div className="p-4">
          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
          {(item.productName || item.productBrand) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {[item.productBrand, item.productName].filter(Boolean).join(' — ')}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">This is the exact product your coach used to calculate this ingredient's macros.</p>
          <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function ClientShoppingList() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [noPlan, setNoPlan] = useState(false)
  const [clientId, setClientId] = useState(null)
  const [mealMap, setMealMap] = useState({})
  const [editedSlots, setEditedSlots] = useState({})
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  const [ingredientLib, setIngredientLib] = useState({})
  const [tier, setTier] = useState(null)
  const [swapCtx, setSwapCtx] = useState(null)
  const [selections, setSelections] = useState({})
  const [checkedItems, setCheckedItems] = useState([])
  const [photoModal, setPhotoModal] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: clientRow } = await supabase.from('clients').select('*').eq('profile_id', session.user.id).single()
      if (!clientRow) { setLoading(false); setNoPlan(true); return }
      setClientId(clientRow.id)

      const { data: asgn } = await supabase.from('client_plan_assignments').select('*').eq('client_id', clientRow.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!asgn) { setLoading(false); setNoPlan(true); return }

      const { data: pg } = await supabase.from('plan_groups').select('current_week').eq('id', asgn.plan_group_id).single()
      const effectiveWeek = asgn.week_override ?? pg?.current_week ?? 1

      const [{ data: mealsData }, { data: libData }] = await Promise.all([
        supabase.from('meals').select(`
          id, name, category,
          meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static),
          meal_tier_versions(id, calorie_tier, meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id, is_static))
        `).eq('coach_id', clientRow.coach_id),
        supabase.from('ingredients').select('*').eq('coach_id', clientRow.coach_id),
      ])

      const lib = {}
      for (const ing of (libData || [])) {
        if (ing.product_photo_url) ing.product_photo_url = supabase.storage.from('ingredient-photos').getPublicUrl(ing.product_photo_url).data.publicUrl
        lib[ing.id] = ing
      }
      setIngredientLib(lib)

      const map = {}
      for (const m of (mealsData || [])) map[m.id] = m
      setMealMap(map)

      const calorieTier = CALORIE_TIERS.includes(asgn.calorie_target) ? asgn.calorie_target : null
      setTier(calorieTier)

      const [{ data: tierTmpl }, { data: stdTmpl }, { data: cwm }] = await Promise.all([
        calorieTier
          ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', asgn.plan_group_id).eq('week_number', effectiveWeek).eq('calorie_tier', calorieTier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', asgn.plan_group_id).eq('week_number', effectiveWeek).is('calorie_tier', null).maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', asgn.id).eq('week_number', effectiveWeek).maybeSingle(),
      ])
      const tmpl = tierTmpl || stdTmpl
      const tSlots = {}
      for (const s of (tmpl?.template_meal_slots || [])) tSlots[s.slot_type] = s.meal_id
      if (asgn.preworkout_static && asgn.preworkout_meal_id) tSlots.preworkout = asgn.preworkout_meal_id
      if (asgn.evening_snack_static && asgn.evening_snack_meal_id) tSlots.evening_snack = asgn.evening_snack_meal_id
      const finalSlots = { ...tSlots, ...(cwm?.slots || {}) }
      setEditedSlots(finalSlots)
      setIngredientOverrides(cwm?.ingredient_overrides || {})

      const dislikes = (clientRow.dislikes || []).filter(Boolean)
      if (dislikes.length) {
        const { ingredientSwapsByDislike, mealSwapOptionsByMealAndDislike } = await loadSwapContext(clientRow.id, dislikes)
        setSwapCtx({ dislikes, ingredientSwapsByDislike, mealSwapOptionsByMealAndDislike })
      }

      const { data: sl } = await supabase.from('client_shopping_lists').select('*').eq('client_id', clientRow.id).maybeSingle()
      if (sl) {
        setSelections(sl.selections || {})
        setCheckedItems(sl.checked_items || [])
      } else {
        // Sensible starting point: every slot that has a meal assigned, every day — she adjusts
        // the counts from there (e.g. down to 3x Breakfast A + 4x Breakfast B).
        const defaults = {}
        for (const slot of ALL_SLOT_DEFS) if (finalSlots[slot.key]) defaults[slot.key] = 7
        setSelections(defaults)
      }

      setLoading(false)
    }
    load()
  }, [session.user.id])

  async function persist(nextSelections, nextChecked) {
    if (!clientId) return
    await supabase.from('client_shopping_lists').upsert({
      client_id: clientId,
      selections: nextSelections,
      checked_items: nextChecked,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })
  }

  function setCount(slotKey, value) {
    const count = Math.max(0, Math.min(7, parseInt(value, 10) || 0))
    const next = { ...selections, [slotKey]: count }
    setSelections(next)
    persist(next, checkedItems)
  }

  function toggleChecked(key) {
    const next = checkedItems.includes(key) ? checkedItems.filter(k => k !== key) : [...checkedItems, key]
    setCheckedItems(next)
    persist(selections, next)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />
  if (noPlan) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400 dark:text-gray-500">No active meal plan yet — check back once your coach has set one up.</p>
      </div>
    )
  }

  const availableSlots = ALL_SLOT_DEFS.filter(s => editedSlots[s.key])

  // Aggregate ingredients across every selected slot × its day-count for the week.
  const itemsByKey = {}
  for (const slot of availableSlots) {
    const count = Number(selections[slot.key]) || 0
    if (count <= 0) continue
    const meal = mealMap[editedSlots[slot.key]]
    if (!meal) continue
    const ingredients = getIngredients(meal, tier, ingredientOverrides[slot.key], swapCtx)
    for (const ing of ingredients) {
      const key = ing.ingredient_id || `name:${(ing.name || '').toLowerCase().trim()}`
      const libIng = ing.ingredient_id ? ingredientLib[ing.ingredient_id] : null
      if (!itemsByKey[key]) {
        itemsByKey[key] = {
          key, name: ing.name, unit: ing.unit || 'g', ingredient_id: ing.ingredient_id || null, quantity_g: 0,
          category: libIng?.category || 'other',
          photo: libIng?.product_photo_url || null,
          productName: libIng?.product_name || null,
          productBrand: libIng?.product_brand || null,
        }
      }
      itemsByKey[key].quantity_g += (parseFloat(ing.quantity_g) || 0) * count
    }
  }
  const items = Object.values(itemsByKey).sort((a, b) => a.name.localeCompare(b.name))
  const grouped = {}
  for (const item of items) (grouped[item.category] = grouped[item.category] || []).push(item)
  const categoriesPresent = CATEGORY_ORDER.filter(c => grouped[c]?.length)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping List</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pick how many days this week you'll eat each meal option, and we'll total up everything you need.
        </p>
      </div>

      {/* Day-count selection */}
      <div className="card space-y-4">
        {MEAL_GROUPS.map(group => {
          const slots = group.slots.filter(s => editedSlots[s.key])
          if (slots.length === 0) return null
          const total = slots.reduce((sum, s) => sum + (Number(selections[s.key]) || 0), 0)
          return (
            <div key={group.label}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{group.label}</p>
                {slots.length > 1 && (
                  <span className={`text-xs font-medium ${total === 7 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {total}/7 days
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {slots.map(s => (
                  <div key={s.key} className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/10 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[10rem]">
                      {mealMap[editedSlots[s.key]]?.name || s.label}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={selections[s.key] ?? 0}
                      onChange={e => setCount(s.key, e.target.value)}
                      className="w-14 text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-1 text-sm"
                    />
                    <span className="text-xs text-gray-400">days</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Aggregated list */}
      {items.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500">Set at least one meal to 1+ days above to build your list.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categoriesPresent.map(cat => (
            <div key={cat} className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{CATEGORY_LABELS[cat] || cat}</h3>
              <div className="space-y-1">
                {grouped[cat].map(item => {
                  const checked = checkedItems.includes(item.key)
                  return (
                    <div key={item.key} className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${checked ? 'opacity-50' : 'hover:bg-pink-50/50 dark:hover:bg-pink-900/5'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChecked(item.key)}
                        className="w-5 h-5 rounded-md text-brand-500 focus:ring-brand-500 flex-shrink-0"
                      />
                      {item.photo && (
                        <button type="button" onClick={() => setPhotoModal(item)} className="flex-shrink-0">
                          <img src={item.photo} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                        </button>
                      )}
                      <button type="button" onClick={() => item.photo && setPhotoModal(item)} className="flex-1 min-w-0 text-left">
                        <p className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${checked ? 'line-through' : ''}`}>{item.name}</p>
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 tabular-nums">
                        {formatAmount({ quantity_g: item.quantity_g, unit: item.unit, ingredient_id: item.ingredient_id }, ingredientLib)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {photoModal && <PhotoModal item={photoModal} onClose={() => setPhotoModal(null)} />}
    </div>
  )
}
