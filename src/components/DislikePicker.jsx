import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Answers that mean "I don't have any dislikes" rather than an actual disliked food — a client
// typing "No" (or "None", "N/A", etc.) into this field should never be saved as a real dislike,
// since it then gets substring-matched against every ingredient name and flags things like
// "Granola" (which contains "no") as a conflict for no reason.
const NON_ANSWERS = new Set([
  'no', 'none', 'nothing', 'n/a', 'na', 'nil', 'nope', 'not really', 'no thanks', 'no thank you',
  'nothing really', 'not that i know of', 'no dislikes', 'zero', 'nan', '-', '--', 'x',
])

function normalize(s) {
  return (s || '').trim().toLowerCase().replace(/[.!?]+$/, '')
}

function isNonAnswer(s) {
  const n = normalize(s)
  return !n || NON_ANSWERS.has(n)
}

/**
 * Multi-select "disliked foods" picker — searches the coach's real ingredient library first
 * (so existing substring-match conflict detection keeps finding it in meals), but also lets a
 * client type a dislike that isn't in the library at all, or that they'd just call something
 * different. The one thing it won't accept is a "no dislikes" answer typed into the box (see
 * NON_ANSWERS above) — those get silently ignored rather than saved as a food.
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
  const trimmedSearch = search.trim()
  const canAddCustom = trimmedSearch.length > 0 && !isNonAnswer(trimmedSearch)
    && !selected.some(s => s.toLowerCase() === trimmedSearch.toLowerCase())
    && !results.some(i => i.name.toLowerCase() === trimmedSearch.toLowerCase())

  function add(name) {
    if (isNonAnswer(name)) { setSearch(''); setOpen(false); return }
    if (selected.some(s => s.toLowerCase() === name.toLowerCase())) { setSearch(''); setOpen(false); return }
    onChange([...selected, name])
    setSearch('')
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (results.length > 0) add(results[0].name)
    else if (canAddCustom) add(trimmedSearch)
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
        onKeyDown={handleKeyDown}
        placeholder="Type or search a disliked food…"
      />
      {open && (results.length > 0 || canAddCustom) && (
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
          {canAddCustom && (
            <button
              type="button"
              onClick={() => add(trimmedSearch)}
              className="w-full text-left px-3 py-2 text-sm text-brand-600 dark:text-brand-400 hover:bg-amber-50 dark:hover:bg-amber-900/10"
            >
              Add "{trimmedSearch}" as a dislike
            </button>
          )}
        </div>
      )}
      {open && search.length >= 1 && results.length === 0 && !canAddCustom && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {isNonAnswer(search) ? "That doesn't look like a food — leave blank if there are no dislikes." : 'Already added'}
          </p>
        </div>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Pick from the ingredient library, or type your own and press Enter — any meal containing a selected ingredient will be flagged and can be auto-swapped.
      </p>
    </div>
  )
}
