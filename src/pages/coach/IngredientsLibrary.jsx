import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { propagateIngredientRuleChange } from '../../lib/mealVariants'

const UNIT_OPTIONS = ['g', 'ml', 'tbsp', 'tsp', 'cup', 'piece', 'square', 'scoop', 'slice', 'handful']

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'carbohydrates', label: 'Carbohydrates' },
  { value: 'protein', label: 'Protein' },
  { value: 'fats', label: 'Fats' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'toppings', label: 'Toppings' },
  { value: 'snacks', label: 'Snacks' },
]

const CATEGORY_COLOURS = {
  carbohydrates: 'bg-yellow-100 text-yellow-700',
  protein:       'bg-blue-100 text-blue-700',
  fats:          'bg-orange-100 text-orange-700',
  vegetables:    'bg-green-100 text-green-700',
  toppings:      'bg-purple-100 text-purple-700',
  snacks:        'bg-pink-100 text-pink-700',
}

const EMPTY_FORM = {
  name: '',
  category: '',
  serving_size: '100',
  serving_unit: 'g',
  serving_step: '',
  min_amount: '',
  calories_per_serving: '',
  protein_per_serving: '',
  carbs_per_serving: '',
  fat_per_serving: '',
}

function IngredientModal({ ingredient, onSave, onClose, coachId }) {
  const [form, setForm] = useState(ingredient ? {
    name: ingredient.name,
    category: ingredient.category || '',
    serving_size: String(ingredient.serving_size),
    serving_unit: ingredient.serving_unit,
    serving_step: ingredient.serving_step != null ? String(ingredient.serving_step) : '',
    min_amount: ingredient.min_amount != null ? String(ingredient.min_amount) : '',
    calories_per_serving: String(ingredient.calories_per_serving),
    protein_per_serving: String(ingredient.protein_per_serving),
    carbs_per_serving: String(ingredient.carbs_per_serving),
    fat_per_serving: String(ingredient.fat_per_serving),
  } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.serving_size || parseFloat(form.serving_size) <= 0) { setError('Serving size must be greater than 0.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      serving_size: parseFloat(form.serving_size),
      serving_unit: (form.serving_unit || 'g').trim(),
      serving_step: form.serving_step !== '' ? parseFloat(form.serving_step) : null,
      min_amount: form.min_amount !== '' ? parseFloat(form.min_amount) : null,
      calories_per_serving: parseFloat(form.calories_per_serving) || 0,
      protein_per_serving: parseFloat(form.protein_per_serving) || 0,
      carbs_per_serving: parseFloat(form.carbs_per_serving) || 0,
      fat_per_serving: parseFloat(form.fat_per_serving) || 0,
    }

    let err
    if (ingredient) {
      ({ error: err } = await supabase.from('ingredients').update(payload).eq('id', ingredient.id))
      if (!err) {
        // Pull the new macros/serving rules through into every meal and size variant that
        // already uses this ingredient, so they never go stale.
        try {
          await propagateIngredientRuleChange(ingredient.id, payload)
        } catch (propErr) {
          console.error('Failed to propagate ingredient change to meals:', propErr)
        }
      }
    } else {
      ({ error: err } = await supabase.from('ingredients').insert({ ...payload, coach_id: coachId }))
    }

    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ingredient ? 'Edit Ingredient' : 'Add Ingredient'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="label">Ingredient Name <span className="text-red-400">*</span></label>
            <input
              className="input"
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Oats, Chia Seeds, Dark Chocolate"
              autoFocus
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">— Select category —</option>
              {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Serving Size <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input
                className="input w-28"
                type="number"
                min="0.01"
                step="0.01"
                value={form.serving_size}
                onChange={e => set('serving_size', e.target.value)}
                placeholder="100"
              />
              <input
                className="input flex-1"
                type="text"
                value={form.serving_unit}
                onChange={e => set('serving_unit', e.target.value)}
                placeholder="g"
                list="unit-options"
              />
              <datalist id="unit-options">
                {UNIT_OPTIONS.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
            <p className="mt-1 text-xs text-gray-400">e.g. 100 g · 15 g · 1 square · 1 tbsp</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Step (increment)</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.serving_step} onChange={e => set('serving_step', e.target.value)} placeholder="e.g. 5, 1, 0.5" />
              <p className="mt-1 text-xs text-gray-400">Amount must be a multiple of this</p>
            </div>
            <div>
              <label className="label">Min amount</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.min_amount} onChange={e => set('min_amount', e.target.value)} placeholder="e.g. 40" />
              <p className="mt-1 text-xs text-gray-400">Never use less than this</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Calories</label>
              <input className="input" type="number" min="0" step="0.1" value={form.calories_per_serving} onChange={e => set('calories_per_serving', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Protein (g)</label>
              <input className="input" type="number" min="0" step="0.1" value={form.protein_per_serving} onChange={e => set('protein_per_serving', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Carbs (g)</label>
              <input className="input" type="number" min="0" step="0.1" value={form.carbs_per_serving} onChange={e => set('carbs_per_serving', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Fat (g)</label>
              <input className="input" type="number" min="0" step="0.1" value={form.fat_per_serving} onChange={e => set('fat_per_serving', e.target.value)} placeholder="0" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : ingredient ? 'Save Changes' : 'Add Ingredient'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function IngredientsLibrary() {
  const { profile } = useAuth()
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .eq('coach_id', profile.id)
      .order('name', { ascending: true })
    setIngredients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.id])

  async function handleDelete(id) {
    if (!confirm('Delete this ingredient? Meals that already use it will keep their saved values.')) return
    await supabase.from('ingredients').delete().eq('id', id)
    load()
  }

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(ing) { setEditing(ing); setModalOpen(true) }
  function handleSaved() { setModalOpen(false); load() }

  const filtered = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'all' || ing.category === activeCategory
    return matchesSearch && matchesCat
  })

  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = c.value === 'all'
      ? ingredients.length
      : ingredients.filter(i => i.category === c.value).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ingredient Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} — add once, reuse in any meal
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Ingredient
        </button>
      </div>

      {/* Search + category filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search ingredients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {cat.label}
              <span className={`ml-1.5 text-xs ${activeCategory === cat.value ? 'opacity-80' : 'text-gray-400'}`}>
                {categoryCounts[cat.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          {ingredients.length === 0 ? (
            <>
              <p className="text-gray-400 dark:text-gray-500 mb-3">No ingredients yet. Add your first one!</p>
              <button onClick={openAdd} className="btn-primary">Add First Ingredient</button>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500">No ingredients match your search.</p>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-pink-50 dark:bg-pink-900/10 border-b border-pink-100 dark:border-pink-900/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Serving</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Protein</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Carbs</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fat</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 dark:divide-pink-900/10">
              {filtered.map(ing => (
                <tr key={ing.id} className="hover:bg-pink-50/50 dark:hover:bg-pink-900/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{ing.name}</td>
                  <td className="px-4 py-3">
                    {ing.category ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLOURS[ing.category] || 'bg-gray-100 text-gray-600'}`}>
                        {ing.category}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{ing.serving_size} {ing.serving_unit}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ing.calories_per_serving}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ing.protein_per_serving}g</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ing.carbs_per_serving}g</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ing.fat_per_serving}g</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(ing)} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">Edit</button>
                      <button onClick={() => handleDelete(ing.id)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <IngredientModal
          ingredient={editing}
          onSave={handleSaved}
          onClose={() => setModalOpen(false)}
          coachId={profile.id}
        />
      )}
    </div>
  )
}
