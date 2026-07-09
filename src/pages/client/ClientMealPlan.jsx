import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import {
  MEAL_GROUPS, ALL_SLOT_DEFS, OPTION_1_KEYS, OPTION_2_KEYS,
  mealMacros, addMacros,
  MealCard, RecipeModal, SwapModal,
} from '../../components/MealPlanView'

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientMealPlan() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)
  const [personalWeek, setPersonalWeek] = useState(null)
  const [mealMap, setMealMap] = useState({})
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [editedSlots, setEditedSlots] = useState({})
  const [templateSlots, setTemplateSlots] = useState({})
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  const [slotsDirty, setSlotsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [ingredientLib, setIngredientLib] = useState({})
  const [coachDelivery, setCoachDelivery] = useState(null)
  const [swapModal, setSwapModal] = useState(null)   // { slotKey, label, cat }
  const [recipeModal, setRecipeModal] = useState(null) // slotKey

  useEffect(() => {
    async function load() {
      const { data: clientRow } = await supabase.from('clients').select('*').eq('profile_id', session.user.id).single()
      if (!clientRow) { setLoading(false); return }
      setClientData(clientRow)

      const { data: asgn } = await supabase.from('client_plan_assignments').select('*').eq('client_id', clientRow.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!asgn) { setLoading(false); return }
      setAssignment(asgn)

      const [{ data: pg }, { count: checkinCount }] = await Promise.all([
        supabase.from('plan_groups').select('current_week').eq('id', asgn.plan_group_id).single(),
        supabase.from('client_checkins').select('id', { count: 'exact', head: true }).eq('client_id', clientRow.id),
      ])
      const effectiveWeek = asgn.week_override ?? pg?.current_week ?? 1
      setWeekNumber(effectiveWeek)
      setPersonalWeek((checkinCount ?? 0) + 1)

      const [{ data: mealsData }, { data: libData }] = await Promise.all([
        supabase.from('meals').select(`
          id, name, category, instructions, photo_url, photo_position,
          meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id),
          meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
            meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id))
        `).eq('coach_id', clientRow.coach_id).order('name'),
        supabase.from('ingredients').select('id, serving_unit').eq('coach_id', clientRow.coach_id),
      ])

      const lib = {}
      for (const ing of (libData || [])) lib[ing.id] = ing
      setIngredientLib(lib)

      const map = {}, byCat = {}
      for (const m of (mealsData || [])) {
        if (m.photo_url) {
          m.photo_url = supabase.storage.from('meal-photos').getPublicUrl(m.photo_url).data.publicUrl
        }
        map[m.id] = m
        ;(byCat[m.category] = byCat[m.category] || []).push(m)
      }
      setMealMap(map)
      setMealsByCategory(byCat)

      const tier = CALORIE_TIERS.includes(asgn.calorie_target) ? asgn.calorie_target : null
      const [{ data: tierTmpl }, { data: stdTmpl }, { data: cwm }] = await Promise.all([
        tier
          ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', asgn.plan_group_id).eq('week_number', effectiveWeek).eq('calorie_tier', tier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', asgn.plan_group_id).eq('week_number', effectiveWeek).is('calorie_tier', null).maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', asgn.id).eq('week_number', effectiveWeek).maybeSingle(),
      ])

      const tmpl = tierTmpl || stdTmpl
      const tSlots = {}
      for (const s of (tmpl?.template_meal_slots || [])) tSlots[s.slot_type] = s.meal_id
      if (asgn.preworkout_static && asgn.preworkout_meal_id) tSlots.preworkout = asgn.preworkout_meal_id
      if (asgn.evening_snack_static && asgn.evening_snack_meal_id) tSlots.evening_snack = asgn.evening_snack_meal_id

      setTemplateSlots(tSlots)
      setEditedSlots({ ...tSlots, ...(cwm?.slots || {}) })
      setIngredientOverrides(cwm?.ingredient_overrides || {})
      setSlotsDirty(false)

      const { data: delivery } = await supabase
        .from('weekly_deliveries')
        .select('id, coach_notes, training_notes, personal_week, delivered_at')
        .eq('client_id', clientRow.id)
        .order('delivered_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setCoachDelivery(delivery)

      setLoading(false)
    }
    load()
  }, [session.user.id])

  const tier = assignment && CALORIE_TIERS.includes(assignment.calorie_target) ? assignment.calorie_target : null

  function sumSlotKeys(keys) {
    return keys.reduce((acc, key) => addMacros(acc, mealMacros(editedSlots[key], mealMap, tier, ingredientOverrides[key])), { cal: 0, prot: 0, carb: 0, fat: 0 })
  }

  const preworkoutM = mealMacros(editedSlots.preworkout, mealMap, tier, ingredientOverrides.preworkout) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const snackM      = mealMacros(editedSlots.evening_snack, mealMap, tier, ingredientOverrides.evening_snack) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const opt1Sub     = sumSlotKeys(OPTION_1_KEYS)
  const opt2Sub     = sumSlotKeys(OPTION_2_KEYS)
  const opt1Total   = addMacros(addMacros(opt1Sub, preworkoutM), snackM)
  const opt2Total   = addMacros(addMacros(opt2Sub, preworkoutM), snackM)

  function handleSwapOpen(slotKey, label, cat) { setSwapModal({ slotKey, label, cat }) }

  function handleSwapSelect(slotKey, newMealId) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: newMealId }))
    setIngredientOverrides(prev => { const n = { ...prev }; delete n[slotKey]; return n })
    setSlotsDirty(true)
    setSwapModal(null)
  }

  function handleRevert(slotKey) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: templateSlots[slotKey] || null }))
    setIngredientOverrides(prev => { const n = { ...prev }; delete n[slotKey]; return n })
    setSlotsDirty(true)
  }

  async function handleSave() {
    if (!assignment || weekNumber == null) return
    setSaving(true); setSaveError(''); setSaved(false)
    const { error } = await supabase.from('client_week_meals').upsert(
      { client_id: clientData.id, coach_id: clientData.coach_id, assignment_id: assignment.id, week_number: weekNumber, slots: editedSlots, ingredient_overrides: ingredientOverrides },
      { onConflict: 'assignment_id,week_number' }
    )
    setSaving(false)
    if (error) { setSaveError('Could not save. Please try again.'); return }
    setSlotsDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  if (!assignment) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Meal Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your weekly meals and daily targets.</p>
        </div>
        <div className="card text-center py-16">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No meal plan set up yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your coach will assign your plan soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Meal Plan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your weekly meals and daily targets.</p>
      </div>

      {/* Week banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20">
        <div className="w-14 h-14 rounded-xl bg-brand-500 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-white leading-none">{personalWeek ?? weekNumber}</span>
          <span className="text-xs text-brand-100 uppercase tracking-wide">Week</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Week {personalWeek ?? weekNumber} of your plan</p>
          {assignment.calorie_target && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.calorie_target} kcal/day target</p>
          )}
        </div>
      </div>

      {/* Coach's weekly message */}
      {coachDelivery?.coach_notes && (
        <div className="card border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-900/10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">Coach's notes — Week {coachDelivery.personal_week}</p>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{coachDelivery.coach_notes}</p>
        </div>
      )}

      {/* Meal groups */}
      {MEAL_GROUPS.map(group => {
        const visibleSlots = group.slots.filter(s => editedSlots[s.key])
        if (visibleSlots.length === 0) return null

        return (
          <section key={group.label}>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">{group.label}</h2>
            <div className="grid grid-cols-2 gap-3">
              {visibleSlots.map(slot => (
                <MealCard
                  key={slot.key}
                  slotKey={slot.key}
                  label={slot.label}
                  optionLabel={slot.optionLabel}
                  cat={slot.cat}
                  mealId={editedSlots[slot.key] || null}
                  templateMealId={templateSlots[slot.key] || null}
                  mealMap={mealMap}
                  mealsByCategory={mealsByCategory}
                  tier={tier}
                  overrides={ingredientOverrides[slot.key]}
                  onSwap={handleSwapOpen}
                  onViewRecipe={setRecipeModal}
                  ingredientLib={ingredientLib}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Daily totals */}
      {(opt1Total.cal > 0 || opt2Total.cal > 0) && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Daily totals</h2>
          {opt1Total.cal > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Option A</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Breakfast A · Lunch A · Dinner A</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(opt1Total.cal)} kcal</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{Math.round(opt1Total.carb)}g C · {Math.round(opt1Total.prot)}g P · {Math.round(opt1Total.fat)}g F</p>
              </div>
            </div>
          )}
          {opt2Sub.cal > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Option B</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Breakfast B · Lunch B · Dinner B</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(opt2Total.cal)} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{Math.round(opt2Total.carb)}g C · {Math.round(opt2Total.prot)}g P · {Math.round(opt2Total.fat)}g F</p>
                </div>
              </div>
            </>
          )}
          {assignment.calorie_target && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 dark:text-gray-500">Daily target</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{assignment.calorie_target} kcal</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Save bar */}
      {slotsDirty && (
        <div className="sticky bottom-4">
          <div className="card flex items-center gap-3 shadow-lg border border-brand-100 dark:border-brand-900/40">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Unsaved meal swaps</p>
              {saveError && <p className="text-xs text-red-500 mt-0.5">{saveError}</p>}
            </div>
            <button onClick={() => { setEditedSlots({ ...templateSlots }); setIngredientOverrides({}); setSlotsDirty(false) }} className="text-sm text-gray-400 hover:text-gray-600 flex-shrink-0">Reset</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-1.5 px-4 text-sm flex-shrink-0">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}

      {saved && !slotsDirty && (
        <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium">Saved</p>
      )}

      {/* Modals */}
      {recipeModal && (
        <RecipeModal
          slotKey={recipeModal}
          mealMap={mealMap}
          editedSlots={editedSlots}
          tier={tier}
          ingredientOverrides={ingredientOverrides}
          templateSlots={templateSlots}
          mealsByCategory={mealsByCategory}
          onClose={() => setRecipeModal(null)}
          onSwap={(slotKey, label, cat) => { setRecipeModal(null); setSwapModal({ slotKey, label, cat }) }}
          onRevert={handleRevert}
        />
      )}

      {swapModal && (
        <SwapModal
          slotKey={swapModal.slotKey}
          label={swapModal.label}
          cat={swapModal.cat}
          currentMealId={editedSlots[swapModal.slotKey] || null}
          mealMap={mealMap}
          mealsByCategory={mealsByCategory}
          tier={tier}
          onSelect={handleSwapSelect}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  )
}
