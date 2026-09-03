import { Fragment, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  CALORIE_TIERS, regenerateAllTiersForMeal, generateTierIngredients,
  tierTargetsForCategory, insertTierVersion, snapToConstraints, calcTotals, allIngredientsFixed,
} from '../../lib/calorieTierScaling'
import { normalizeMealSplit } from '../../lib/calorieSplit'

const TABS = ['Details', 'Ingredients', 'Calorie Tiers']

const CATEGORY_OPTIONS = [
  { value: '', label: '— Select category —' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'pre_workout', label: 'Pre-workout snack' },
  { value: 'evening_snack', label: 'Evening snack' },
]

const CATEGORY_BADGE_COLOURS = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch: 'bg-green-100 text-green-700',
  dinner: 'bg-blue-100 text-blue-700',
  pre_workout: 'bg-orange-100 text-orange-700',
  evening_snack: 'bg-indigo-100 text-indigo-700',
}

function round1(n) {
  return Math.round(parseFloat(n || 0) * 10) / 10
}

// ─── Details Tab ─────────────────────────────────────────────────────────────
function DetailsTab({ meal, mealId, isNew, onSaved, coachId }) {
  const [form, setForm] = useState({
    name: meal?.name || '',
    category: meal?.category || '',
    description: meal?.description || '',
    instructions: meal?.instructions || '',
    active: meal?.active !== false,
    includeInTemplate: !(meal?.excluded_from_templates ?? false),
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [photoPosition, setPhotoPosition] = useState(meal?.photo_position || '50% 50%')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)
  const fileRef = useRef()
  const dragStartRef = useRef(null)

  const currentPhotoUrl = meal?.photo_url
    ? supabase.storage.from('meal-photos').getPublicUrl(meal.photo_url).data.publicUrl
    : null

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function parsePos(str = '50% 50%') {
    const [x, y] = (str || '50% 50%').split(' ').map(v => parseFloat(v))
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }
  }

  function handlePhotoDragStart(e) {
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const pos = parsePos(photoPosition)
    dragStartRef.current = { mouseX: clientX, mouseY: clientY, startX: pos.x, startY: pos.y }

    function onMove(ev) {
      if (!dragStartRef.current) return
      const mx = ev.touches ? ev.touches[0].clientX : ev.clientX
      const my = ev.touches ? ev.touches[0].clientY : ev.clientY
      const dx = mx - dragStartRef.current.mouseX
      const dy = my - dragStartRef.current.mouseY
      const newX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startX - dx * 0.4)))
      const newY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startY - dy * 0.4)))
      setPhotoPosition(`${newX}% ${newY}%`)
    }

    function onEnd() {
      dragStartRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError('')

    let photoPath = meal?.photo_url || null
    if (photoFile) {
      const path = `${coachId}/${Date.now()}-${photoFile.name}`
      const { error: uploadErr } = await supabase.storage.from('meal-photos').upload(path, photoFile)
      if (uploadErr) { setError('Photo upload failed: ' + uploadErr.message); setSaving(false); return }
      photoPath = path
    } else if (photoRemoved) {
      if (meal?.photo_url) await supabase.storage.from('meal-photos').remove([meal.photo_url])
      photoPath = null
    }

    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      description: form.description || null,
      instructions: form.instructions || null,
      photo_url: photoPath,
      photo_position: photoPosition,
      active: form.active,
      excluded_from_templates: !form.includeInTemplate,
    }

    let savedId = mealId
    if (isNew) {
      const { data, error: insertErr } = await supabase.from('meals').insert({ ...payload, coach_id: coachId }).select('id').single()
      if (insertErr) { setError(insertErr.message); setSaving(false); return }
      savedId = data.id
    } else {
      const { error: updateErr } = await supabase.from('meals').update(payload).eq('id', mealId)
      if (updateErr) { setError(updateErr.message); setSaving(false); return }
    }

    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
    onSaved(savedId)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Meal Details</h3>
        <div>
          <label className="label">Name <span className="text-red-400">*</span></label>
          <input className="input" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Overnight Oats" required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description shown to clients" />
        </div>
        <div>
          <label className="label">Instructions</label>
          <textarea className="input resize-y min-h-[100px]" value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Preparation and cooking steps…" />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Active (visible in meal library)</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="includeInTemplate" type="checkbox" checked={form.includeInTemplate} onChange={e => set('includeInTemplate', e.target.checked)} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
          <label htmlFor="includeInTemplate" className="text-sm text-gray-700 dark:text-gray-300">Include in 50-week schedule generation</label>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Photo</h3>
        {(photoPreview || (currentPhotoUrl && !photoRemoved)) && (
          <div className="space-y-1">
            <div
              className="w-full aspect-square rounded-xl overflow-hidden border border-pink-100 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handlePhotoDragStart}
              onTouchStart={handlePhotoDragStart}
            >
              <img
                src={photoPreview || (photoRemoved ? null : currentPhotoUrl)}
                alt="Meal photo"
                className="w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: photoPosition }}
                draggable={false}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Drag photo to reposition</p>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
            {(photoPreview || (currentPhotoUrl && !photoRemoved)) ? 'Change Photo' : 'Upload Photo'}
          </button>
          {(photoPreview || (currentPhotoUrl && !photoRemoved)) && (
            <button
              type="button"
              onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoRemoved(true) }}
              className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Remove photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { setPhotoRemoved(false); handlePhotoChange(e) }} />
          {photoFile && <p className="mt-2 text-xs text-gray-500 w-full">{photoFile.name}</p>}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : isNew ? 'Create Meal' : 'Save Changes'}
        </button>
        {savedMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
    </form>
  )
}

// ─── Ingredients Tab ──────────────────────────────────────────────────────────
function IngredientsTab({ mealId, coachId, category, mealSplit, onDirtyChange }) {
  const [ingredients, setIngredients] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [searchText, setSearchText] = useState({})
  const [dirty, setDirty] = useState(false)
  const [altDropdownOpen, setAltDropdownOpen] = useState(null) // ingredient index
  const [altSearchText, setAltSearchText] = useState('')

  useEffect(() => { onDirtyChange?.(dirty) }, [dirty])
  useEffect(() => () => onDirtyChange?.(false), [])

  async function load() {
    const [ingRes, libRes] = await Promise.all([
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('id', { ascending: true }),
      supabase.from('ingredients').select('*').eq('coach_id', coachId).order('name'),
    ])
    const lib = libRes.data || []
    const ings = ingRes.data || []
    setIngredients(ings.map(ing => ({
      ...ing,
      scaling_type: ing.scaling_type || 'flexible',
      _library: ing.ingredient_id ? lib.find(l => l.id === ing.ingredient_id) || null : null,
      _alternatives: (ing.alternative_ingredient_ids || []).map(id => {
        const libIng = lib.find(l => l.id === id)
        return { ingredient_id: id, name: libIng?.name || '' }
      }),
    })))
    setLibrary(lib)
    setLoading(false)
    setDirty(false)
  }

  useEffect(() => { load() }, [mealId])

  function updateRow(idx, updates) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ...updates } : ing))
    setDirty(true)
  }

  function calcMacros(libIng, amount) {
    const factor = parseFloat(amount) / libIng.serving_size
    if (isNaN(factor) || factor < 0) return { calories: '', protein_g: '', carbs_g: '', fat_g: '' }
    return {
      calories: round1(factor * libIng.calories_per_serving),
      protein_g: round1(factor * libIng.protein_per_serving),
      carbs_g: round1(factor * libIng.carbs_per_serving),
      fat_g: round1(factor * libIng.fat_per_serving),
    }
  }

  function selectLibraryIngredient(idx, libIng) {
    const amount = ingredients[idx].quantity_g
    const macros = amount ? calcMacros(libIng, amount) : { calories: '', protein_g: '', carbs_g: '', fat_g: '' }
    updateRow(idx, { ingredient_id: libIng.id, _library: libIng, name: libIng.name, ...macros })
    setOpenDropdown(null)
    setSearchText(prev => ({ ...prev, [idx]: '' }))
  }

  function updateAmount(idx, amount) {
    const row = ingredients[idx]
    if (row._library) updateRow(idx, { quantity_g: amount, ...calcMacros(row._library, amount) })
    else updateRow(idx, { quantity_g: amount })
  }

  function blurAmount(idx) {
    const row = ingredients[idx]
    if (!row._library) return
    const snapped = snapToConstraints(row.quantity_g, row._library)
    if (!isNaN(snapped) && snapped !== parseFloat(row.quantity_g))
      updateRow(idx, { quantity_g: snapped, ...calcMacros(row._library, snapped) })
  }

  function addRow() {
    setIngredients(prev => [...prev, {
      _isNew: true, _tempId: Date.now(), meal_id: mealId,
      ingredient_id: null, _library: null,
      name: '', quantity_g: '', unit: 'g',
      calories: '', protein_g: '', carbs_g: '', fat_g: '',
      scaling_type: 'flexible', is_static: false, _alternatives: [],
    }])
    setDirty(true)
  }

  async function deleteRow(idx) {
    const ing = ingredients[idx]
    if (!ing._isNew && ing.id) await supabase.from('meal_ingredients').delete().eq('id', ing.id)
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function addAlternative(ingIdx, libIng) {
    const ing = ingredients[ingIdx]
    if ((ing._alternatives || []).some(a => a.ingredient_id === libIng.id)) return
    updateRow(ingIdx, { _alternatives: [...(ing._alternatives || []), { ingredient_id: libIng.id, name: libIng.name }] })
    setAltDropdownOpen(null)
    setAltSearchText('')
  }

  function removeAlternative(ingIdx, altIdx) {
    updateRow(ingIdx, { _alternatives: (ingredients[ingIdx]._alternatives || []).filter((_, i) => i !== altIdx) })
  }

  async function saveAll() {
    setSaving(true)
    setError('')
    const saved = [] // { ing, savedId }
    for (const ing of ingredients) {
      const payload = {
        meal_id: mealId,
        ingredient_id: ing.ingredient_id || null,
        name: ing.name || '',
        quantity_g: parseFloat(ing.quantity_g) || 0,
        unit: ing.unit || 'g',
        calories: parseFloat(ing.calories) || 0,
        protein_g: parseFloat(ing.protein_g) || 0,
        carbs_g: parseFloat(ing.carbs_g) || 0,
        fat_g: parseFloat(ing.fat_g) || 0,
        scaling_type: ing.scaling_type || 'flexible',
        is_static: ing.is_static || false,
        alternative_ingredient_ids: (ing._alternatives || []).map(a => a.ingredient_id),
      }
      if (ing._isNew) {
        const { data: inserted, error: err } = await supabase.from('meal_ingredients').insert(payload).select('id').single()
        if (err) { setError(err.message); setSaving(false); return }
        saved.push({ ing, savedId: inserted.id })
      } else {
        const { error: err } = await supabase.from('meal_ingredients').update(payload).eq('id', ing.id)
        if (err) { setError(err.message); setSaving(false); return }
        saved.push({ ing, savedId: ing.id })
      }
    }

    // Rebuild every calorie-tier version from the base recipe just saved, so ingredient
    // changes always pull through into the tiers without a separate manual step.
    if (saved.length > 0 && category) {
      const baseIngs = saved.map(({ ing }) => ({
        name: ing.name || '',
        quantity_g: parseFloat(ing.quantity_g) || 0,
        unit: ing.unit || 'g',
        calories: parseFloat(ing.calories) || 0,
        protein_g: parseFloat(ing.protein_g) || 0,
        carbs_g: parseFloat(ing.carbs_g) || 0,
        fat_g: parseFloat(ing.fat_g) || 0,
        scaling_type: ing.scaling_type || 'flexible',
        is_static: ing.is_static || false,
        ingredient_id: ing.ingredient_id || null,
        alternatives: (ing._alternatives || []).map(a => ({ ingredient_id: a.ingredient_id })),
        alternative_ingredient_ids: (ing._alternatives || []).map(a => a.ingredient_id),
      }))
      try {
        await regenerateAllTiersForMeal(mealId, category, baseIngs, library, mealSplit)
      } catch (err) {
        console.error('Failed to auto-update calorie tiers:', err)
      }
    }

    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
    load()
  }

  const totals = calcTotals(ingredients)
  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Ingredients</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Mark each ingredient as <strong>Flex</strong> (scales with calorie tiers), <strong>Optional</strong> (scales but can be fully removed if needed), or <strong>Fixed</strong> (always stays the same)
          </p>
          {!category && (
            <p className="text-xs text-amber-500 mt-1">Set a category in Details first — calorie tiers can't be generated without one.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {library.length === 0 && (
            <a href="/coach/ingredients" className="text-xs text-brand-500 hover:text-brand-700 underline">Build ingredient library first</a>
          )}
          <button onClick={addRow} className="btn-secondary py-1.5 px-3 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Ingredient
          </button>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">No ingredients yet.</p>
          <button onClick={addRow} className="btn-primary">Add First Ingredient</button>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-pink-50 dark:bg-pink-900/10 border-b border-pink-100 dark:border-pink-900/30">
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-52">Ingredient</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Carbs (g)</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (g)</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Fat (g)</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Lock</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 dark:divide-pink-900/10">
              {ingredients.map((ing, idx) => (
                <Fragment key={ing.id || ing._tempId}>
                <tr className="hover:bg-pink-50/50 dark:hover:bg-pink-900/5 transition-colors">
                  <td className="px-3 py-2">
                    {ing.ingredient_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ing.name}</span>
                        <button onClick={() => updateRow(idx, { ingredient_id: null, _library: null })} className="flex-shrink-0 text-gray-300 hover:text-red-400 text-lg leading-none" title="Unlink">×</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          className="input py-1.5 text-sm"
                          value={searchText[idx] !== undefined ? searchText[idx] : ing.name}
                          onChange={e => { setSearchText(prev => ({ ...prev, [idx]: e.target.value })); updateRow(idx, { name: e.target.value }); setOpenDropdown(idx) }}
                          onFocus={() => { setSearchText(prev => ({ ...prev, [idx]: ing.name || '' })); setOpenDropdown(idx) }}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                          placeholder={library.length > 0 ? 'Search library…' : 'Ingredient name'}
                        />
                        {openDropdown === idx && library.length > 0 && (
                          <div className="absolute z-20 left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-72 max-h-52 overflow-y-auto">
                            {library.filter(l => l.name.toLowerCase().includes((searchText[idx] || '').toLowerCase())).slice(0, 12).map(l => (
                              <button key={l.id} type="button" onMouseDown={() => selectLibraryIngredient(idx, l)} className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-between gap-2">
                                <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{l.name}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">{l.calories_per_serving} kcal/{l.serving_size}{l.serving_unit}</span>
                              </button>
                            ))}
                            {library.filter(l => l.name.toLowerCase().includes((searchText[idx] || '').toLowerCase())).length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-400 italic">No matches — saves as custom</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <input className="input py-1.5 text-sm w-20" type="number" min={ing._library?.min_amount ?? 0} step={ing._library?.serving_step ?? 0.1} value={ing.quantity_g} onChange={e => updateAmount(idx, e.target.value)} onBlur={() => blurAmount(idx)} placeholder="0" />
                      {ing._library && <span className="text-xs text-gray-400 whitespace-nowrap">{ing._library.serving_unit}</span>}
                    </div>
                  </td>
                  {['calories', 'carbs_g', 'protein_g', 'fat_g'].map(field => (
                    <td key={field} className="px-3 py-2">
                      {ing.ingredient_id ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 px-1">{ing[field] || 0}</span>
                      ) : (
                        <input className="input py-1.5 text-sm w-20" type="number" min="0" step="0.1" value={ing[field]} onChange={e => updateRow(idx, { [field]: e.target.value })} placeholder="0" />
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = ing.scaling_type === 'flexible' ? 'optional' : ing.scaling_type === 'optional' ? 'fixed' : 'flexible'
                        updateRow(idx, { scaling_type: next })
                      }}
                      title="Flex: scales with tier  ·  Optional: scales but can be fully removed  ·  Fixed: always stays the same"
                      className={`text-xs px-2 py-1 rounded-full border transition-colors whitespace-nowrap ${
                        ing.scaling_type === 'fixed'
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          : ing.scaling_type === 'optional'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {ing.scaling_type === 'fixed' ? 'Fixed' : ing.scaling_type === 'optional' ? 'Optional' : 'Flex'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => updateRow(idx, { is_static: !ing.is_static })}
                      title={ing.is_static ? 'Static — click to unlock (allow editing)' : 'Unlocked — click to lock (prevent editing from all views)'}
                      className={`p-1 rounded transition-colors ${ing.is_static ? 'text-amber-500 hover:text-amber-700' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      {ing.is_static ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => deleteRow(idx)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                    <td colSpan={9} className="px-4 pb-2 pt-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-400 mr-0.5">↔ swap:</span>
                        {(ing._alternatives || []).map((alt, ai) => (
                          <span key={alt.ingredient_id} className="inline-flex items-center gap-1 text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                            {alt.name}
                            <button type="button" onClick={() => removeAlternative(idx, ai)} className="text-violet-400 hover:text-violet-700 ml-0.5 leading-none">×</button>
                          </span>
                        ))}
                        {altDropdownOpen === idx ? (
                          <div className="relative">
                            <input
                              autoFocus
                              className="input py-1 text-xs w-36"
                              placeholder="Search…"
                              value={altSearchText}
                              onChange={e => setAltSearchText(e.target.value)}
                              onBlur={() => setTimeout(() => { setAltDropdownOpen(null); setAltSearchText('') }, 150)}
                            />
                            {altSearchText && (
                              <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto w-48">
                                {library
                                  .filter(l =>
                                    l.name.toLowerCase().includes(altSearchText.toLowerCase()) &&
                                    l.id !== ing.ingredient_id &&
                                    !(ing._alternatives || []).some(a => a.ingredient_id === l.id)
                                  )
                                  .slice(0, 10)
                                  .map(l => (
                                    <button key={l.id} type="button" className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 truncate" onMouseDown={() => addAlternative(idx, l)}>
                                      {l.name}
                                    </button>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setAltDropdownOpen(idx); setAltSearchText('') }} className="text-xs text-gray-400 hover:text-violet-600 transition-colors">
                            + add swap
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-pink-50 dark:bg-pink-900/10 border-t border-pink-100 dark:border-pink-900/30 font-semibold">
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Totals</td>
                <td className="px-3 py-2.5 text-gray-400 text-xs">—</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.calories}</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.carbs_g}</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.protein_g}</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.fat_g}</td>
                <td /><td /><td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="flex items-center gap-3">
          <button onClick={saveAll} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Ingredients'}
          </button>
          {savedMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      )}
    </div>
  )
}

// ─── Calorie Tiers Tab ────────────────────────────────────────────────────────
function CalorieTiersTab({ mealId, coachId, category, mealSplit }) {
  const [baseIngredients, setBaseIngredients] = useState([])
  const [tierMap, setTierMap] = useState({}) // {calorie_tier: {id, ingredients: []}}
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTier, setExpandedTier] = useState(null)
  const [creating, setCreating] = useState(null)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const [ingRes, tierRes, libRes] = await Promise.all([
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('id'),
      supabase.from('meal_tier_versions')
        .select('id, calorie_tier, calories, protein_g, carbs_g, fat_g, meal_tier_ingredients(*)')
        .eq('meal_id', mealId),
      supabase.from('ingredients').select('*').eq('coach_id', coachId).order('name'),
    ])
    setBaseIngredients(ingRes.data || [])
    const lib = libRes.data || []
    setLibrary(lib)
    const map = {}
    for (const v of (tierRes.data || [])) {
      map[v.calorie_tier] = {
        ...v,
        ingredients: (v.meal_tier_ingredients || [])
          .sort((a, b) => a.id > b.id ? 1 : -1)
          .map(ing => {
            const libIng = ing.ingredient_id ? lib.find(l => l.id === ing.ingredient_id) || null : null
            return {
              ...ing,
              _library:  libIng,
              _calPerG:  ing.quantity_g > 0 ? ing.calories  / ing.quantity_g : 0,
              _proPerG:  ing.quantity_g > 0 ? ing.protein_g / ing.quantity_g : 0,
              _carbPerG: ing.quantity_g > 0 ? ing.carbs_g   / ing.quantity_g : 0,
              _fatPerG:  ing.quantity_g > 0 ? ing.fat_g     / ing.quantity_g : 0,
            }
          }),
      }
    }
    setTierMap(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [mealId])

  async function createFromBase(tier) {
    setCreating(tier)
    setError('')

    // Remove existing if regenerating
    const existing = tierMap[tier]
    if (existing?.id) {
      await supabase.from('meal_tier_versions').delete().eq('id', existing.id)
    }

    const targets = tierTargetsForCategory(tier, category, mealSplit)
    const generated = generateTierIngredients(baseIngredients, library, targets)

    try {
      await insertTierVersion(mealId, tier, generated)
    } catch (err) {
      setError(err.message)
      setCreating(null)
      return
    }

    setCreating(null)
    setExpandedTier(tier)
    load()
  }

  async function createAllFromBase() {
    for (const tier of CALORIE_TIERS) {
      await createFromBase(tier)
    }
  }

  function updateIngQty(tier, idx, newQty) {
    const qty = parseFloat(newQty) || 0
    setTierMap(prev => {
      const v = prev[tier]
      const updated = v.ingredients.map((ing, i) => {
        if (i !== idx) return ing
        return {
          ...ing,
          quantity_g: newQty,
          calories:  round1(qty * (ing._calPerG  || 0)),
          protein_g: round1(qty * (ing._proPerG  || 0)),
          carbs_g:   round1(qty * (ing._carbPerG || 0)),
          fat_g:     round1(qty * (ing._fatPerG  || 0)),
        }
      })
      const totals = calcTotals(updated)
      return { ...prev, [tier]: { ...v, ingredients: updated, ...totals } }
    })
  }

  function snapIngQty(tier, idx) {
    setTierMap(prev => {
      const v = prev[tier]
      const ing = v.ingredients[idx]
      if (!ing._library) return prev
      const snapped = snapToConstraints(ing.quantity_g, ing._library)
      if (isNaN(snapped) || snapped === parseFloat(ing.quantity_g)) return prev
      const updated = v.ingredients.map((item, i) => {
        if (i !== idx) return item
        return {
          ...item,
          quantity_g: snapped,
          calories:  round1(snapped * (item._calPerG  || 0)),
          protein_g: round1(snapped * (item._proPerG  || 0)),
          carbs_g:   round1(snapped * (item._carbPerG || 0)),
          fat_g:     round1(snapped * (item._fatPerG  || 0)),
        }
      })
      const totals = calcTotals(updated)
      return { ...prev, [tier]: { ...v, ingredients: updated, ...totals } }
    })
  }

  async function saveTier(tier) {
    const v = tierMap[tier]
    if (!v) return
    setSaving(tier)
    setError('')

    const totals = calcTotals(v.ingredients)
    await supabase.from('meal_tier_versions').update({
      calories: totals.calories,
      protein_g: totals.protein_g,
      carbs_g: totals.carbs_g,
      fat_g: totals.fat_g,
    }).eq('id', v.id)

    for (const ing of v.ingredients) {
      if (ing.id) {
        await supabase.from('meal_tier_ingredients').update({
          quantity_g: parseFloat(ing.quantity_g) || 0,
          calories: parseFloat(ing.calories) || 0,
          protein_g: parseFloat(ing.protein_g) || 0,
          carbs_g: parseFloat(ing.carbs_g) || 0,
          fat_g: parseFloat(ing.fat_g) || 0,
        }).eq('id', ing.id)
      }
    }

    setSaving(null)
    load()
  }

  async function deleteTier(tier) {
    const v = tierMap[tier]
    if (!v?.id) return
    await supabase.from('meal_tier_versions').delete().eq('id', v.id)
    if (expandedTier === tier) setExpandedTier(null)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  const baseTotals = calcTotals(baseIngredients)
  const createdCount = Object.keys(tierMap).length
  const allCreated = CALORIE_TIERS.every(t => tierMap[t])

  if (baseIngredients.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Add and save base ingredients first — calorie tiers are created automatically once you do.</p>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Set a category in the Details tab first — calorie tiers are generated from your coach-wide meal split % for that category.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Calorie-Tier Versions</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Base meal = {Math.round(baseTotals.calories)} kcal. Tiers are created and kept in sync automatically whenever you save ingredients — use the buttons below only to regenerate a tier on its own.
          </p>
        </div>
        {!allCreated && (
          <button
            onClick={createAllFromBase}
            disabled={!!creating}
            className="btn-primary whitespace-nowrap text-sm"
          >
            {creating ? 'Creating…' : `Create All ${CALORIE_TIERS.length} Tiers`}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {allIngredientsFixed(baseIngredients) && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Every ingredient in this meal is marked Fixed, so it can't be scaled — every tier below will just be the base recipe's amount. Mark at least one ingredient Flexible above so tiers can adjust to match each target.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {CALORIE_TIERS.map(tier => {
          const version = tierMap[tier]
          const isExpanded = expandedTier === tier
          const isCreating = creating === tier
          const isSaving = saving === tier
          const target = tierTargetsForCategory(tier, category, mealSplit)

          if (!version) {
            return (
              <div key={tier} className="card flex items-center justify-between gap-4 py-3 border-dashed">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{tier} kcal</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 tabular-nums">
                    target {Math.round(target.calories)} kcal · {Math.round(target.protein_g)}P / {Math.round(target.carbs_g)}C / {Math.round(target.fat_g)}F
                  </span>
                </div>
                <button
                  onClick={() => createFromBase(tier)}
                  disabled={!!creating}
                  className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                >
                  {isCreating ? 'Creating…' : 'Create from base'}
                </button>
              </div>
            )
          }

          const totals = calcTotals(version.ingredients)

          return (
            <div key={tier} className="card p-0 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm flex-shrink-0">{tier} kcal</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {Math.round(totals.calories)} kcal · {Math.round(totals.carbs_g)}g C · {Math.round(totals.protein_g)}g P · {Math.round(totals.fat_g)}g F
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={e => { e.stopPropagation(); deleteTier(tier) }}
                    className="text-xs text-red-400 hover:text-red-600 font-medium px-1"
                  >
                    Delete
                  </button>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead>
                        <tr className="border-b border-pink-100 dark:border-pink-900/30">
                          <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">g</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">kcal</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">C</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">F</th>
                          <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pink-50 dark:divide-pink-900/10">
                        {version.ingredients.map((ing, idx) => (
                          <tr key={ing.id} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                            <td className="py-2 text-gray-800 dark:text-gray-200 text-sm font-medium pr-2">{ing.name}</td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={ing._library?.min_amount ?? 0}
                                step={ing._library?.serving_step ?? 1}
                                className="input py-1 text-sm w-16"
                                value={ing.quantity_g}
                                onChange={e => updateIngQty(tier, idx, e.target.value)}
                                onBlur={() => snapIngQty(tier, idx)}
                              />
                            </td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums">{Math.round(parseFloat(ing.calories) || 0)}</td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums">{Math.round(parseFloat(ing.carbs_g) || 0)}</td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums">{Math.round(parseFloat(ing.protein_g) || 0)}</td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums">{Math.round(parseFloat(ing.fat_g) || 0)}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                ing.scaling_type === 'fixed'
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  : ing.scaling_type === 'optional'
                                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              }`}>
                                {ing.scaling_type === 'fixed' ? 'Fixed' : ing.scaling_type === 'optional' ? 'Optional' : 'Flex'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-pink-100 dark:border-pink-900/30 font-semibold bg-pink-50 dark:bg-pink-900/10">
                          <td className="py-2 text-xs text-gray-500 uppercase tracking-wider">Total</td>
                          <td className="py-2 px-3 text-gray-400 text-xs">—</td>
                          <td className="py-2 px-3 text-gray-800 dark:text-white text-sm tabular-nums">{Math.round(totals.calories)}</td>
                          <td className="py-2 px-3 text-gray-800 dark:text-white text-sm tabular-nums">{Math.round(totals.carbs_g)}</td>
                          <td className="py-2 px-3 text-gray-800 dark:text-white text-sm tabular-nums">{Math.round(totals.protein_g)}</td>
                          <td className="py-2 px-3 text-gray-800 dark:text-white text-sm tabular-nums">{Math.round(totals.fat_g)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <p className="text-xs text-gray-400">
                    Target for this tier: {Math.round(target.calories)} kcal · {Math.round(target.protein_g)}g P · {Math.round(target.carbs_g)}g C · {Math.round(target.fat_g)}g F
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => saveTier(tier)} disabled={isSaving} className="btn-primary py-1.5 px-4 text-sm">
                      {isSaving ? 'Saving…' : 'Save Tier'}
                    </button>
                    <button
                      onClick={() => createFromBase(tier)}
                      disabled={!!creating}
                      className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Regenerate from base
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {createdCount > 0 && (
        <div className="card bg-pink-50/40 dark:bg-pink-900/10 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {createdCount} of {CALORIE_TIERS.length} tiers created · Every client assigned this exact calorie tier sees this ingredient set
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MealEditor() {
  const { mealId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isNew = mealId === 'new' || !mealId
  const [meal, setMeal] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Details')
  const [currentId, setCurrentId] = useState(isNew ? null : mealId)
  const [ingredientsDirty, setIngredientsDirty] = useState(false)

  const mealSplit = normalizeMealSplit(profile?.meal_split)

  function changeTab(tab) {
    if (tab === activeTab) return
    if (activeTab === 'Ingredients' && ingredientsDirty) {
      if (!window.confirm('You have unsaved ingredient changes that will be lost if you switch tabs. Continue anyway?')) return
    }
    setActiveTab(tab)
  }

  async function loadMeal(id) {
    const { data, error: err } = await supabase.from('meals').select('*').eq('id', id).eq('coach_id', profile.id).single()
    if (err || !data) setError('Meal not found or you do not have access.')
    else setMeal(data)
    setLoading(false)
  }

  useEffect(() => { if (!isNew && mealId) loadMeal(mealId) }, [mealId])

  function handleDetailsSaved(savedId) {
    if (isNew && savedId) {
      navigate(`/coach/meals/${savedId}`, { replace: true })
      setCurrentId(savedId)
      loadMeal(savedId)
    } else if (currentId) {
      loadMeal(currentId)
    }
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />
  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => {
            if (ingredientsDirty && !window.confirm('You have unsaved ingredient changes that will be lost if you leave. Continue anyway?')) return
            navigate(-1)
          }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Meals
        </button>
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{isNew ? 'New Meal' : (meal?.name || 'Edit Meal')}</h1>
          {meal?.category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${CATEGORY_BADGE_COLOURS[meal.category] || 'bg-gray-100 text-gray-600'}`}>
              {CATEGORY_OPTIONS.find(o => o.value === meal.category)?.label || meal.category}
            </span>
          )}
          {meal && !meal.active && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0">Inactive</span>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 -mx-1 px-1">
        {TABS.map(tab => {
          const disabled = isNew && tab !== 'Details'
          return (
            <button
              key={tab}
              onClick={() => !disabled && changeTab(tab)}
              disabled={disabled}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                disabled
                  ? 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : activeTab === tab
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}{disabled && <span className="ml-1.5 text-xs">(save first)</span>}
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === 'Details' && <DetailsTab meal={meal} mealId={currentId} isNew={isNew} onSaved={handleDetailsSaved} coachId={profile.id} />}
        {activeTab === 'Ingredients' && currentId && <IngredientsTab mealId={currentId} coachId={profile.id} category={meal?.category} mealSplit={mealSplit} onDirtyChange={setIngredientsDirty} />}
        {activeTab === 'Calorie Tiers' && currentId && <CalorieTiersTab mealId={currentId} coachId={profile.id} category={meal?.category} mealSplit={mealSplit} />}
      </div>
    </div>
  )
}
