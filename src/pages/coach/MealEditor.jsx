import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const TABS = ['Details', 'Ingredients', 'Variants']

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

// XS→XL with the default scale factor applied to flexible ingredients
const VARIANT_SIZES = [
  { name: 'XS',     factor: 0.60 },
  { name: 'Small',  factor: 0.80 },
  { name: 'Medium', factor: 1.00 },
  { name: 'Large',  factor: 1.25 },
  { name: 'XL',     factor: 1.50 },
]

function round1(n) {
  return Math.round(parseFloat(n || 0) * 10) / 10
}

function snapToConstraints(amount, libIng) {
  let val = parseFloat(amount)
  if (isNaN(val) || val <= 0) return val
  const step = libIng?.serving_step
  const min = libIng?.min_amount
  if (step && step > 0) {
    val = Math.round(val / step) * step
    val = Math.round(val * 10000) / 10000
  }
  if (min != null && val > 0 && val < min) val = min
  return val
}

function calcTotals(ingredients) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const ing of ingredients) {
    t.calories  += parseFloat(ing.calories)  || 0
    t.protein_g += parseFloat(ing.protein_g) || 0
    t.carbs_g   += parseFloat(ing.carbs_g)   || 0
    t.fat_g     += parseFloat(ing.fat_g)     || 0
  }
  return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g) }
}

// ─── Details Tab ─────────────────────────────────────────────────────────────
function DetailsTab({ meal, mealId, isNew, onSaved, coachId }) {
  const [form, setForm] = useState({
    name: meal?.name || '',
    category: meal?.category || '',
    description: meal?.description || '',
    instructions: meal?.instructions || '',
    active: meal?.active !== false,
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)
  const fileRef = useRef()

  const currentPhotoUrl = meal?.photo_url
    ? supabase.storage.from('meal-photos').getPublicUrl(meal.photo_url).data.publicUrl
    : null

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

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
    }

    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      description: form.description || null,
      instructions: form.instructions || null,
      photo_url: photoPath,
      active: form.active,
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
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Photo</h3>
        {(photoPreview || currentPhotoUrl) && (
          <div className="w-40 h-40 rounded-xl overflow-hidden border border-pink-100">
            <img src={photoPreview || currentPhotoUrl} alt="Meal photo" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
            {(photoPreview || currentPhotoUrl) ? 'Change Photo' : 'Upload Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          {photoFile && <p className="mt-2 text-xs text-gray-500">{photoFile.name}</p>}
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
function IngredientsTab({ mealId, coachId, onDirtyChange }) {
  const [ingredients, setIngredients] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [searchText, setSearchText] = useState({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => { onDirtyChange?.(dirty) }, [dirty])
  useEffect(() => () => onDirtyChange?.(false), [])

  async function load() {
    const [ingRes, libRes] = await Promise.all([
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('id', { ascending: true }),
      supabase.from('ingredients').select('*').eq('coach_id', coachId).order('name'),
    ])
    const lib = libRes.data || []
    setIngredients((ingRes.data || []).map(ing => ({
      ...ing,
      scaling_type: ing.scaling_type || 'flexible',
      _library: ing.ingredient_id ? lib.find(l => l.id === ing.ingredient_id) || null : null,
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
      scaling_type: 'flexible',
    }])
    setDirty(true)
  }

  async function deleteRow(idx) {
    const ing = ingredients[idx]
    if (!ing._isNew && ing.id) await supabase.from('meal_ingredients').delete().eq('id', ing.id)
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveAll() {
    setSaving(true)
    setError('')
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
      }
      if (ing._isNew) {
        const { error: err } = await supabase.from('meal_ingredients').insert(payload)
        if (err) { setError(err.message); setSaving(false); return }
      } else {
        const { error: err } = await supabase.from('meal_ingredients').update(payload).eq('id', ing.id)
        if (err) { setError(err.message); setSaving(false); return }
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
            Mark each ingredient as <strong>Flex</strong> (scales between variants) or <strong>Fixed</strong> (stays the same — e.g. veggies, spices)
          </p>
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
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 dark:divide-pink-900/10">
              {ingredients.map((ing, idx) => (
                <tr key={ing.id || ing._tempId} className="hover:bg-pink-50/50 dark:hover:bg-pink-900/5 transition-colors">
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
                      onClick={() => updateRow(idx, { scaling_type: ing.scaling_type === 'fixed' ? 'flexible' : 'fixed' })}
                      title="Toggle: Flex scales with variant size, Fixed stays the same"
                      className={`text-xs px-2 py-1 rounded-full border transition-colors whitespace-nowrap ${
                        ing.scaling_type === 'fixed'
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {ing.scaling_type === 'fixed' ? 'Fixed' : 'Flex'}
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
                <td /><td />
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

// ─── Variants Tab ─────────────────────────────────────────────────────────────
function VariantsTab({ mealId, coachId }) {
  const [baseIngredients, setBaseIngredients] = useState([])
  const [variantMap, setVariantMap] = useState({}) // {variantName: {id, ingredients: []}}
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedVariant, setExpandedVariant] = useState(null)
  const [creating, setCreating] = useState(null)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const [ingRes, varRes, libRes] = await Promise.all([
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('id'),
      supabase.from('meal_variants')
        .select('id, variant_name, calories, protein_g, carbs_g, fat_g, meal_variant_ingredients(*)')
        .eq('meal_id', mealId),
      supabase.from('ingredients').select('*').eq('coach_id', coachId).order('name'),
    ])
    setBaseIngredients(ingRes.data || [])
    const lib = libRes.data || []
    setLibrary(lib)
    const map = {}
    for (const v of (varRes.data || [])) {
      map[v.variant_name] = {
        ...v,
        ingredients: (v.meal_variant_ingredients || [])
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
    setVariantMap(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [mealId])

  async function createFromBase(variantName, factor) {
    setCreating(variantName)
    setError('')

    // Remove existing if regenerating
    const existing = variantMap[variantName]
    if (existing?.id) {
      await supabase.from('meal_variants').delete().eq('id', existing.id)
    }

    const scaledIngs = baseIngredients.map(ing => {
      const isFixed = ing.scaling_type === 'fixed'
      const scale = isFixed ? 1.0 : factor
      const origQty = parseFloat(ing.quantity_g) || 0
      const libIng = ing.ingredient_id ? library.find(l => l.id === ing.ingredient_id) || null : null

      let qty = round1(origQty * scale)
      if (libIng) qty = snapToConstraints(qty, libIng) || qty

      if (libIng && libIng.serving_size > 0) {
        // Use library serving data for accurate macros at the snapped quantity
        const f = qty / libIng.serving_size
        return {
          name: ing.name, quantity_g: qty, unit: ing.unit || 'g',
          calories:  round1(f * libIng.calories_per_serving),
          protein_g: round1(f * libIng.protein_per_serving),
          carbs_g:   round1(f * libIng.carbs_per_serving),
          fat_g:     round1(f * libIng.fat_per_serving),
          scaling_type: ing.scaling_type || 'flexible',
          ingredient_id: ing.ingredient_id || null,
        }
      }

      // No library link — scale proportionally from base macros
      const ratio = origQty > 0 ? qty / origQty : scale
      return {
        name: ing.name, quantity_g: qty, unit: ing.unit || 'g',
        calories:  round1((parseFloat(ing.calories)  || 0) * ratio),
        protein_g: round1((parseFloat(ing.protein_g) || 0) * ratio),
        carbs_g:   round1((parseFloat(ing.carbs_g)   || 0) * ratio),
        fat_g:     round1((parseFloat(ing.fat_g)     || 0) * ratio),
        scaling_type: ing.scaling_type || 'flexible',
        ingredient_id: ing.ingredient_id || null,
      }
    })

    const totals = calcTotals(scaledIngs)
    const { data: variant, error: vErr } = await supabase
      .from('meal_variants')
      .insert({ meal_id: mealId, variant_name: variantName, ...totals })
      .select('id')
      .single()

    if (vErr) { setError(vErr.message); setCreating(null); return }

    if (scaledIngs.length > 0) {
      await supabase.from('meal_variant_ingredients').insert(scaledIngs.map(ing => ({ ...ing, variant_id: variant.id })))
    }

    setCreating(null)
    setExpandedVariant(variantName)
    load()
  }

  async function createAllFromBase() {
    for (const { name, factor } of VARIANT_SIZES) {
      await createFromBase(name, factor)
    }
  }

  function updateIngQty(variantName, idx, newQty) {
    const qty = parseFloat(newQty) || 0
    setVariantMap(prev => {
      const v = prev[variantName]
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
      return { ...prev, [variantName]: { ...v, ingredients: updated, ...totals } }
    })
  }

  function snapIngQty(variantName, idx) {
    setVariantMap(prev => {
      const v = prev[variantName]
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
      return { ...prev, [variantName]: { ...v, ingredients: updated, ...totals } }
    })
  }

  async function saveVariant(variantName) {
    const v = variantMap[variantName]
    if (!v) return
    setSaving(variantName)
    setError('')

    const totals = calcTotals(v.ingredients)
    await supabase.from('meal_variants').update({
      calories: totals.calories,
      protein_g: totals.protein_g,
      carbs_g: totals.carbs_g,
      fat_g: totals.fat_g,
    }).eq('id', v.id)

    for (const ing of v.ingredients) {
      if (ing.id) {
        await supabase.from('meal_variant_ingredients').update({
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

  async function deleteVariant(variantName) {
    const v = variantMap[variantName]
    if (!v?.id) return
    await supabase.from('meal_variants').delete().eq('id', v.id)
    if (expandedVariant === variantName) setExpandedVariant(null)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  const baseTotals = calcTotals(baseIngredients)
  const createdCount = Object.keys(variantMap).length
  const allCreated = VARIANT_SIZES.every(s => variantMap[s.name])

  if (baseIngredients.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Add base ingredients first, then come back to create size variants.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Meal Size Variants</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Base meal = {Math.round(baseTotals.calories)} kcal. Clients are auto-assigned the variant closest to their calorie target.
          </p>
        </div>
        {!allCreated && (
          <button
            onClick={createAllFromBase}
            disabled={!!creating}
            className="btn-primary whitespace-nowrap text-sm"
          >
            {creating ? 'Creating…' : 'Create All 5 Variants'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {VARIANT_SIZES.map(({ name, factor }) => {
          const variant = variantMap[name]
          const isExpanded = expandedVariant === name
          const isCreating = creating === name
          const isSaving = saving === name

          if (!variant) {
            return (
              <div key={name} className="card flex items-center justify-between gap-4 py-3 border-dashed">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 tabular-nums">
                    ~{Math.round(baseTotals.calories * factor)} kcal estimated
                  </span>
                </div>
                <button
                  onClick={() => createFromBase(name, factor)}
                  disabled={!!creating}
                  className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                >
                  {isCreating ? 'Creating…' : 'Create from base'}
                </button>
              </div>
            )
          }

          const totals = calcTotals(variant.ingredients)

          return (
            <div key={name} className="card p-0 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
                onClick={() => setExpandedVariant(isExpanded ? null : name)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm flex-shrink-0">{name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {Math.round(totals.calories)} kcal · {Math.round(totals.carbs_g)}g C · {Math.round(totals.protein_g)}g P · {Math.round(totals.fat_g)}g F
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={e => { e.stopPropagation(); deleteVariant(name) }}
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
                        {variant.ingredients.map((ing, idx) => (
                          <tr key={ing.id} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                            <td className="py-2 text-gray-800 dark:text-gray-200 text-sm font-medium pr-2">{ing.name}</td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={ing._library?.min_amount ?? 0}
                                step={ing._library?.serving_step ?? 1}
                                className="input py-1 text-sm w-16"
                                value={ing.quantity_g}
                                onChange={e => updateIngQty(name, idx, e.target.value)}
                                onBlur={() => snapIngQty(name, idx)}
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
                                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              }`}>
                                {ing.scaling_type === 'fixed' ? 'Fixed' : 'Flex'}
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

                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => saveVariant(name)} disabled={isSaving} className="btn-primary py-1.5 px-4 text-sm">
                      {isSaving ? 'Saving…' : 'Save Variant'}
                    </button>
                    <button
                      onClick={() => createFromBase(name, factor)}
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
            {createdCount} of 5 variants created · Clients are auto-assigned the closest variant to their calorie target
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
            navigate('/coach/meals')
          }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Meals
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{isNew ? 'New Meal' : (meal?.name || 'Edit Meal')}</h1>
          {meal?.category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE_COLOURS[meal.category] || 'bg-gray-100 text-gray-600'}`}>
              {CATEGORY_OPTIONS.find(o => o.value === meal.category)?.label || meal.category}
            </span>
          )}
          {meal && !meal.active && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Inactive</span>
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
        {activeTab === 'Ingredients' && currentId && <IngredientsTab mealId={currentId} coachId={profile.id} onDirtyChange={setIngredientsDirty} />}
        {activeTab === 'Variants' && currentId && <VariantsTab mealId={currentId} coachId={profile.id} />}
      </div>
    </div>
  )
}
