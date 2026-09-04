import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Multi-select "disliked foods" picker sourced from the coach's real ingredient
 * library, replacing a free-text box. Still writes plain ingredient-name
 * strings into clients.dislikes so all existing substring-match conflict
 * detection keeps working unchanged.
 */
export default function DislikePicker({ coachId, value, onChange }) {
  const [ingredients, setIngredients] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!coachId) return
    supabase.from('ingredients').select('id, name').eq('coach_id', coachId).order('name')
      .then(({ data }) => setIngredients(data || []))
  }, [coachId])

  const selected = value || []
  const results = search.length >= 1
    ? ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && !selected.includes(i.name)).slice(0, 8)
    : []

  function add(name) {
    onChange([...selected, name])
    setSearch('')
    setOpen(false)
  }

  function remove(name) {
    onChange(selected.filter(n => n !== name))
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-1.5 empty:mb-0">
        {selected.map(name => (
          <span key={name} className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 pl-2 pr-1 py-0.5 rounded-full">
            {name}
            <button type="button" onClick={() => remove(name)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/50">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search the ingredient library…"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          {results.map(i => (
            <button
              key={i.id}
              type="button"
              onClick={() => add(i.name)}
              className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/10 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              {i.name}
            </button>
          ))}
        </div>
      )}
      {open && search.length >= 1 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">No matching ingredient in the library</p>
        </div>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Select from the ingredient library — any meal containing a selected ingredient will be flagged and can be auto-swapped.
      </p>
    </div>
  )
}
