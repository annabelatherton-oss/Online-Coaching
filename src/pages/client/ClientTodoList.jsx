import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function stripDay(name) {
  if (!name) return ''
  for (const d of DAY_NAMES) {
    if (name === d) return ''
    if (name.startsWith(d + ' ') || name.startsWith(d + '—') || name.startsWith(d + ' —')) {
      return name.slice(d.length).replace(/^[\s–—\-]+/, '').trim()
    }
  }
  return name
}

// Build the system task list from client data + that day's schedule
function buildSystemTasks(client, schedItems) {
  const tasks = []

  // Calories target
  if (client?.current_calories) {
    tasks.push({ key: 'calories', label: `Stay within ${client.current_calories.toLocaleString()} kcal` })
  }
  // Protein target
  if (client?.current_protein) {
    tasks.push({ key: 'protein', label: `Hit ${client.current_protein}g protein goal` })
  }
  // Fallback if no macros set
  if (!client?.current_calories && !client?.current_protein) {
    tasks.push({ key: 'macros', label: 'Hit your macros' })
  }

  const water = client?.water_target_litres ?? 2.5
  tasks.push({ key: 'water', label: `Drink ${water}L of water` })

  const steps = client?.steps_target ?? 10000
  tasks.push({ key: 'steps', label: `Hit ${Number(steps).toLocaleString()} steps` })

  const sleep = client?.sleep_target_hours ?? 8
  tasks.push({ key: 'sleep', label: `Get ${sleep} hours of sleep` })

  // Training — one task per workout/HIIT item scheduled that day
  const trainingItems = (schedItems || []).filter(i => i.item_type === 'workout' || i.item_type === 'hiit')
  trainingItems.forEach((item, idx) => {
    let name = ''
    if (item.item_type === 'workout') name = stripDay(item.workouts?.name) || item.custom_label || ''
    else name = item.hiit_circuits?.name || item.custom_label || 'HIIT'
    const label = name ? `Complete ${name} session` : 'Complete your training session'
    tasks.push({ key: idx === 0 ? 'training' : `training_${idx}`, label })
  })

  // Cardio — one task per cardio item
  const cardioItems = (schedItems || []).filter(i => i.item_type === 'cardio')
  cardioItems.forEach((item, idx) => {
    const name = item.custom_label || item.cardio_sessions?.name
    const label = `Complete ${name || 'your cardio'}${item.duration_minutes ? ` (${item.duration_minutes} min)` : ''}`
    tasks.push({ key: idx === 0 ? 'cardio' : `cardio_${idx}`, label, cardioItem: item.cardio_session_id ? item : null })
  })

  return tasks
}

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function CheckCircle({ checked, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        checked ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function UnlockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  )
}

export default function ClientTodoList() {
  const { session } = useAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [clientId, setClientId] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today))
  const [dbTasks, setDbTasks] = useState([])
  const [scheduleItems, setScheduleItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Notes panel
  const [expandedId, setExpandedId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  // Cardio detail card
  const [cardioDetailItem, setCardioDetailItem] = useState(null)
  const [cardioDetailData, setCardioDetailData] = useState(null)
  const [cardioDetailLoading, setCardioDetailLoading] = useState(false)

  async function openCardioDetail(item) {
    setCardioDetailItem(item)
    setCardioDetailLoading(true)
    const { data } = await supabase.from('cardio_sessions').select('*').eq('id', item.cardio_session_id).single()
    setCardioDetailData(data || null)
    setCardioDetailLoading(false)
  }

  function closeCardioDetail() {
    setCardioDetailItem(null)
    setCardioDetailData(null)
    setCardioDetailLoading(false)
  }

  // Add custom task
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  const [addSaving, setAddSaving] = useState(false)

  // Load client profile + targets once
  useEffect(() => {
    supabase.from('clients')
      .select('id, current_calories, current_protein, current_carbs, current_fat, steps_target, water_target_litres, sleep_target_hours')
      .eq('profile_id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) { setClientId(data.id); setClientData(data) }
      })
  }, [session.user.id])

  useEffect(() => {
    if (!clientId) return
    loadForDate()
  }, [clientId, selectedDate])

  async function loadForDate() {
    setLoading(true)
    const dateStr = toISO(selectedDate)
    const dayName = DAY_NAMES[selectedDate.getDay()]
    const [{ data: tasks }, { data: sched }] = await Promise.all([
      supabase.from('client_daily_tasks').select('*')
        .eq('client_id', clientId).eq('task_date', dateStr).order('created_at'),
      supabase.from('client_schedule_items')
        .select('id, item_type, workout_id, custom_label, hiit_circuit_id, cardio_session_id, duration_minutes, workouts(name), hiit_circuits(name), cardio_sessions(name)')
        .eq('client_id', clientId).eq('day_of_week', dayName),
    ])
    setDbTasks(tasks || [])
    setScheduleItems(sched || [])
    setLoading(false)
  }

  // --- Derived ---
  const systemTasks = buildSystemTasks(clientData, scheduleItems)
  const customTasks = dbTasks.filter(t => t.task_type === 'custom')

  const completedCount =
    systemTasks.filter(t => dbTasks.find(r => r.task_type === 'system' && r.task_key === t.key)?.completed).length +
    customTasks.filter(t => t.completed).length
  const totalTasks = systemTasks.length + customTasks.length

  function getSystemRow(key) {
    return dbTasks.find(t => t.task_type === 'system' && t.task_key === key)
  }

  // --- Toggle ---
  async function toggleSystem(key) {
    const row = getSystemRow(key)
    if (row) {
      const next = !row.completed
      setDbTasks(prev => prev.map(t => t.id === row.id ? { ...t, completed: next } : t))
      await supabase.from('client_daily_tasks').update({ completed: next }).eq('id', row.id)
    } else {
      const { data } = await supabase.from('client_daily_tasks').insert({
        client_id: clientId, task_date: toISO(selectedDate),
        task_type: 'system', task_key: key, completed: true, is_private: false,
      }).select().single()
      if (data) setDbTasks(prev => [...prev, data])
    }
  }

  async function toggleCustom(id) {
    const task = dbTasks.find(t => t.id === id)
    if (!task) return
    const next = !task.completed
    setDbTasks(prev => prev.map(t => t.id === id ? { ...t, completed: next } : t))
    await supabase.from('client_daily_tasks').update({ completed: next }).eq('id', id)
  }

  // --- Notes ---
  function openNotes(uid, currentNotes) {
    if (expandedId === uid) { setExpandedId(null); return }
    setExpandedId(uid)
    setNoteDraft(currentNotes || '')
  }

  async function saveSystemNotes(key) {
    const row = getSystemRow(key)
    if (row) {
      setDbTasks(prev => prev.map(t => t.id === row.id ? { ...t, notes: noteDraft } : t))
      await supabase.from('client_daily_tasks').update({ notes: noteDraft }).eq('id', row.id)
    } else {
      const { data } = await supabase.from('client_daily_tasks').insert({
        client_id: clientId, task_date: toISO(selectedDate),
        task_type: 'system', task_key: key, completed: false, notes: noteDraft, is_private: false,
      }).select().single()
      if (data) setDbTasks(prev => [...prev, data])
    }
    setExpandedId(null)
  }

  async function saveCustomNotes(id) {
    setDbTasks(prev => prev.map(t => t.id === id ? { ...t, notes: noteDraft } : t))
    await supabase.from('client_daily_tasks').update({ notes: noteDraft }).eq('id', id)
    setExpandedId(null)
  }

  // --- Add / Delete custom ---
  async function addTask() {
    if (!newLabel.trim()) return
    setAddSaving(true)
    const { data } = await supabase.from('client_daily_tasks').insert({
      client_id: clientId, task_date: toISO(selectedDate),
      task_type: 'custom', label: newLabel.trim(),
      completed: false, is_private: newPrivate,
    }).select().single()
    if (data) setDbTasks(prev => [...prev, data])
    setNewLabel(''); setNewPrivate(false); setAdding(false); setAddSaving(false)
  }

  async function deleteTask(id) {
    setDbTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('client_daily_tasks').delete().eq('id', id)
  }

  // --- Date navigation ---
  function selectDate(date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0)
    setSelectedDate(d); setExpandedId(null); setNoteDraft(''); setAdding(false)
  }

  function goToday() { selectDate(today); setWeekStart(getWeekStart(today)) }

  const isSelectedToday = toISO(selectedDate) === toISO(today)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const selectedLabel = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  // --- Task row ---
  function TaskRow({ uid, completed, label, notes, isPrivate, onToggle, onDelete, onLabelClick }) {
    const isExpanded = expandedId === uid
    const hasNote = !!notes
    const labelClasses = `flex-1 text-sm font-medium leading-snug text-left ${
      completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100'
    } ${onLabelClick ? 'underline decoration-dotted decoration-gray-300 dark:decoration-gray-600 underline-offset-2' : ''}`
    return (
      <div className={`rounded-xl border transition-colors ${
        completed
          ? 'border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40'
      }`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <CheckCircle checked={completed} onClick={onToggle} />
          {onLabelClick ? (
            <button type="button" onClick={onLabelClick} className={labelClasses}>{label}</button>
          ) : (
            <span className={labelClasses}>{label}</span>
          )}
          {isPrivate && (
            <span className="text-gray-300 dark:text-gray-600 flex-shrink-0" title="Private — only you can see this">
              <LockIcon />
            </span>
          )}
          {hasNote && !isExpanded && (
            <span className="hidden sm:block text-[10px] text-gray-400 dark:text-gray-600 italic truncate max-w-[120px]">{notes}</span>
          )}
          <button type="button" onClick={() => openNotes(uid, notes)}
            className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
              isExpanded || hasNote ? 'text-brand-500 dark:text-brand-400' : 'text-gray-300 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500'
            }`} title="Notes">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete}
              className="p-1 text-gray-300 hover:text-red-400 dark:text-gray-700 dark:hover:text-red-400 flex-shrink-0 transition-colors" title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {isExpanded && (
          <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <textarea className="input w-full text-sm resize-none" rows={3} autoFocus
              placeholder="How did it go? What changed? Any notes…"
              value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <button type="button" onClick={() => setExpandedId(null)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              <button type="button"
                onClick={() => uid.startsWith('sys:') ? saveSystemNotes(uid.slice(4)) : saveCustomNotes(uid)}
                className="btn-primary text-xs py-1.5 px-4">Save note</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Daily Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isSelectedToday ? 'Today — ' : ''}{selectedLabel}
          </p>
        </div>
        {!isSelectedToday && (
          <button onClick={goToday}
            className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium mt-1">
            Back to today
          </button>
        )}
      </div>

      {/* Week strip */}
      <div className="card p-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(w => addDays(w, -7))}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 grid grid-cols-7 gap-0.5">
            {weekDates.map((date, i) => {
              const isSel = toISO(date) === toISO(selectedDate)
              const isTod = toISO(date) === toISO(today)
              return (
                <button key={i} onClick={() => selectDate(date)}
                  className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                    isSel ? 'bg-brand-500 text-white'
                      : isTod ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                  <span className={`text-[9px] uppercase tracking-wide font-semibold ${isSel ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                    {SHORT_DAYS[date.getDay()]}
                  </span>
                  <span className="text-sm font-bold leading-tight mt-0.5">{date.getDate()}</span>
                  {isTod && !isSel && <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5" />}
                </button>
              )
            })}
          </div>
          <button onClick={() => setWeekStart(w => addDays(w, 7))}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner size="md" className="py-8" /> : (
        <div className="space-y-6">

          {/* Progress bar */}
          {totalTasks > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{completedCount} of {totalTasks} complete</span>
                {completedCount === totalTasks && totalTasks > 0 && (
                  <span className="text-green-600 dark:text-green-400 font-semibold">Day complete!</span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-green-400 dark:bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.round((completedCount / totalTasks) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Daily habits */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Daily habits</h2>
            {systemTasks.map(task => {
              const row = getSystemRow(task.key)
              return (
                <TaskRow key={task.key}
                  uid={`sys:${task.key}`}
                  completed={row?.completed || false}
                  label={task.label}
                  notes={row?.notes || ''}
                  isPrivate={false}
                  onToggle={() => toggleSystem(task.key)}
                  onLabelClick={task.cardioItem ? () => openCardioDetail(task.cardioItem) : undefined}
                />
              )
            })}
          </div>

          {/* Custom tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">My tasks</h2>
              {!adding && (
                <button onClick={() => setAdding(true)}
                  className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
                  + Add task
                </button>
              )}
            </div>

            {customTasks.map(task => (
              <TaskRow key={task.id}
                uid={task.id}
                completed={task.completed}
                label={task.label}
                notes={task.notes || ''}
                isPrivate={task.is_private}
                onToggle={() => toggleCustom(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}

            {customTasks.length === 0 && !adding && (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-2">No tasks added for this day yet.</p>
            )}

            {adding && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 px-4 py-3 space-y-3">
                <input autoFocus className="input w-full text-sm"
                  placeholder="What do you need to do?"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newLabel.trim()) addTask()
                    if (e.key === 'Escape') { setAdding(false); setNewLabel(''); setNewPrivate(false) }
                  }}
                />
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setNewPrivate(v => !v)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      newPrivate ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                    }`}>
                    {newPrivate ? <LockIcon /> : <UnlockIcon />}
                    {newPrivate ? 'Private — only you can see this' : 'Make private'}
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button type="button"
                      onClick={() => { setAdding(false); setNewLabel(''); setNewPrivate(false) }}
                      className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                    <button type="button" onClick={addTask}
                      disabled={!newLabel.trim() || addSaving}
                      className="btn-primary text-xs py-1.5 px-3">Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cardioDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeCardioDetail} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {cardioDetailItem.custom_label || cardioDetailData?.name || 'Cardio'}
              </h2>
              <button onClick={closeCardioDetail} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">×</button>
            </div>

            {cardioDetailLoading ? (
              <div className="p-6"><LoadingSpinner size="md" /></div>
            ) : !cardioDetailData ? (
              <p className="p-5 text-sm text-gray-400">No extra details for this session yet.</p>
            ) : (
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {cardioDetailItem.duration_minutes && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      {cardioDetailItem.duration_minutes} min
                    </span>
                  )}
                  {cardioDetailData.intensity && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">
                      {cardioDetailData.intensity}
                    </span>
                  )}
                  {cardioDetailData.heart_rate_zone && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {cardioDetailData.heart_rate_zone}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                  {cardioDetailData.distance_km && <span>{cardioDetailData.distance_km} km</span>}
                  {cardioDetailData.pace && <span>{cardioDetailData.pace}</span>}
                  {cardioDetailData.incline && <span>{cardioDetailData.incline}% incline</span>}
                  {cardioDetailData.speed && <span>{cardioDetailData.speed} km/h</span>}
                </div>

                {cardioDetailData.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">How to do it</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{cardioDetailData.notes}</p>
                  </div>
                )}
                {cardioDetailData.progression && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Progression</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{cardioDetailData.progression}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
