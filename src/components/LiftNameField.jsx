import { useState } from 'react'

const NEW_LIFT = '__new__'

// Picks a lift from the ones already tracked for this client (so a manually backfilled entry
// actually links to the SAME lift as its check-in history and Strength Progress chart, rather than
// free text that could silently fork into a second, disconnected entry over a typo or a different
// capitalization). "+ New lift…" is the escape hatch for a lift that's genuinely never been logged
// for this client before.
export default function LiftNameField({ value, onChange, knownLiftNames = [], className = '' }) {
  const options = Array.from(new Set([...(knownLiftNames || []), value].filter(Boolean))).sort()
  const [addingNew, setAddingNew] = useState(options.length === 0 || (!!value && !options.includes(value)))

  if (addingNew) {
    return (
      <div className="flex gap-2 items-center">
        <input
          className={`input flex-1 ${className}`} required autoFocus
          value={value} onChange={e => onChange(e.target.value)} placeholder="e.g. Back Squat"
        />
        {options.length > 0 && (
          <button type="button" onClick={() => { setAddingNew(false); onChange('') }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap flex-shrink-0">
            Choose existing
          </button>
        )}
      </div>
    )
  }

  function handleSelect(e) {
    if (e.target.value === NEW_LIFT) { setAddingNew(true); onChange('') }
    else onChange(e.target.value)
  }

  return (
    <select className={`input ${className}`} required value={value} onChange={handleSelect}>
      <option value="">Select lift…</option>
      {options.map(name => <option key={name} value={name}>{name}</option>)}
      <option value={NEW_LIFT}>+ New lift…</option>
    </select>
  )
}
