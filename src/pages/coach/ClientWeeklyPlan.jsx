import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function parseProgram(name) {
  const m = (name || '').match(/^(\d+)\s*Day\s*[–—\-]\s*Block\s*(\d+)/i)
  if (m) return { days: parseInt(m[1]), block: parseInt(m[2]) }
  return null
}

function TrashIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function ClientWeeklyPlan({ clientId, coachId }) {
  const [items, setItems] = useState([])
  const [programs, setPrograms] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [hiitCircuits, setHiitCircuits] = useState([])
  const [cardioSessions, setCardioSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // Add workout/hiit per day
  const [addingToDay, setAddingToDay] = useState(null)
  const [addType, setAddType] = useState('workout')
  const [addItemId, setAddItemId] = useState('')

  // Add cardio
  const [addingCardio, setAddingCardio] = useState(false)
  const [addCardioDay, setAddCardioDay] = useState('Monday')
  const [addCardioId, setAddCardioId] = useState('')

  // Populate from block
  const [showPopulate, setShowPopulate] = useState(false)
  const [populateBlock, setPopulateBlock] = useState('')
  const [populateDays, setPopulateDays] = useState('')
  const [populating, setPopulating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [
      { data: schedItems },
      { data: progs },
      { data: wkts },
      { data: hiits },
      { data: cardios },
    ] = await Promise.all([
      supabase
        .from('client_schedule_items')
        .select('*, workouts(id, name), hiit_circuits(id, name), cardio_sessions(id, name, cardio_type, duration_minutes)')
        .eq('client_id', clientId)
        .order('order_index'),
      supabase
        .from('training_programs')
        .select('id, name, training_sessions(id, name, workout_id, workouts(id, name))')
        .eq('coach_id', coachId)
        .order('name'),
      supabase.from('workouts').select('id, name').eq('coach_id', coachId).eq('is_archived', false).order('name'),
      supabase.from('hiit_circuits').select('id, name, circuit_type').eq('coach_id', coachId).eq('is_archived', false).order('name'),
      supabase.from('cardio_sessions').select('id, name, cardio_type, duration_minutes').eq('coach_id', coachId).eq('is_archived', false).order('name'),
    ])
    setItems(schedItems || [])
    setPrograms(progs || [])
    setWorkouts(wkts || [])
    setHiitCircuits(hiits || [])
    setCardioSessions(cardios || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function addItem(day, type, entityId) {
    setSaving(true)
    const existingOnDay = items.filter(i => i.day_of_week === day && i.item_type === type)
    const record = {
      client_id: clientId,
      coach_id: coachId,
      day_of_week: day,
      item_type: type,
      order_index: existingOnDay.length,
    }
    if (type === 'workout') record.workout_id = entityId
    if (type === 'hiit') record.hiit_circuit_id = entityId
    if (type === 'cardio') record.cardio_session_id = entityId
    await supabase.from('client_schedule_items').insert(record)
    setSaving(false)
    await load()
  }

  async function removeItem(id) {
    await supabase.from('client_schedule_items').delete().eq('id', id)
    await load()
  }

  async function populateFromBlock() {
    if (!populateBlock || !populateDays) return
    setPopulating(true)

    const prog = programs.find(p => {
      const parsed = parseProgram(p.name)
      return parsed && parsed.block === parseInt(populateBlock) && parsed.days === parseInt(populateDays)
    })

    if (prog) {
      // Remove existing workout + hiit items; keep cardio
      await supabase.from('client_schedule_items')
        .delete()
        .eq('client_id', clientId)
        .in('item_type', ['workout', 'hiit'])

      // Deduplicate sessions by day (first workout_id wins per day)
      const seenDays = new Set()
      const toInsert = []
      for (const s of (prog.training_sessions || [])) {
        if (DAYS.includes(s.name) && !seenDays.has(s.name)) {
          seenDays.add(s.name)
          toInsert.push({
            client_id: clientId,
            coach_id: coachId,
            day_of_week: s.name,
            item_type: 'workout',
            workout_id: s.workout_id || null,
            custom_label: s.workouts?.name || s.name,
            order_index: 0,
          })
        }
      }
      if (toInsert.length > 0) {
        await supabase.from('client_schedule_items').insert(toInsert)
      }
    }

    setPopulating(false)
    setShowPopulate(false)
    setPopulateBlock('')
    setPopulateDays('')
    await load()
  }

  if (loading) return <LoadingSpinner size="md" className="py-8" />

  const scheduleItems = items.filter(i => i.item_type !== 'cardio')
  const cardioItems = items.filter(i => i.item_type === 'cardio')

  const blockNums = [...new Set(
    programs.map(p => parseProgram(p.name)?.block).filter(Boolean)
  )].sort()

  const blockDayOptions = populateBlock
    ? [...new Set(
        programs
          .filter(p => parseProgram(p.name)?.block === parseInt(populateBlock))
          .map(p => parseProgram(p.name)?.days)
          .filter(Boolean)
      )].sort((a, b) => b - a)
    : []

  return (
    <div className="space-y-8 pt-2">

      {/* ── Weekly Training Schedule ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Training Schedule</h3>
          <button
            onClick={() => { setShowPopulate(v => !v); setPopulateBlock(''); setPopulateDays('') }}
            className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
          >
            {showPopulate ? 'Cancel' : 'Populate from block'}
          </button>
        </div>

        {showPopulate && (
          <div className="card mb-4 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Auto-fill this client's weekly schedule from a training block. Existing workout and HIIT entries will be replaced; cardio stays.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label text-xs">Block</label>
                <select
                  className="input"
                  value={populateBlock}
                  onChange={e => { setPopulateBlock(e.target.value); setPopulateDays('') }}
                >
                  <option value="">Select block…</option>
                  {blockNums.map(n => <option key={n} value={n}>Block {n}</option>)}
                </select>
              </div>
              {populateBlock && blockDayOptions.length > 0 && (
                <div>
                  <label className="label text-xs">Day variant</label>
                  <select
                    className="input"
                    value={populateDays}
                    onChange={e => setPopulateDays(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {blockDayOptions.map(d => <option key={d} value={d}>{d} Day</option>)}
                  </select>
                </div>
              )}
              <button
                onClick={populateFromBlock}
                disabled={!populateBlock || !populateDays || populating}
                className="btn-primary"
              >
                {populating ? 'Populating…' : 'Populate schedule'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[560px]">
            {DAYS.map(day => {
              const dayItems = scheduleItems.filter(i => i.day_of_week === day)
              const isAdding = addingToDay === day
              return (
                <div key={day} className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center pb-1.5 border-b border-gray-100 dark:border-gray-800">
                    {day.slice(0, 3)}
                  </p>

                  {dayItems.map(item => (
                    <div
                      key={item.id}
                      className={`group relative rounded-lg px-2 py-1.5 text-xs leading-tight ${
                        item.item_type === 'hiit'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40'
                          : 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40'
                      }`}
                    >
                      <p className={`font-semibold pr-4 leading-snug ${
                        item.item_type === 'hiit'
                          ? 'text-orange-700 dark:text-orange-300'
                          : 'text-brand-700 dark:text-brand-300'
                      }`}>
                        {item.item_type === 'workout'
                          ? (item.workouts?.name || item.custom_label || 'Workout')
                          : (item.hiit_circuits?.name || 'HIIT')}
                      </p>
                      {item.item_type === 'hiit' && (
                        <p className="text-[10px] text-orange-400 dark:text-orange-500 mt-0.5">HIIT</p>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-opacity p-0.5"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}

                  {isAdding ? (
                    <div className="space-y-1.5 pt-0.5">
                      <select
                        className="input text-xs py-1 px-2 w-full"
                        value={addType}
                        onChange={e => { setAddType(e.target.value); setAddItemId('') }}
                      >
                        <option value="workout">Workout</option>
                        <option value="hiit">HIIT</option>
                      </select>
                      <select
                        className="input text-xs py-1 px-2 w-full"
                        value={addItemId}
                        onChange={e => setAddItemId(e.target.value)}
                      >
                        <option value="">Select…</option>
                        {addType === 'workout'
                          ? workouts.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                          : hiitCircuits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)
                        }
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={async () => {
                            if (!addItemId) return
                            await addItem(day, addType, addItemId)
                            setAddingToDay(null)
                            setAddItemId('')
                          }}
                          disabled={!addItemId || saving}
                          className="btn-primary flex-1 py-1 text-xs"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setAddingToDay(null); setAddItemId('') }}
                          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingToDay(day); setAddType('workout'); setAddItemId('') }}
                      className="text-[11px] text-gray-300 hover:text-brand-500 dark:text-gray-600 dark:hover:text-brand-400 font-medium text-center py-0.5 transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Cardio Plan ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Cardio Plan</h3>
          {!addingCardio && (
            <button
              onClick={() => { setAddingCardio(true); setAddCardioId(''); setAddCardioDay('Monday') }}
              className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
            >
              + Add cardio
            </button>
          )}
        </div>

        {addingCardio && (
          <div className="card mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label">Day</label>
                <select className="input" value={addCardioDay} onChange={e => setAddCardioDay(e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="label">Cardio session</label>
                <select className="input" value={addCardioId} onChange={e => setAddCardioId(e.target.value)}>
                  <option value="">Select cardio…</option>
                  {cardioSessions.length === 0
                    ? <option disabled>No cardio sessions in library yet</option>
                    : cardioSessions.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.duration_minutes ? ` — ${c.duration_minutes} min` : ''}
                        </option>
                      ))
                  }
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!addCardioId) return
                    await addItem(addCardioDay, 'cardio', addCardioId)
                    setAddingCardio(false)
                    setAddCardioId('')
                  }}
                  disabled={!addCardioId || saving}
                  className="btn-primary"
                >
                  Add
                </button>
                <button onClick={() => setAddingCardio(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {cardioItems.length === 0 && !addingCardio && (
          <p className="text-sm text-gray-400 dark:text-gray-500">No cardio scheduled yet.</p>
        )}

        {cardioItems.length > 0 && (
          <div className="space-y-1.5">
            {DAYS.flatMap(day => {
              const dayCardio = cardioItems.filter(i => i.day_of_week === day)
              return dayCardio.map(item => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-emerald-400 dark:text-emerald-500 uppercase w-8 flex-shrink-0">
                      {day.slice(0, 3)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {item.cardio_sessions?.name || 'Cardio'}
                      </p>
                      {item.cardio_sessions?.duration_minutes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {item.cardio_sessions.duration_minutes} min
                          {item.cardio_sessions.cardio_type ? ` · ${item.cardio_sessions.cardio_type.replace(/-/g, ' ')}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-opacity p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            })}
          </div>
        )}
      </div>
    </div>
  )
}
