import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const TABS = ['Details', 'Ingredients', 'Scaled Versions']

const CATEGORY_OPTIONS = [
  { value: '', label: '— Select category —' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'pre_workout', label: 'Pre-workout' },
  { value: 'evening_snack', label: 'Evening Snack' },
]

const CATEGORY_BADGE_COLOURS = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch: 'bg-green-100 text-green-700',
  dinner: 'bg-blue-100 text-blue-700',
  snack: 'bg-purple-100 text-purple-700',
  pre_workout: 'bg-orange-100 text-orange-700',
  evening_snack: 'bg-indigo-100 text-indigo-700',
}

function round1(n) {
  return Math.round(parseFloat(n || 0) * 10) / 10
}

function calcTotals(ingredients) {
  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const ing of ingredients) {
    totals.calories += parseFloat(ing.calories) || 0
    totals.protein_g += parseFloat(ing.protein_g) || 0
    totals.carbs_g += parseFloat(ing.carbs_g) || 0
    totals.fat_g += parseFloat(ing.fat_g) || 0
  }
  return {
    calories: round1(totals.calories),
    protein_g: round1(totals.protein_g),
    carbs_g: round1(totals.carbs_g),
    fat_g: round1(totals.fat_g),
  }
}

// ─── Details Tab ─────────────────────────────────────────────────────────────
function DetailsTab({ meal, mealId, isNew, onSaved, coachId }) {
  const [form, setForm] = useState({
    name: meal?.name || '',
    category: meal?.category || '',
    instructions: meal?.instructions || '',
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

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
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

    // Upload photo if a new one was selected
    if (photoFile) {
      const path = `${coachId}/${Date.now()}-${photoFile.name}`
      const { error: uploadErr } = await supabase.storage
        .from('meal-photos')
        .upload(path, photoFile)
      if (uploadErr) {
        setError('Photo upload failed: ' + uploadErr.message)
        setSaving(false)
        return
      }
      photoPath = path
    }

    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      instructions: form.instructions || null,
      photo_url: photoPath,
    }

    let savedId = mealId

    if (isNew) {
      const { data, error: insertErr } = await supabase
        .from('meals')
        .insert({ ...payload, coach_id: coachId })
        .select('id')
        .single()
      if (insertErr) { setError(insertErr.message); setSaving(false); return }
      savedId = data.id
    } else {
      const { error: updateErr } = await supabase
        .from('meals')
        .update(payload)
        .eq('id', mealId)
      if (updateErr) { setError(updateErr.message); setSaving(false); return }
    }

    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
    onSaved(savedId)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Meal Details</h3>

        <div>
          <label className="label">Name <span className="text-red-400">*</span></label>
          <input
            className="input"
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Overnight Oats"
            required
          />
        </div>

        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Instructions</label>
          <textarea
            className="input resize-y min-h-[120px]"
            value={form.instructions}
            onChange={e => set('instructions', e.target.value)}
            placeholder="Preparation and cooking instructions…"
          />
        </div>
      </div>

      {/* Photo */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Photo</h3>

        {(photoPreview || currentPhotoUrl) && (
          <div className="w-40 h-40 rounded-xl overflow-hidden border border-pink-100">
            <img
              src={photoPreview || currentPhotoUrl}
              alt="Meal photo"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-secondary"
          >
            {(photoPreview || currentPhotoUrl) ? 'Change Photo' : 'Upload Photo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {photoFile && (
            <p className="mt-2 text-xs text-gray-500">{photoFile.name}</p>
          )}
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
function IngredientsTab({ mealId, coachId }) {
  const [ingredients, setIngredients] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [searchText, setSearchText] = useState({})

  async function load() {
    const [ingRes, libRes] = await Promise.all([
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('created_at', { ascending: true }),
      supabase.from('ingredients').select('*').eq('coach_id', coachId).order('name'),
    ])
    const lib = libRes.data || []
    const ingData = (ingRes.data || []).map(ing => ({
      ...ing,
      _library: ing.ingredient_id ? lib.find(l => l.id === ing.ingredient_id) || null : null,
    }))
    setIngredients(ingData)
    setLibrary(lib)
    setLoading(false)
  }

  useEffect(() => { load() }, [mealId])

  function updateRow(idx, updates) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ...updates } : ing))
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
    if (row._library) {
      updateRow(idx, { quantity_g: amount, ...calcMacros(row._library, amount) })
    } else {
      updateRow(idx, { quantity_g: amount })
    }
  }

  function addRow() {
    setIngredients(prev => [...prev, {
      _isNew: true,
      _tempId: Date.now(),
      meal_id: mealId,
      ingredient_id: null,
      _library: null,
      name: '',
      quantity_g: '',
      calories: '',
      protein_g: '',
      carbs_g: '',
      fat_g: '',
    }])
  }

  async function deleteRow(idx) {
    const ing = ingredients[idx]
    if (!ing._isNew && ing.id) {
      await supabase.from('meal_ingredients').delete().eq('id', ing.id)
    }
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
        calories: parseFloat(ing.calories) || 0,
        protein_g: parseFloat(ing.protein_g) || 0,
        carbs_g: parseFloat(ing.carbs_g) || 0,
        fat_g: parseFloat(ing.fat_g) || 0,
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
          {library.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">Search your library or type a custom ingredient name</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {library.length === 0 && (
            <a href="/coach/ingredients" className="text-xs text-brand-500 hover:text-brand-700 underline">
              Build your ingredient library first
            </a>
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
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-pink-50 dark:bg-pink-900/10 border-b border-pink-100 dark:border-pink-900/30">
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-52">Ingredient</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (g)</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Carbs (g)</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Fat (g)</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 dark:divide-pink-900/10">
              {ingredients.map((ing, idx) => (
                <tr key={ing.id || ing._tempId} className="hover:bg-pink-50/50 dark:hover:bg-pink-900/5 transition-colors">
                  {/* Ingredient name cell */}
                  <td className="px-3 py-2">
                    {ing.ingredient_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ing.name}</span>
                        <button
                          onClick={() => updateRow(idx, { ingredient_id: null, _library: null })}
                          className="flex-shrink-0 text-gray-300 hover:text-red-400 text-lg leading-none"
                          title="Unlink from library"
                        >×</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          className="input py-1.5 text-sm"
                          value={searchText[idx] !== undefined ? searchText[idx] : ing.name}
                          onChange={e => {
                            setSearchText(prev => ({ ...prev, [idx]: e.target.value }))
                            updateRow(idx, { name: e.target.value })
                            setOpenDropdown(idx)
                          }}
                          onFocus={() => {
                            setSearchText(prev => ({ ...prev, [idx]: ing.name || '' }))
                            setOpenDropdown(idx)
                          }}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                          placeholder={library.length > 0 ? 'Search library…' : 'Ingredient name'}
                        />
                        {openDropdown === idx && library.length > 0 && (
                          <div className="absolute z-20 left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-72 max-h-52 overflow-y-auto">
                            {library
                              .filter(l => l.name.toLowerCase().includes((searchText[idx] || '').toLowerCase()))
                              .slice(0, 12)
                              .map(l => (
                                <button
                                  key={l.id}
                                  type="button"
                                  onMouseDown={() => selectLibraryIngredient(idx, l)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-between gap-2"
                                >
                                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{l.name}</span>
                                  <span className="text-xs text-gray-400 flex-shrink-0">{l.calories_per_serving} kcal/{l.serving_size}{l.serving_unit}</span>
                                </button>
                              ))
                            }
                            {library.filter(l => l.name.toLowerCase().includes((searchText[idx] || '').toLowerCase())).length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-400 italic">No matches — will save as custom</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Amount cell */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        className="input py-1.5 text-sm w-20"
                        type="number"
                        min="0"
                        step="0.1"
                        value={ing.quantity_g}
                        onChange={e => updateAmount(idx, e.target.value)}
                        placeholder="0"
                      />
                      {ing._library && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">{ing._library.serving_unit}</span>
                      )}
                    </div>
                  </td>

                  {/* Macro cells — read-only if library-linked, editable if custom */}
                  {['calories', 'protein_g', 'carbs_g', 'fat_g'].map(field => (
                    <td key={field} className="px-3 py-2">
                      {ing.ingredient_id ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 px-1">{ing[field] || 0}</span>
                      ) : (
                        <input
                          className="input py-1.5 text-sm w-20"
                          type="number"
                          min="0"
                          step="0.1"
                          value={ing[field]}
                          onChange={e => updateRow(idx, { [field]: e.target.value })}
                          placeholder="0"
                        />
                      )}
                    </td>
                  ))}

                  {/* Delete */}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteRow(idx)}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove ingredient"
                    >
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
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">—</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.calories}</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.protein_g}</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.carbs_g}</td>
                <td className="px-3 py-2.5 text-gray-800 dark:text-white text-sm">{totals.fat_g}</td>
                <td />
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

// ─── Scaled Versions Tab ──────────────────────────────────────────────────────
function ScaledVersionsTab({ mealId }) {
  const [ingredients, setIngredients] = useState([])
  const [scaledVersions, setScaledVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [calorieTarget, setCalorieTarget] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editingCell, setEditingCell] = useState(null) // { versionId, ingredientId }
  const [editValue, setEditValue] = useState('')

  async function load() {
    const [ingRes, verRes] = await Promise.all([
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('created_at', { ascending: true }),
      supabase.from('meal_scaled_versions').select(`
        id, meal_id, calorie_target, scaling_factor, created_at,
        meal_scaled_ingredients(id, meal_ingredient_id, name, quantity_g, calories, protein_g, carbs_g, fat_g, is_manually_overridden)
      `).eq('meal_id', mealId).order('created_at', { ascending: false }),
    ])
    setIngredients(ingRes.data || [])
    setScaledVersions(verRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [mealId])

  const baseTotals = calcTotals(ingredients)

  async function generateScaledVersion() {
    const target = parseFloat(calorieTarget)
    if (!target || target <= 0) { setGenError('Please enter a valid calorie target.'); return }
    if (baseTotals.calories <= 0) { setGenError('Base meal has 0 calories — add ingredients first.'); return }
    setGenerating(true)
    setGenError('')

    const scalingFactor = round1(target / baseTotals.calories)

    const { data: version, error: verErr } = await supabase
      .from('meal_scaled_versions')
      .insert({
        meal_id: mealId,
        calorie_target: target,
        scaling_factor: scalingFactor,
      })
      .select('id')
      .single()

    if (verErr) { setGenError(verErr.message); setGenerating(false); return }

    const scaledIngRows = ingredients.map(ing => ({
      meal_scaled_version_id: version.id,
      meal_ingredient_id: ing.id,
      name: ing.name,
      quantity_g: round1((ing.quantity_g || 0) * scalingFactor),
      calories: round1((ing.calories || 0) * scalingFactor),
      protein_g: round1((ing.protein_g || 0) * scalingFactor),
      carbs_g: round1((ing.carbs_g || 0) * scalingFactor),
      fat_g: round1((ing.fat_g || 0) * scalingFactor),
      is_manually_overridden: false,
    }))

    if (scaledIngRows.length > 0) {
      const { error: ingErr } = await supabase.from('meal_scaled_ingredients').insert(scaledIngRows)
      if (ingErr) { setGenError(ingErr.message); setGenerating(false); return }
    }

    setGenerating(false)
    setCalorieTarget('')
    load()
  }

  async function deleteVersion(versionId) {
    await supabase.from('meal_scaled_versions').delete().eq('id', versionId)
    if (expandedId === versionId) setExpandedId(null)
    load()
  }

  async function saveEditCell(versionId, ingredientId) {
    const val = parseFloat(editValue)
    if (isNaN(val)) { setEditingCell(null); return }
    await supabase
      .from('meal_scaled_ingredients')
      .update({ calories: val, is_manually_overridden: true })
      .eq('id', ingredientId)
    setEditingCell(null)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  if (ingredients.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Add ingredients first before creating scaled versions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Base meal totals */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Base Meal Totals</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { label: 'Calories', value: baseTotals.calories, unit: 'kcal' },
            { label: 'Protein', value: baseTotals.protein_g, unit: 'g' },
            { label: 'Carbs', value: baseTotals.carbs_g, unit: 'g' },
            { label: 'Fat', value: baseTotals.fat_g, unit: 'g' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-pink-50 dark:bg-pink-900/10 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-400">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generate form */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Generate Scaled Version</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div>
            <label className="label">Calorie target (kcal)</label>
            <input
              className="input w-48"
              type="number"
              min="1"
              value={calorieTarget}
              onChange={e => setCalorieTarget(e.target.value)}
              placeholder="e.g. 400"
            />
          </div>
          <button
            onClick={generateScaledVersion}
            disabled={generating}
            className="btn-primary whitespace-nowrap"
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {calorieTarget && baseTotals.calories > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            Scaling factor: {round1(parseFloat(calorieTarget) / baseTotals.calories)}x
          </p>
        )}
        {genError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{genError}</p>
        )}
      </div>

      {/* Saved scaled versions */}
      {scaledVersions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Saved Versions</h3>
          {scaledVersions.map(version => {
            const vTotals = calcTotals(version.meal_scaled_ingredients || [])
            const isExpanded = expandedId === version.id

            return (
              <div key={version.id} className="card p-0 overflow-hidden">
                {/* Version header */}
                <div className="flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 border-b border-pink-100 dark:border-pink-900/30">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {version.calorie_target} kcal target
                      </p>
                      <p className="text-xs text-gray-400">
                        Factor: {version.scaling_factor}x · {vTotals.protein_g}g P / {vTotals.carbs_g}g C / {vTotals.fat_g}g F
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : version.id)}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                      onClick={() => deleteVersion(version.id)}
                      className="py-1.5 px-3 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded ingredient breakdown */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-pink-100 dark:border-pink-900/30">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Qty (g)</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">P (g)</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">C (g)</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">F (g)</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pink-50 dark:divide-pink-900/10">
                        {(version.meal_scaled_ingredients || []).map(si => {
                          const isEditingThis = editingCell?.ingredientId === si.id

                          return (
                            <tr key={si.id} className={`hover:bg-pink-50/50 dark:hover:bg-pink-900/5 transition-colors ${si.is_manually_overridden ? 'bg-yellow-50/50 dark:bg-yellow-900/5' : ''}`}>
                              <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200 font-medium">
                                {si.name}
                                {si.is_manually_overridden && (
                                  <span className="ml-1.5 text-xs text-yellow-600 dark:text-yellow-400">(edited)</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{si.quantity_g}</td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                                {isEditingThis ? (
                                  <input
                                    className="input py-1 text-sm w-20"
                                    type="number"
                                    step="0.1"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onBlur={() => saveEditCell(version.id, si.id)}
                                    autoFocus
                                  />
                                ) : (
                                  si.calories
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{si.protein_g}</td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{si.carbs_g}</td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{si.fat_g}</td>
                              <td className="px-4 py-2.5 text-right">
                                {!isEditingThis && (
                                  <button
                                    onClick={() => {
                                      setEditingCell({ versionId: version.id, ingredientId: si.id })
                                      setEditValue(String(si.calories))
                                    }}
                                    className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-pink-50 dark:bg-pink-900/10 border-t border-pink-100 dark:border-pink-900/30 font-semibold">
                          <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Totals</td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">—</td>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-white text-sm">{vTotals.calories}</td>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-white text-sm">{vTotals.protein_g}</td>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-white text-sm">{vTotals.carbs_g}</td>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-white text-sm">{vTotals.fat_g}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
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
  // currentId tracks the saved meal id (may change when a new meal is first saved)
  const [currentId, setCurrentId] = useState(isNew ? null : mealId)

  async function loadMeal(id) {
    const { data, error: err } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .eq('coach_id', profile.id)
      .single()
    if (err || !data) {
      setError('Meal not found or you do not have access.')
    } else {
      setMeal(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isNew && mealId) loadMeal(mealId)
  }, [mealId])

  function handleDetailsSaved(savedId) {
    if (isNew && savedId) {
      // Navigate to the real URL so subsequent saves use update, not insert
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

  const pageTitle = isNew ? 'New Meal' : (meal?.name || 'Edit Meal')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/coach/meals')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Meals
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
          {meal?.category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE_COLOURS[meal.category] || 'bg-gray-100 text-gray-600'}`}>
              {CATEGORY_OPTIONS.find(o => o.value === meal.category)?.label || meal.category}
            </span>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 -mx-1 px-1">
        {TABS.map(tab => {
          const disabled = isNew && tab !== 'Details'
          return (
            <button
              key={tab}
              onClick={() => !disabled && setActiveTab(tab)}
              disabled={disabled}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                disabled
                  ? 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : activeTab === tab
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
              {disabled && <span className="ml-1.5 text-xs">(save first)</span>}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Details' && (
          <DetailsTab
            meal={meal}
            mealId={currentId}
            isNew={isNew}
            onSaved={handleDetailsSaved}
            coachId={profile.id}
          />
        )}
        {activeTab === 'Ingredients' && currentId && (
          <IngredientsTab mealId={currentId} coachId={profile.id} />
        )}
        {activeTab === 'Scaled Versions' && currentId && (
          <ScaledVersionsTab mealId={currentId} />
        )}
      </div>
    </div>
  )
}
