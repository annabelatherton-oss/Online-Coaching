import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'
import { MACRO_SPLIT, calcMacrosFromSplit, splitPercentFromGrams } from '../../lib/macros'
import { ALLERGENS, ALLERGEN_LABELS } from '../../lib/allergens'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import ClientWeeklyPlan from './ClientWeeklyPlan'

const TABS = ['Overview', 'Meal Plan', 'Training', 'Daily Plan', 'Check-ins', 'Weight', 'Measurements', 'Photos', 'Notes']

// ── Helpers shared by DailyPlanTab ───────────────────────────────────────────
const _PLAN_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const _PLAN_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function _planISO(date) {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}
function _planWeekStart(date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  const day = d.getDay(); d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); return d
}
function _planAddDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d }
function _planStripDay(name) {
  if (!name) return ''
  for (const d of _PLAN_DAYS) {
    if (name === d) return ''
    if (name.startsWith(d + ' ') || name.startsWith(d + '—') || name.startsWith(d + ' —'))
      return name.slice(d.length).replace(/^[\s–—\-]+/,'').trim()
  }
  return name
}
function _buildCoachSystemTasks(client, schedItems) {
  const tasks = []
  if (client?.current_calories) tasks.push({ key:'calories', label:`Stay within ${client.current_calories.toLocaleString()} kcal` })
  if (client?.current_protein)  tasks.push({ key:'protein',  label:`Hit ${client.current_protein}g protein goal` })
  if (!client?.current_calories && !client?.current_protein) tasks.push({ key:'macros', label:'Hit your macros' })
  tasks.push({ key:'water', label:`Drink ${client?.water_target_litres ?? 2.5}L of water` })
  tasks.push({ key:'steps', label:`Hit ${Number(client?.steps_target ?? 10000).toLocaleString()} steps` })
  tasks.push({ key:'sleep', label:`Get ${client?.sleep_target_hours ?? 8} hours of sleep` })
  ;(schedItems || []).filter(i => i.item_type === 'workout' || i.item_type === 'hiit').forEach((item, idx) => {
    const name = item.item_type === 'workout'
      ? (_planStripDay(item.workouts?.name) || item.custom_label || '')
      : (item.hiit_circuits?.name || item.custom_label || 'HIIT')
    tasks.push({ key: idx === 0 ? 'training' : `training_${idx}`, label: name ? `Complete ${name} session` : 'Complete your training session' })
  })
  ;(schedItems || []).filter(i => i.item_type === 'cardio').forEach((item, idx) => {
    const label = item.custom_label ? `Complete ${item.custom_label}` : item.cardio_sessions?.name ? `Complete ${item.cardio_sessions.name}` : 'Complete your cardio'
    tasks.push({ key: idx === 0 ? 'cardio' : `cardio_${idx}`, label })
  })
  return tasks
}

// Compute the Monday of the week containing a given date
function _weekStartFor(dateStr) {
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  const day = d.getDay(); d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return _planISO(d)
}
function _weekEndFor(weekStartISO) {
  const d = new Date(weekStartISO + 'T00:00:00'); d.setDate(d.getDate() + 6)
  return _planISO(d)
}

// ── DailyPlanTab ─────────────────────────────────────────────────────────────
function DailyPlanTab({ client }) {
  const todayD = new Date(); todayD.setHours(0,0,0,0)
  const [selectedDate, setSelectedDate] = useState(todayD)
  const [weekStart, setWeekStart] = useState(() => _planWeekStart(todayD))
  const [tasks, setTasks] = useState([])
  const [schedItems, setSchedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadForDate() }, [selectedDate])

  async function loadForDate() {
    setLoading(true)
    const dateStr = _planISO(selectedDate)
    const dayName = _PLAN_DAYS[selectedDate.getDay()]
    const [{ data: taskData }, { data: sched }] = await Promise.all([
      supabase.rpc('get_client_tasks_for_coach', { p_client_id: client.id, p_task_date: dateStr }),
      supabase.from('client_schedule_items')
        .select('id, item_type, custom_label, workouts(name), hiit_circuits(name), cardio_sessions(name)')
        .eq('client_id', client.id).eq('day_of_week', dayName),
    ])
    setTasks(taskData || [])
    setSchedItems(sched || [])
    setLoading(false)
  }

  const systemTasks = _buildCoachSystemTasks(client, schedItems)
  const customRows  = (tasks || []).filter(t => t.task_type === 'custom')
  const systemRows  = (tasks || []).filter(t => t.task_type === 'system')

  const completedSystem = systemTasks.filter(t => systemRows.find(r => r.task_key === t.key)?.completed).length
  const completedCustom = customRows.filter(t => t.completed).length
  const totalCompleted  = completedSystem + completedCustom
  const totalTasks      = systemTasks.length + customRows.length

  const isSelectedToday = _planISO(selectedDate) === _planISO(todayD)
  const weekDates = Array.from({ length:7 }, (_, i) => _planAddDays(weekStart, i))
  const selectedLabel = selectedDate.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })

  function selectDate(date) {
    const d = new Date(date); d.setHours(0,0,0,0); setSelectedDate(d)
  }

  function TaskRow({ uid, completed, label, isPrivate, notes, isSystem }) {
    return (
      <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
        completed ? 'border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40'
      }`}>
        {/* Completion dot */}
        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          completed ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
        }`}>
          {completed && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isPrivate ? (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span className="text-sm text-gray-400 dark:text-gray-600 italic select-none" style={{ filter:'blur(3px)' }}>
                Private task
              </span>
            </div>
          ) : (
            <>
              <p className={`text-sm font-medium leading-snug ${completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100'}`}>
                {label}
              </p>
              {notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic leading-relaxed">"{notes}"</p>
              )}
            </>
          )}
        </div>
        {!isSystem && !isPrivate && (
          <span className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wide flex-shrink-0 mt-0.5">custom</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSelectedToday ? 'Today — ' : ''}{selectedLabel}
          </p>
        </div>
        {!isSelectedToday && (
          <button onClick={() => { selectDate(todayD); setWeekStart(_planWeekStart(todayD)) }}
            className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
            Today
          </button>
        )}
      </div>

      {/* Week strip */}
      <div className="card p-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(w => _planAddDays(w,-7))}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex-1 grid grid-cols-7 gap-0.5">
            {weekDates.map((date, i) => {
              const isSel = _planISO(date) === _planISO(selectedDate)
              const isTod = _planISO(date) === _planISO(todayD)
              return (
                <button key={i} onClick={() => selectDate(date)}
                  className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                    isSel ? 'bg-brand-500 text-white'
                      : isTod ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                  <span className={`text-[9px] uppercase tracking-wide font-semibold ${isSel ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                    {_PLAN_SHORT[date.getDay()]}
                  </span>
                  <span className="text-sm font-bold leading-tight mt-0.5">{date.getDate()}</span>
                  {isTod && !isSel && <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5"/>}
                </button>
              )
            })}
          </div>
          <button onClick={() => setWeekStart(w => _planAddDays(w,7))}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner size="md" className="py-8"/> : (
        <div className="space-y-6">
          {/* Progress bar */}
          {totalTasks > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{totalCompleted} of {totalTasks} complete</span>
                {totalCompleted === totalTasks && totalTasks > 0 && <span className="text-green-600 dark:text-green-400 font-semibold">All done!</span>}
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-green-400 dark:bg-green-500 transition-all duration-500"
                  style={{ width:`${totalTasks > 0 ? Math.round((totalCompleted/totalTasks)*100) : 0}%` }}/>
              </div>
            </div>
          )}

          {/* Daily habits */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Daily habits</h2>
            {systemTasks.map(task => {
              const row = systemRows.find(r => r.task_key === task.key)
              return <TaskRow key={task.key} uid={task.key} completed={row?.completed||false} label={task.label} notes={row?.notes||''} isPrivate={false} isSystem/>
            })}
          </div>

          {/* Custom + private tasks */}
          {customRows.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Client's tasks</h2>
              {customRows.map(task => (
                <TaskRow key={task.id} uid={task.id} completed={task.completed} label={task.label} notes={task.notes||''} isPrivate={task.is_private} isSystem={false}/>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-6">No tasks recorded for this day yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

const CHECKIN_RATING_LABELS = {
  energy_level:     ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'],
  sleep_quality:    ['', 'Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
  food_adherence:   ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
  gym_adherence:    ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
}

function checkinRatingColor(v) {
  if (!v) return 'text-gray-400'
  if (v >= 4) return 'text-green-600 dark:text-green-400'
  if (v >= 3) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function _fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ClientPauseCard({ clientId }) {
  const [pause, setPause] = useState(null)
  const [acting, setActing] = useState(false)

  async function load() {
    const { data } = await supabase.from('plan_pauses').select('*')
      .eq('client_id', clientId).in('status', ['pending', 'approved'])
      .order('status') // 'approved' < 'pending' alphabetically — pending first
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setPause(data)
  }

  useEffect(() => { load() }, [clientId])

  async function act(newStatus) {
    setActing(true)
    await supabase.from('plan_pauses').update({ status: newStatus }).eq('id', pause.id)
    await load()
    setActing(false)
  }

  if (!pause) return null

  const isPending = pause.status === 'pending'

  return (
    <div className={`card space-y-3 ${isPending
      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10'
      : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10'}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">🌴</span>
        <h3 className={`font-semibold ${isPending ? 'text-blue-900 dark:text-blue-200' : 'text-amber-900 dark:text-amber-200'}`}>
          {isPending ? 'Holiday Pause Requested' : 'Holiday Pause Active'}
        </h3>
        <span className={`text-xs ml-auto ${isPending ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
          Submitted {_fmtDate(pause.created_at.split('T')[0])}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        {pause.pause_start_date && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pause starts</p>
            <p className="font-medium text-gray-900 dark:text-white">{_fmtDate(pause.pause_start_date)}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Return date</p>
          <p className="font-medium text-gray-900 dark:text-white">{_fmtDate(pause.return_date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">First check-in</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {pause.weeks_paused > 0 ? _fmtDate(pause.first_checkin_date) : 'Same week'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Weeks paused</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {pause.weeks_paused > 0 ? pause.weeks_paused : 'Short break'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {isPending ? (
          <>
            <button type="button" onClick={() => act('approved')} disabled={acting} className="btn-primary py-1.5 px-3 text-xs">
              Approve
            </button>
            <button type="button" onClick={() => act('rejected')} disabled={acting} className="btn-secondary py-1.5 px-3 text-xs">
              Decline
            </button>
          </>
        ) : (
          <button type="button" onClick={() => act('completed')} disabled={acting} className="btn-secondary py-1.5 px-3 text-xs">
            Mark completed
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ client }) {
  const now = new Date()
  const exp = client.access_expires_at ? new Date(client.access_expires_at) : null
  const expired = exp && exp < now
  if (client.is_paused)
    return <span className="badge bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Paused</span>
  if (expired)
    return <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Expired</span>
  if (client.is_active)
    return <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
  return <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Inactive</span>
}

function OverviewTab({ client, onSaved }) {
  const [form, setForm] = useState({
    goal: client.goal || '',
    current_calories: client.current_calories || '',
    current_protein: client.current_protein || '',
    current_carbs: client.current_carbs || '',
    current_fat: client.current_fat || '',
    steps_target: client.steps_target ?? 10000,
    water_target_litres: client.water_target_litres ?? 2.5,
    sleep_target_hours: client.sleep_target_hours ?? 8,
    start_date: client.start_date ? client.start_date.split('T')[0] : '',
    access_weeks: client.access_weeks || 12,
    is_paused: client.is_paused || false,
    collect_measurements: client.collect_measurements || false,
    allergies: client.allergies || [],
    dislikes: (client.dislikes || []).join(', '),
    // Personal info
    phone: client.phone || '',
    date_of_birth: client.date_of_birth || '',
    height_cm: client.height_cm || '',
    // Intake form answers
    intake_motivators: client.intake_form?.motivators || '',
    intake_barriers: client.intake_form?.barriers || '',
    intake_health_history: client.intake_form?.health_history || '',
    intake_plan_interest: client.intake_form?.plan_interest || '',
    intake_current_diet: client.intake_form?.current_diet || '',
    intake_current_training: client.intake_form?.current_training || '',
    intake_cardio_preferences: client.intake_form?.cardio_preferences || '',
    intake_food_preferences: client.intake_form?.food_preferences || '',
    intake_meal_preference: client.intake_form?.meal_preference || '',
    intake_other_info: client.intake_form?.other_info || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  // The carbs/protein/fat split (% of calories) driving the gram fields below.
  const [split, setSplit] = useState(splitPercentFromGrams(
    { protein_g: client.current_protein, carbs_g: client.current_carbs, fat_g: client.current_fat },
    client.current_calories
  ))

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function applySplit(calories, splitPct) {
    const grams = calcMacrosFromSplit(calories, splitPct)
    setForm(f => ({
      ...f,
      current_calories: calories,
      current_protein: calories ? String(grams.protein_g) : '',
      current_carbs: calories ? String(grams.carbs_g) : '',
      current_fat: calories ? String(grams.fat_g) : '',
    }))
  }

  function setCalories(value) {
    applySplit(value, split)
  }

  function setSplitPct(field, value) {
    const pct = value === '' ? '' : Number(value)
    const nextSplit = { ...split, [field]: pct }
    setSplit(nextSplit)
    applySplit(form.current_calories, { carbs: nextSplit.carbs || 0, protein: nextSplit.protein || 0, fat: nextSplit.fat || 0 })
  }

  function resetToStandardSplit() {
    setSplit({ ...MACRO_SPLIT })
    applySplit(form.current_calories, MACRO_SPLIT)
  }

  const splitTotal = (Number(split.carbs) || 0) + (Number(split.protein) || 0) + (Number(split.fat) || 0)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const { error: err } = await supabase.from('clients').update({
      goal: form.goal,
      current_calories: form.current_calories ? parseInt(form.current_calories) : null,
      current_protein: form.current_protein ? parseInt(form.current_protein) : null,
      current_carbs: form.current_carbs ? parseInt(form.current_carbs) : null,
      current_fat: form.current_fat ? parseInt(form.current_fat) : null,
      steps_target: form.steps_target !== '' ? parseInt(form.steps_target) : 10000,
      water_target_litres: form.water_target_litres !== '' ? parseFloat(form.water_target_litres) : 2.5,
      sleep_target_hours: form.sleep_target_hours !== '' ? parseFloat(form.sleep_target_hours) : 8,
      start_date: form.start_date,
      access_weeks: parseInt(form.access_weeks),
      is_paused: form.is_paused,
      collect_measurements: form.collect_measurements,
      allergies: form.allergies,
      dislikes: form.dislikes ? form.dislikes.split(',').map(s => s.trim()).filter(Boolean) : [],
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      intake_form: {
        motivators: form.intake_motivators || null,
        barriers: form.intake_barriers || null,
        health_history: form.intake_health_history || null,
        plan_interest: form.intake_plan_interest || null,
        current_diet: form.intake_current_diet || null,
        current_training: form.intake_current_training || null,
        cardio_preferences: form.intake_cardio_preferences || null,
        food_preferences: form.intake_food_preferences || null,
        meal_preference: form.intake_meal_preference || null,
        other_info: form.intake_other_info || null,
      },
    }).eq('id', client.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    onSaved()
  }

  const expiry = client.access_expires_at
    ? new Date(client.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-6 max-w-2xl">
    <ClientPauseCard clientId={client.id} />
    <form onSubmit={handleSave} className="space-y-6">

      {/* Personal Info — from intake form */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone number</label>
            <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 07700 900 000" />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input className="input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Height (cm)</label>
            <input className="input" type="number" step="0.1" min="0" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="e.g. 165" />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Programme Details</h3>
        <div>
          <label className="label">Goal</label>
          <textarea className="input resize-none" rows={3} value={form.goal} onChange={e => set('goal', e.target.value)} placeholder="e.g. Lose 10kg, build lean muscle" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start date</label>
            <input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Access (weeks)</label>
            <div className="flex gap-2 items-center">
              <input className="input" type="number" min={1} max={520} value={form.access_weeks} onChange={e => set('access_weeks', e.target.value)} />
              <button
                type="button"
                className="btn-secondary whitespace-nowrap text-sm py-2 px-3"
                onClick={() => set('access_weeks', String(parseInt(form.access_weeks || 0) + 12))}
              >
                + 12 weeks
              </button>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Access expires: <span className="font-medium text-gray-700 dark:text-gray-200">{expiry}</span>
        </div>
        <div className="flex items-center gap-2">
          <input id="is_paused" type="checkbox" checked={form.is_paused} onChange={e => set('is_paused', e.target.checked)} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
          <label htmlFor="is_paused" className="text-sm text-gray-700 dark:text-gray-300">Pause client access</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="collect_measurements" type="checkbox" checked={form.collect_measurements} onChange={e => set('collect_measurements', e.target.checked)} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
          <label htmlFor="collect_measurements" className="text-sm text-gray-700 dark:text-gray-300">Collect measurements in check-ins (waist, hips)</label>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Current Nutrition Targets</h3>
          <button
            type="button"
            onClick={resetToStandardSplit}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            Use standard split (40/35/25)
          </button>
        </div>
        <div>
          <label className="label">Calories (kcal/day)</label>
          <input className="input" type="number" min={0} value={form.current_calories} onChange={e => setCalories(e.target.value)} placeholder="e.g. 1800" />
        </div>
        <div>
          <label className="label !mb-0">Macro split (% of calories)</label>
          <div className="grid grid-cols-3 gap-4 mt-1">
            <div>
              <label className="label">Carbs %</label>
              <input className="input" type="number" min={0} max={100} value={split.carbs} onChange={e => setSplitPct('carbs', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.current_carbs || 0}g</p>
            </div>
            <div>
              <label className="label">Protein %</label>
              <input className="input" type="number" min={0} max={100} value={split.protein} onChange={e => setSplitPct('protein', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.current_protein || 0}g</p>
            </div>
            <div>
              <label className="label">Fat %</label>
              <input className="input" type="number" min={0} max={100} value={split.fat} onChange={e => setSplitPct('fat', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.current_fat || 0}g</p>
            </div>
          </div>
          {splitTotal !== 100 && (
            <p className="text-xs text-amber-500 mt-2">Split totals {splitTotal}% — adjust so the three add up to 100%.</p>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Daily Habit Targets</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Only habits you fill in here appear on the client's Daily Plan. Leave blank to exclude.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Steps goal</label>
            <input className="input" type="number" min={0} step={500} value={form.steps_target}
              onChange={e => set('steps_target', e.target.value)} placeholder="e.g. 10000" />
            <p className="text-xs text-gray-400 mt-1">steps/day</p>
          </div>
          <div>
            <label className="label">Water goal</label>
            <input className="input" type="number" min={0} step={0.5} value={form.water_target_litres}
              onChange={e => set('water_target_litres', e.target.value)} placeholder="e.g. 2.5" />
            <p className="text-xs text-gray-400 mt-1">litres/day</p>
          </div>
          <div>
            <label className="label">Sleep goal</label>
            <input className="input" type="number" min={0} step={0.5} value={form.sleep_target_hours}
              onChange={e => set('sleep_target_hours', e.target.value)} placeholder="e.g. 8" />
            <p className="text-xs text-gray-400 mt-1">hours/night</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Food Restrictions</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Meals containing these ingredients will be flagged on the plan and can be auto-swapped.
          </p>
        </div>
        <div>
          <label className="label">Allergies</label>
          <div className="grid grid-cols-3 gap-y-2 gap-x-4">
            {ALLERGENS.map(a => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allergies.includes(a)}
                  onChange={e => set('allergies', e.target.checked
                    ? [...form.allergies, a]
                    : form.allergies.filter(x => x !== a)
                  )}
                  className="w-4 h-4 rounded accent-red-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{ALLERGEN_LABELS[a]}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Dislikes / Intolerances</label>
          <input
            className="input"
            type="text"
            value={form.dislikes}
            onChange={e => set('dislikes', e.target.value)}
            placeholder="e.g. mushrooms, olives, broccoli (comma-separated)"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Partial ingredient name match — e.g. "mushroom" flags any ingredient containing that word
          </p>
        </div>
      </div>

      {/* Intake Form Answers */}
      <div className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Intake Form Answers</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Populated automatically from the client's onboarding form. Editable by you and the client.</p>
        </div>
        {[
          { key: 'intake_motivators', label: 'Main motivators' },
          { key: 'intake_barriers', label: 'Barriers to achieving goals' },
          { key: 'intake_health_history', label: 'Health history / concerns' },
          { key: 'intake_plan_interest', label: 'Interested in (training / diet / both)' },
          { key: 'intake_current_diet', label: 'Current diet' },
          { key: 'intake_current_training', label: 'Current training routine' },
          { key: 'intake_cardio_preferences', label: 'Cardio preferences' },
          { key: 'intake_food_preferences', label: 'Food preferences' },
          { key: 'intake_meal_preference', label: 'Meal preference (specific meals / macros)' },
          { key: 'intake_other_info', label: 'Other information' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder="—"
            />
          </div>
        ))}
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"><p className="text-sm text-red-700 dark:text-red-400">{error}</p></div>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
    </form>
    </div>
  )
}

function WeightTab({ clientId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight_kg: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: weightData }, { data: checkinData }] = await Promise.all([
      supabase.from('weight_entries').select('*').eq('client_id', clientId).order('recorded_at', { ascending: false }),
      supabase.from('client_checkins').select('weight_kg, submitted_at, updated_at').eq('client_id', clientId).not('weight_kg', 'is', null),
    ])
    const manual = weightData || []
    const manualDates = new Set(manual.map(e => e.recorded_at))
    // Add check-in weights only for dates not already covered by a manual entry
    // (recent check-ins are synced automatically so they'd already be in weight_entries)
    const fromCheckins = (checkinData || [])
      .map(c => ({ id: null, weight_kg: c.weight_kg, recorded_at: (c.submitted_at || c.updated_at || '').split('T')[0], source: 'checkin' }))
      .filter(c => c.recorded_at && !manualDates.has(c.recorded_at))
    const combined = [...manual, ...fromCheckins].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    setEntries(combined); setLoading(false)
  }
  useEffect(() => { load() }, [clientId])

  async function addEntry(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('weight_entries').insert({ client_id: clientId, weight_kg: parseFloat(form.weight_kg), recorded_at: form.date })
    setSaving(false); setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], weight_kg: '' }); load()
  }
  async function deleteEntry(id) { await supabase.from('weight_entries').delete().eq('id', id); load() }
  function formatDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card"><h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weight Trend</h3><WeightChart data={entries} /></div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Entries</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">{showForm ? 'Cancel' : 'Add Entry'}</button>
      </div>
      {showForm && (
        <form onSubmit={addEntry} className="card flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1"><label className="label">Date</label><input className="input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="flex-1"><label className="label">Weight (kg)</label><input className="input" type="number" step="0.1" min="0" required value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="e.g. 72.5" /></div>
          <button type="submit" disabled={saving} className="btn-primary whitespace-nowrap">{saving ? 'Saving…' : 'Add'}</button>
        </form>
      )}
      {entries.length === 0 ? (
        <div className="card text-center py-10"><p className="text-gray-400 dark:text-gray-500 text-sm">No weight entries yet.</p></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['Date','Weight',''].map(h => <th key={h} className={`${h === '' ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((e, i) => (
                <tr key={e.id ?? `ci-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(e.recorded_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.weight_kg} kg</td>
                  <td className="px-4 py-3 text-right">
                    {e.source === 'checkin'
                      ? <span className="text-xs text-gray-400 dark:text-gray-500">Check-in</span>
                      : <button onClick={() => deleteEntry(e.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MeasurementsTab({ clientId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '', arms_cm: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('measurements').select('*').eq('client_id', clientId).order('recorded_at', { ascending: false })
    setEntries(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [clientId])

  async function addEntry(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('measurements').insert({ client_id: clientId, recorded_at: form.date, chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null, waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null, hips_cm: form.hips_cm ? parseFloat(form.hips_cm) : null, thighs_cm: form.thighs_cm ? parseFloat(form.thighs_cm) : null, arms_cm: form.arms_cm ? parseFloat(form.arms_cm) : null })
    setSaving(false); setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '', arms_cm: '' }); load()
  }
  async function deleteEntry(id) { await supabase.from('measurements').delete().eq('id', id); load() }
  function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  function fmtVal(v) { return v != null ? `${v} cm` : '—' }
  if (loading) return <LoadingSpinner size="lg" className="py-12" />
  const latest = entries[0]

  return (
    <div className="space-y-6">
      {latest && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Latest — {fmtDate(latest.recorded_at)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[['Chest', latest.chest_cm],['Waist', latest.waist_cm],['Hips', latest.hips_cm],['Thighs', latest.thighs_cm],['Arms', latest.arms_cm]].map(([label, value]) => (
              <div key={label} className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{fmtVal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">{showForm ? 'Cancel' : 'Add Measurements'}</button>
      </div>
      {showForm && (
        <form onSubmit={addEntry} className="card space-y-4">
          <div><label className="label">Date</label><input className="input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[['chest_cm','Chest (cm)'],['waist_cm','Waist (cm)'],['hips_cm','Hips (cm)'],['thighs_cm','Thighs (cm)'],['arms_cm','Arms (cm)']].map(([key, label]) => (
              <div key={key}><label className="label">{label}</label><input className="input" type="number" step="0.1" min="0" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="—" /></div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}
      {entries.length === 0 ? (
        <div className="card text-center py-10"><p className="text-gray-400 text-sm">No measurements yet.</p></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['Date','Chest','Waist','Hips','Thighs','Arms',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtDate(e.recorded_at)}</td>
                  {['chest_cm','waist_cm','hips_cm','thighs_cm','arms_cm'].map(k => <td key={k} className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e[k])}</td>)}
                  <td className="px-4 py-3 text-right"><button onClick={() => deleteEntry(e.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PhotosTab({ clientId }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase.from('progress_photos').select('*').eq('client_id', clientId).order('recorded_at', { ascending: false })
    setPhotos(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [clientId])

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true); setStorageError(false)
    for (const file of files) {
      const path = `${clientId}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('progress-photos').upload(path, file)
      if (uploadErr) { setStorageError(true); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path)
      await supabase.from('progress_photos').insert({ client_id: clientId, photo_url: urlData.publicUrl, recorded_at: new Date().toISOString().split('T')[0] })
    }
    setUploading(false); if (fileRef.current) fileRef.current.value = ''; load()
  }

  async function deletePhoto(photo) {
    const url = photo.photo_url
    const idx = url.indexOf('/progress-photos/')
    if (idx !== -1) await supabase.storage.from('progress-photos').remove([decodeURIComponent(url.slice(idx + '/progress-photos/'.length))])
    await supabase.from('progress_photos').delete().eq('id', photo.id)
    if (lightbox?.id === photo.id) setLightbox(null)
    load()
  }

  function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-6">
      {storageError && <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"><p className="text-sm text-yellow-800 dark:text-yellow-300">Photo storage not configured yet.</p></div>}
      <div className="flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">{uploading ? 'Uploading…' : 'Upload Photos'}</button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <p className="text-xs text-gray-400">JPG, PNG, HEIC, WebP</p>
      </div>
      {photos.length === 0 ? (
        <div className="card text-center py-10"><p className="text-gray-400 text-sm">No photos yet.</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img src={photo.photo_url} alt="" className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightbox(photo)} />
              <div className="p-2"><p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(photo.recorded_at)}</p></div>
              <button onClick={() => deletePhoto(photo)} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.photo_url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotesTab({ client }) {
  const [notes, setNotes] = useState(client.notes || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  async function handleBlur() {
    if (notes === (client.notes || '')) return
    setSaving(true)
    await supabase.from('clients').update({ notes }).eq('id', client.id)
    setSaving(false); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Coach Notes</h3>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {savedMsg && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
      <textarea className="input resize-y min-h-[300px]" value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleBlur} placeholder="Private notes about this client — auto-saves on blur." />
      <p className="text-xs text-gray-400 dark:text-gray-500">Private and only visible to you.</p>
    </div>
  )
}

// ─── Meal Plan helpers ────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

// ─── Food restriction helpers ──────────────────────────────────────────────────


const ALLERGEN_KEYWORDS = {
  dairy:     ['milk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'whey', 'casein',
               'lactose', 'cheddar', 'mozzarella', 'feta', 'brie', 'ricotta', 'mascarpone',
               'skyr', 'creme', 'crème', 'quark', 'fromage'],
  gluten:    ['wheat', 'flour', 'bread', 'pasta', 'oat', 'oats', 'barley', 'rye', 'semolina',
               'spelt', 'couscous', 'bulgur', 'wrap', 'tortilla', 'bagel', 'sourdough',
               'naan', 'pita', 'cracker', 'biscuit', 'malt'],
  nuts:      ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'brazil nut',
               'macadamia', 'pine nut', 'mixed nuts', 'tree nut'],
  peanuts:   ['peanut', 'peanut butter', 'groundnut'],
  shellfish: ['prawn', 'shrimp', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster',
               'crayfish', 'langoustine', 'squid', 'octopus'],
  fish:      ['salmon', 'tuna', 'cod', 'haddock', 'tilapia', 'sea bass', 'mackerel', 'trout',
               'anchovy', 'sardine', 'halibut', 'basa', 'pollock', 'plaice', 'herring'],
  eggs:      ['egg'],
  soy:       ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso'],
  sesame:    ['sesame', 'tahini'],
}

function ingredientMatchesRestriction(ingName, restriction) {
  const lower = ingName.toLowerCase()
  const keywords = ALLERGEN_KEYWORDS[restriction] || [restriction.toLowerCase()]
  return keywords.some(kw => lower.includes(kw))
}

export function getMealConflicts(meal, tier, allergies, dislikes) {
  if (!meal) return { allergens: [], dislikes: [] }
  const tierVersion = tier ? meal.meal_tier_versions?.find(v => v.calorie_tier === tier) : null
  // Use tier ingredients for display; always look up the base meal_ingredients.id for removal
  const displayIngs = tierVersion?.meal_tier_ingredients || meal.meal_ingredients || []
  const baseIngs    = meal.meal_ingredients || []

  const allergenHits = [], dislikeHits = []

  for (const ing of displayIngs) {
    // Find the matching base ingredient so we have the correct id for override removal
    const base = baseIngs.find(b =>
      b.name === ing.name ||
      (b.ingredient_id && ing.ingredient_id && b.ingredient_id === ing.ingredient_id)
    )
    const removeId = base?.id ?? ing.id
    const alternativeIds = base?.alternative_ingredient_ids || []
    const quantity_g = ing.quantity_g ?? base?.quantity_g ?? 0

    for (const allergen of (allergies || [])) {
      if (ingredientMatchesRestriction(ing.name, allergen)) {
        if (!allergenHits.find(h => h.allergen === allergen && h.ingredientName === ing.name)) {
          allergenHits.push({ allergen, ingredientName: ing.name, removeId, quantity_g, alternativeIds })
        }
      }
    }
    for (const dislike of (dislikes || [])) {
      if (dislike && ing.name.toLowerCase().includes(dislike.toLowerCase())) {
        if (!dislikeHits.find(h => h.dislike === dislike && h.ingredientName === ing.name)) {
          dislikeHits.push({ dislike, ingredientName: ing.name, removeId, quantity_g, alternativeIds })
        }
      }
    }
  }

  return { allergens: allergenHits, dislikes: dislikeHits }
}

function findSafeMeal(category, excludeId, allergies, dislikes, mealMap, mealsByCategory, tier) {
  const options = mealsByCategory[category] || []
  return options.find(m => {
    if (m.id === excludeId) return false
    const { allergens, dislikes: dl } = getMealConflicts(m, tier, allergies, dislikes)
    return allergens.length === 0 && dl.length === 0
  }) || null
}

function findSafeAlternative(hit, allergies, dislikes, library) {
  for (const altId of (hit.alternativeIds || [])) {
    const libIng = library.find(l => l.id === altId)
    if (!libIng) continue
    const clashes =
      (allergies || []).some(a => ingredientMatchesRestriction(libIng.name, a)) ||
      (dislikes  || []).some(d => d && libIng.name.toLowerCase().includes(d.toLowerCase()))
    if (!clashes) return libIng
  }
  return null
}

// The client eats one option per category per day, not both — these are the two
// interchangeable combinations the daily totals are built from.
const OPTION_1_KEYS = ['breakfast1', 'lunch1', 'dinner1']
const OPTION_2_KEYS = ['breakfast2', 'lunch2', 'dinner2']
const SLOT_CATEGORY = Object.fromEntries(MEAL_SLOTS.map(s => [s.key, s.cat]))
// Which option (1 or 2) each rotating slot belongs to — lets Auto mode size each option's
// breakfast/lunch/dinner independently, since the two options can be entirely different meals.
const SLOT_OPTION = { breakfast1: 1, breakfast2: 2, lunch1: 1, lunch2: 2, dinner1: 1, dinner2: 2 }

// The day's actual calories should stay within this band of the client's assigned calorie tier —
// each meal's tier version is already generated to hit its own sub-target within this same band, but
// swapping in a different meal or editing ingredients per-client can push the day total out of it.
const UNDER_TARGET_TOLERANCE = 50
const OVER_TARGET_TOLERANCE = 20

function round1(n) {
  return Math.round(n * 10) / 10
}

// Snap a gram amount to the ingredient library's serving step / minimum amount
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

// Per-client override shape for a single meal slot: { qty: {id: grams}, removed: [id], added: [row] }.
// Older saved data was a flat { id: grams } map — normalize that into the same shape.
function normalizeOverrides(raw) {
  if (!raw) return { qty: {}, removed: [], added: [] }
  if (raw.qty || raw.removed || raw.added) {
    return { qty: raw.qty || {}, removed: raw.removed || [], added: raw.added || [] }
  }
  return { qty: { ...raw }, removed: [], added: [] }
}

function hasAnyOverride(raw) {
  const { qty, removed, added } = normalizeOverrides(raw)
  return Object.keys(qty).length > 0 || removed.length > 0 || added.length > 0
}

// Apply per-client gram overrides, removals and additions to a meal's ingredient list.
// Quantity overrides rescale that ingredient's macros proportionally.
function applyIngredientOverrides(ingredients, overridesForSlot) {
  const { qty, removed, added } = normalizeOverrides(overridesForSlot)
  const visible = removed.length ? ingredients.filter(ing => ing.is_static || !removed.includes(ing.id)) : ingredients
  const withQty = visible.map(ing => {
    if (ing.is_static) return ing
    const override = qty[ing.id]
    if (override == null) return ing
    const origQty = parseFloat(ing.quantity_g) || 0
    const ratio = origQty > 0 ? override / origQty : 1
    return {
      ...ing,
      quantity_g: override,
      calories:  round1((parseFloat(ing.calories)  || 0) * ratio),
      protein_g: round1((parseFloat(ing.protein_g) || 0) * ratio),
      carbs_g:   round1((parseFloat(ing.carbs_g)   || 0) * ratio),
      fat_g:     round1((parseFloat(ing.fat_g)     || 0) * ratio),
    }
  })
  if (!added.length) return withQty
  return [...withQty, ...added.map(a => ({ ...a, _isAdded: true }))]
}

function sumIngredientMacros(ingredients) {
  return ingredients.reduce(
    (acc, ing) => ({
      cal:  acc.cal  + (parseFloat(ing.calories)  || 0),
      prot: acc.prot + (parseFloat(ing.protein_g) || 0),
      carb: acc.carb + (parseFloat(ing.carbs_g)   || 0),
      fat:  acc.fat  + (parseFloat(ing.fat_g)     || 0),
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

// Whether this meal actually has a saved calorie-tier version for the given tier — if not,
// mealMacros() silently falls back to the base portion, so callers use this to warn the coach why a
// meal's calories didn't change when the client's tier did.
function tierVersionExists(mealId, mealMap, tier) {
  if (!mealId || !tier || !mealMap[mealId]) return true
  return (mealMap[mealId].meal_tier_versions || []).some(v => v.calorie_tier === tier)
}

// Get macros for a meal at a given calorie tier, falling back to base ingredients.
// overridesForSlot holds this client's gram tweaks / removed / added ingredients for the slot.
function mealMacros(mealId, mealMap, tier, overridesForSlot) {
  if (!mealId || !mealMap[mealId]) return { cal: 0, prot: 0, carb: 0, fat: 0 }
  const hasOverrides = hasAnyOverride(overridesForSlot)
  if (tier) {
    const v = (mealMap[mealId].meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) {
      if (!hasOverrides) return { cal: parseFloat(v.calories) || 0, prot: parseFloat(v.protein_g) || 0, carb: parseFloat(v.carbs_g) || 0, fat: parseFloat(v.fat_g) || 0 }
      return sumIngredientMacros(applyIngredientOverrides(v.meal_tier_ingredients || [], overridesForSlot))
    }
  }
  return sumIngredientMacros(applyIngredientOverrides(mealMap[mealId].meal_ingredients || [], overridesForSlot))
}

// Factory for the add/remove/quantity-change handlers shared by rotating slots and static meals —
// `key` is the slot key (rotating) or static field name, scoped within whichever overrides state is passed in.
function makeOverrideHandlers(setOverrides, setDirty) {
  return {
    changeQty(key, ingredientId, value) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        const qty = { ...current.qty }
        if (value === null || value === '') delete qty[ingredientId]
        else {
          const num = parseFloat(value)
          if (isNaN(num)) return prev
          qty[ingredientId] = num
        }
        return { ...prev, [key]: { ...current, qty } }
      })
      setDirty(true)
    },
    remove(key, ingredientId) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        if (current.removed.includes(ingredientId)) return prev
        const qty = { ...current.qty }
        delete qty[ingredientId]
        return { ...prev, [key]: { ...current, qty, removed: [...current.removed, ingredientId] } }
      })
      setDirty(true)
    },
    restore(key, ingredientId) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        return { ...prev, [key]: { ...current, removed: current.removed.filter(id => id !== ingredientId) } }
      })
      setDirty(true)
    },
    add(key, newIngredient) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        return { ...prev, [key]: { ...current, added: [...current.added, newIngredient] } }
      })
      setDirty(true)
    },
    removeAdded(key, addedId) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        return { ...prev, [key]: { ...current, added: current.added.filter(a => a.id !== addedId) } }
      })
      setDirty(true)
    },
    revertAll(key) {
      setOverrides(prev => {
        if (!prev[key]) return prev
        const { [key]: _omit, ...rest } = prev
        return rest
      })
      setDirty(true)
    },
  }
}

function addMacros(a, b) {
  return { cal: a.cal + b.cal, prot: a.prot + b.prot, carb: a.carb + b.carb, fat: a.fat + b.fat }
}

function sumMealSlots(keys, editedSlots, mealMap, tier, ingredientOverrides) {
  return keys.reduce(
    (acc, key) => addMacros(acc, mealMacros(editedSlots[key], mealMap, tier, ingredientOverrides[key])),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

// Ingredient list for a calorie-tier version or base meal. Gram quantities are editable per-client,
// and ingredients can be removed or added just for this client — none of it touches the shared
// master meal/tier-version data. Quantity overrides rescale that ingredient's macros proportionally;
// added ingredients are pulled from the coach's ingredient library so their macros are accurate.
function TierIngredientList({ mealId, mealMap, tier, overrides, library, libraryById, onQtyChange, onRemove, onRestore, onAdd, onRemoveAdded, onRevertAll, onToggleStatic, onStaticQtyChange }) {
  const [addingOpen, setAddingOpen] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addSelected, setAddSelected] = useState(null)
  const [addQty, setAddQty] = useState('')
  const [staticDrafts, setStaticDrafts] = useState({})

  const meal = mealMap[mealId]
  if (!meal) return null

  let baseIngredients = []
  let label = 'Base recipe'

  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) {
      baseIngredients = v.meal_tier_ingredients || []
      label = `${tier} kcal version`
    } else {
      baseIngredients = meal.meal_ingredients || []
      label = 'Base recipe (no tier version set)'
    }
  } else {
    baseIngredients = meal.meal_ingredients || []
  }

  const { qty: overrideQty, removed } = normalizeOverrides(overrides)
  const ingredients = applyIngredientOverrides(baseIngredients, overrides)
  const totCal  = ingredients.reduce((s, i) => s + (parseFloat(i.calories)  || 0), 0)
  const totCarb = ingredients.reduce((s, i) => s + (parseFloat(i.carbs_g)   || 0), 0)
  const totProt = ingredients.reduce((s, i) => s + (parseFloat(i.protein_g) || 0), 0)
  const totFat  = ingredients.reduce((s, i) => s + (parseFloat(i.fat_g)     || 0), 0)

  function handleBlur(ing) {
    const libIng = ing.ingredient_id ? libraryById[ing.ingredient_id] : null
    if (!libIng) return
    const snapped = snapToConstraints(ing.quantity_g, libIng)
    if (!isNaN(snapped) && snapped !== parseFloat(ing.quantity_g)) onQtyChange(ing.id, snapped)
  }

  function resetAddForm() {
    setAddingOpen(false); setAddSearch(''); setAddSelected(null); setAddQty('')
  }

  function confirmAdd() {
    if (!addSelected) return
    const qty = parseFloat(addQty)
    if (isNaN(qty) || qty <= 0) return
    const f = addSelected.serving_size > 0 ? qty / addSelected.serving_size : 0
    onAdd({
      id: `added-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: addSelected.name,
      quantity_g: qty,
      unit: addSelected.serving_unit || 'g',
      calories:  round1(f * addSelected.calories_per_serving),
      protein_g: round1(f * addSelected.protein_per_serving),
      carbs_g:   round1(f * addSelected.carbs_per_serving),
      fat_g:     round1(f * addSelected.fat_per_serving),
      ingredient_id: addSelected.id,
    })
    resetAddForm()
  }

  const filteredLibrary = addSearch
    ? library.filter(l => l.name.toLowerCase().includes(addSearch.toLowerCase())).slice(0, 8)
    : []

  const overridden = hasAnyOverride(overrides)

  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{label}</p>
        {overridden && (
          <button
            type="button"
            onClick={onRevertAll}
            className="text-xs text-gray-400 hover:text-red-500 inline-flex items-center gap-1 flex-shrink-0"
            title="Undo all changes for this client's version of this meal"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 010 8H8m-5-8l4-4m-4 4l4 4" />
            </svg>
            Revert to original
          </button>
        )}
      </div>

      {ingredients.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pb-1">
            <span className="flex-1">Ingredient</span>
            <span className="w-16 text-right">g</span>
            <span className="w-16 text-right">kcal</span>
            <span className="w-10 text-right">C</span>
            <span className="w-10 text-right">P</span>
            <span className="w-10 text-right">F</span>
            <span className="w-4" />
          </div>
          {ingredients.map((ing, i) => {
            const libIng = ing.ingredient_id ? libraryById[ing.ingredient_id] : null
            const overridden = !ing._isAdded && overrideQty[ing.id] != null
            const isStatic = ing.is_static && !ing._isAdded
            return (
              <div key={ing.id || i} className="flex items-center gap-2 text-xs">
                {onToggleStatic && !ing._isAdded && (
                  <button
                    type="button"
                    onClick={() => onToggleStatic(ing)}
                    title={isStatic ? 'Static — click to unlock for all clients' : 'Click to lock this ingredient for all clients'}
                    className={`flex-shrink-0 transition-colors ${isStatic ? 'text-amber-400 hover:text-amber-600' : 'text-gray-200 dark:text-gray-700 hover:text-gray-400'}`}
                  >
                    {isStatic ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                )}
                {(!onToggleStatic || ing._isAdded) && isStatic && (
                  <span className="flex-shrink-0 text-amber-400" title="Static ingredient — cannot be edited for this meal">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                <span className={`flex-1 truncate ${ing._isAdded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{ing.name}</span>
                <input
                  type="number"
                  min={libIng?.min_amount ?? 0}
                  step={libIng?.serving_step ?? 1}
                  className={`w-16 text-right text-xs py-0.5 px-1 rounded border tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-400 ${
                    isStatic
                      ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400'
                      : overridden
                      ? 'border-orange-300 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                  }`}
                  value={isStatic ? (staticDrafts[ing.id] ?? ing.quantity_g) : ing.quantity_g}
                  onChange={e => {
                    if (isStatic) setStaticDrafts(d => ({ ...d, [ing.id]: e.target.value }))
                    else onQtyChange(ing.id, e.target.value)
                  }}
                  onBlur={() => {
                    if (isStatic) {
                      const draft = staticDrafts[ing.id]
                      if (draft != null && draft !== String(ing.quantity_g)) onStaticQtyChange?.(ing, parseFloat(draft) || 0)
                      setStaticDrafts(d => { const n = { ...d }; delete n[ing.id]; return n })
                    } else {
                      handleBlur(ing)
                    }
                  }}
                />
                <span className="tabular-nums w-16 text-right text-gray-500 dark:text-gray-400">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
                <span className="tabular-nums w-10 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.carbs_g) || 0)}g</span>
                <span className="tabular-nums w-10 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.protein_g) || 0)}g</span>
                <span className="tabular-nums w-10 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.fat_g) || 0)}g</span>
                {isStatic ? (
                  <span className="w-4 flex-shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={() => ing._isAdded ? onRemoveAdded(ing.id) : onRemove(ing.id)}
                    className="w-4 text-center text-gray-300 hover:text-red-400 flex-shrink-0"
                    title={ing._isAdded ? 'Remove this ingredient' : 'Remove for this client'}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </>
      )}

      {ingredients.length === 0 && <p className="text-xs text-gray-400 italic">No ingredients recorded</p>}

      {totCal > 0 && (
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-1.5">
          <span className="flex-1">Meal total</span>
          <span className="tabular-nums w-16 text-right">{Math.round(totCal)} kcal</span>
          <span className="tabular-nums w-10 text-right">{Math.round(totCarb)}g</span>
          <span className="tabular-nums w-10 text-right">{Math.round(totProt)}g</span>
          <span className="tabular-nums w-10 text-right">{Math.round(totFat)}g</span>
        </div>
      )}

      {removed.length > 0 && (
        <div className="pt-1.5 space-y-1">
          {removed.map(id => {
            const orig = baseIngredients.find(i => i.id === id)
            if (!orig) return null
            return (
              <div key={id} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex-1 truncate line-through">{orig.name}</span>
                <button type="button" onClick={() => onRestore(id)} className="text-brand-500 hover:text-brand-700 font-medium flex-shrink-0">Restore</button>
              </div>
            )
          })}
        </div>
      )}

      {!addingOpen ? (
        <button type="button" onClick={() => setAddingOpen(true)} className="mt-1 text-xs text-brand-500 hover:text-brand-700 font-medium inline-flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add ingredient
        </button>
      ) : (
        <div className="mt-1 p-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
          <div className="relative">
            <input
              autoFocus
              className="input py-1 text-xs"
              placeholder="Search your ingredient library…"
              value={addSearch}
              onChange={e => { setAddSearch(e.target.value); setAddSelected(null) }}
            />
            {addSearch && !addSelected && (
              <div className="absolute z-20 left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full max-h-40 overflow-y-auto">
                {filteredLibrary.map(l => (
                  <button key={l.id} type="button" onClick={() => { setAddSelected(l); setAddSearch(l.name) }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-between gap-2">
                    <span className="truncate">{l.name}</span>
                    <span className="text-gray-400 flex-shrink-0">{l.calories_per_serving} kcal/{l.serving_size}{l.serving_unit}</span>
                  </button>
                ))}
                {filteredLibrary.length === 0 && <p className="px-2 py-1.5 text-xs text-gray-400 italic">No matches in your ingredient library</p>}
              </div>
            )}
          </div>
          {addSelected ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input py-1 text-xs w-20"
                placeholder="grams"
                min={addSelected.min_amount ?? 0}
                step={addSelected.serving_step ?? 1}
                value={addQty}
                onChange={e => setAddQty(e.target.value)}
              />
              <span className="text-xs text-gray-400">{addSelected.serving_unit}</span>
              <button type="button" onClick={confirmAdd} disabled={!addQty} className="btn-primary py-1 px-2 text-xs">Add</button>
              <button type="button" onClick={resetAddForm} className="text-xs text-gray-400 hover:text-gray-700">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={resetAddForm} className="text-xs text-gray-400 hover:text-gray-700">Cancel</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Meal Plan Tab ────────────────────────────────────────────────────────────

function MealPlanTab({ client, coachId }) {
  const [planGroups, setPlanGroups] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [planGroup, setPlanGroup] = useState(null)
  const [editedSlots, setEditedSlots] = useState({})
  const [templateSlots, setTemplateSlots] = useState({})
  const [slotsDirty, setSlotsDirty] = useState(false)
  const [savingSlots, setSavingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [repeating, setRepeating] = useState(false)
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [mealMap, setMealMap] = useState({})
  const [library, setLibrary] = useState([])
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  const [expandedSlots, setExpandedSlots] = useState(new Set())
  const [staticEdits, setStaticEdits] = useState({ preworkout_meal_id: null, evening_snack_meal_id: null })
  const [staticFlags, setStaticFlags] = useState({ preworkout_static: false, evening_snack_static: false })
  const [staticDirty, setStaticDirty] = useState(false)
  const [savingStatic, setSavingStatic] = useState(false)
  const [staticError, setStaticError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plan_group_id: '', calorie_target: CALORIE_TIERS.includes(client.current_calories) ? client.current_calories : '', starting_week: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  const [overrideWeek, setOverrideWeek] = useState('')
  const [pastAssignments, setPastAssignments] = useState([])

  async function loadWeekSlots(asgn, weekNum, planGroupId) {
    // If a coach has forked this client's exact calorie target into its own version of the plan
    // (see PlanGroupEditor), it takes priority over the standard template for this week.
    const tier = CALORIE_TIERS.includes(asgn.calorie_target) ? asgn.calorie_target : null
    const [{ data: tierTmpl }, { data: stdTmpl }, { data: cwm }] = await Promise.all([
      tier
        ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', planGroupId).eq('week_number', weekNum).eq('calorie_tier', tier).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', planGroupId).eq('week_number', weekNum).is('calorie_tier', null).maybeSingle(),
      supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', asgn.id).eq('week_number', weekNum).maybeSingle(),
    ])
    const tmpl = tierTmpl || stdTmpl
    const tSlots = {}
    for (const s of (tmpl?.template_meal_slots || [])) tSlots[s.slot_type] = s.meal_id
    // Static meals override the template default so the pinned meal auto-fills each week
    if (asgn.preworkout_static && asgn.preworkout_meal_id) tSlots.preworkout = asgn.preworkout_meal_id
    if (asgn.evening_snack_static && asgn.evening_snack_meal_id) tSlots.evening_snack = asgn.evening_snack_meal_id
    setTemplateSlots(tSlots)
    setEditedSlots({ ...tSlots, ...(cwm?.slots || {}) })
    setIngredientOverrides(cwm?.ingredient_overrides || {})
    setSlotsDirty(false)
  }

  async function load() {
    const [{ data: groups }, { data: asgn }, { data: past }, { data: mealsData }, { data: libData }] = await Promise.all([
      supabase.from('plan_groups').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
      supabase.from('client_plan_assignments').select('*').eq('client_id', client.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('client_plan_assignments').select('*').eq('client_id', client.id).eq('active', false).order('created_at', { ascending: false }),
      supabase.from('meals').select(`
        id, name, category,
        meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static, alternative_ingredient_ids),
        meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
          meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id, is_static))
      `).eq('coach_id', coachId).order('name'),
      supabase.from('ingredients').select('*').eq('coach_id', coachId),
    ])

    const allGroups = groups || []
    setPlanGroups(allGroups)
    setAssignment(asgn || null)
    setPastAssignments(past || [])
    setLibrary(libData || [])

    const map = {}, byCat = {}
    for (const m of (mealsData || [])) {
      map[m.id] = m
      ;(byCat[m.category] = byCat[m.category] || []).push(m)
    }
    setMealMap(map)
    setMealsByCategory(byCat)

    if (asgn) {
      const pg = allGroups.find(g => g.id === asgn.plan_group_id) || null
      setPlanGroup(pg)
      setOverrideWeek(asgn.week_override ?? '')
      setStaticEdits({
        preworkout_meal_id: asgn.preworkout_meal_id || null,
        evening_snack_meal_id: asgn.evening_snack_meal_id || null,
      })
      setStaticFlags({
        preworkout_static: !!asgn.preworkout_static,
        evening_snack_static: !!asgn.evening_snack_static,
      })
      if (pg) await loadWeekSlots(asgn, asgn.week_override ?? pg.current_week, pg.id)
    }
    setLoading(false)
  }

  const libraryById = Object.fromEntries(library.map(l => [l.id, l]))

  const slotHandlers = makeOverrideHandlers(setIngredientOverrides, setSlotsDirty)

  const clientAllergies = client.allergies || []
  const clientDislikes  = (client.dislikes || []).filter(Boolean)

  function autoSwapMeal(slotKey, category) {
    const currentId = editedSlots[slotKey] || null
    const safe = findSafeMeal(category, currentId, clientAllergies, clientDislikes, mealMap, mealsByCategory, tier)
    if (!safe) return
    setEditedSlots(prev => ({ ...prev, [slotKey]: safe.id }))
    setIngredientOverrides(prev => { const n = { ...prev }; delete n[slotKey]; return n })
    setSlotsDirty(true)
  }

  function removeDislikedIngredient(slotKey, removeId) {
    slotHandlers.remove(slotKey, removeId)
  }

  function swapIngredient(slotKey, removeId, originalQty, libIng) {
    const f = originalQty / libIng.serving_size
    const round1 = n => Math.round(n * 10) / 10
    const newIng = {
      id: `added-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: libIng.name,
      quantity_g: originalQty,
      unit: libIng.serving_unit || 'g',
      calories:   round1(f * libIng.calories_per_serving),
      protein_g:  round1(f * libIng.protein_per_serving),
      carbs_g:    round1(f * libIng.carbs_per_serving),
      fat_g:      round1(f * libIng.fat_per_serving),
      ingredient_id: libIng.id,
    }
    slotHandlers.remove(slotKey, removeId)
    slotHandlers.add(slotKey, newIng)
  }

  async function updateStaticIngredientQty(mealId, ing, newQty) {
    const meal = mealMap[mealId]
    if (!meal) return
    const baseIng = meal.meal_ingredients.find(b =>
      (ing.ingredient_id && b.ingredient_id === ing.ingredient_id) || b.name === ing.name
    )
    if (!baseIng) return
    const libIng = ing.ingredient_id ? libraryById[ing.ingredient_id] : null
    const factor = libIng && libIng.serving_size > 0 ? newQty / libIng.serving_size : newQty > 0 ? newQty / (parseFloat(baseIng.quantity_g) || 1) : 0
    const macros = libIng ? {
      calories:  Math.round(factor * libIng.calories_per_serving * 10) / 10,
      protein_g: Math.round(factor * libIng.protein_per_serving  * 10) / 10,
      carbs_g:   Math.round(factor * libIng.carbs_per_serving    * 10) / 10,
      fat_g:     Math.round(factor * libIng.fat_per_serving      * 10) / 10,
    } : {}
    await supabase.from('meal_ingredients').update({ quantity_g: newQty, ...macros }).eq('id', baseIng.id)
    const tierVersionIds = (meal.meal_tier_versions || []).map(v => v.id)
    if (tierVersionIds.length > 0) {
      const q = supabase.from('meal_tier_ingredients').update({ quantity_g: newQty, ...macros }).in('tier_version_id', tierVersionIds)
      ing.ingredient_id ? await q.eq('ingredient_id', ing.ingredient_id) : await q.eq('name', ing.name)
    }
    setMealMap(prev => {
      const m = { ...prev[mealId] }
      m.meal_ingredients = m.meal_ingredients.map(b =>
        b.id === baseIng.id ? { ...b, quantity_g: newQty, ...macros } : b
      )
      m.meal_tier_versions = (m.meal_tier_versions || []).map(v => ({
        ...v,
        meal_tier_ingredients: (v.meal_tier_ingredients || []).map(ti =>
          (ing.ingredient_id ? ti.ingredient_id === ing.ingredient_id : ti.name === ing.name)
            ? { ...ti, quantity_g: newQty, ...macros }
            : ti
        ),
      }))
      return { ...prev, [mealId]: m }
    })
  }

  async function toggleIngredientStatic(mealId, ing) {
    const meal = mealMap[mealId]
    if (!meal || ing._isAdded) return
    const newVal = !ing.is_static
    const baseIng = meal.meal_ingredients.find(b =>
      (ing.ingredient_id && b.ingredient_id === ing.ingredient_id) || b.name === ing.name
    )
    if (!baseIng) return
    await supabase.from('meal_ingredients').update({ is_static: newVal }).eq('id', baseIng.id)
    const tierVersionIds = (meal.meal_tier_versions || []).map(v => v.id)
    if (tierVersionIds.length > 0) {
      const q = supabase.from('meal_tier_ingredients').update({ is_static: newVal }).in('tier_version_id', tierVersionIds)
      ing.ingredient_id ? await q.eq('ingredient_id', ing.ingredient_id) : await q.eq('name', ing.name)
    }
    setMealMap(prev => {
      const m = { ...prev[mealId] }
      m.meal_ingredients = m.meal_ingredients.map(b => b.id === baseIng.id ? { ...b, is_static: newVal } : b)
      m.meal_tier_versions = (m.meal_tier_versions || []).map(v => ({
        ...v,
        meal_tier_ingredients: (v.meal_tier_ingredients || []).map(ti =>
          (ing.ingredient_id ? ti.ingredient_id === ing.ingredient_id : ti.name === ing.name)
            ? { ...ti, is_static: newVal }
            : ti
        ),
      }))
      return { ...prev, [mealId]: m }
    })
  }

  useEffect(() => { load() }, [client.id])

  const globalWeek = planGroup?.current_week ?? null
  const effectiveWeek = assignment?.week_override ?? globalWeek
  const isOverridden = assignment?.week_override != null

  // The single calorie tier this client is assigned to — every meal's macros below are read from
  // that meal's tier version, which was already generated to hit its own sub-target within the
  // -50/+20 kcal band, so there's no per-client sizing to compute here.
  const tier = assignment && CALORIE_TIERS.includes(assignment.calorie_target) ? assignment.calorie_target : null

  // Pre-workout/evening-snack default to whatever the plan template has set for this tier — a
  // coach only needs staticEdits/staticFlags when a specific client needs something different
  // (e.g. an allergy or dislike), via the "Make static" button below.
  const effectivePreworkoutId = editedSlots.preworkout || null
  const effectiveSnackId = editedSlots.evening_snack || null
  const preworkoutTotal = mealMacros(effectivePreworkoutId, mealMap, tier, ingredientOverrides.preworkout)
  const snackTotal = mealMacros(effectiveSnackId, mealMap, tier, ingredientOverrides.evening_snack)

  // Daily macro totals — one of each option (not both) plus the static meals. Each option is
  // compared against the calorie target independently, since the two can be different meals.
  const option1Subtotal = sumMealSlots(OPTION_1_KEYS, editedSlots, mealMap, tier, ingredientOverrides)
  const option2Subtotal = sumMealSlots(OPTION_2_KEYS, editedSlots, mealMap, tier, ingredientOverrides)
  const option1Total = addMacros(addMacros(option1Subtotal, preworkoutTotal), snackTotal)
  const option2Total = addMacros(addMacros(option2Subtotal, preworkoutTotal), snackTotal)

  // Suggestion: if an option's day total falls outside the -50/+20 kcal band, suggest a fix. Every
  // meal is already sized to hit its own calorie-tier sub-target, so the gap (if any) can only be
  // closed by swapping a meal or editing ingredients for this client.
  function getTargetSuggestion(dayTotal, label) {
    if (!assignment?.calorie_target) return null
    const gap = assignment.calorie_target - dayTotal.cal
    if (gap <= UNDER_TARGET_TOLERANCE && gap >= -OVER_TARGET_TOLERANCE) return null

    if (gap > UNDER_TARGET_TOLERANCE) {
      return { text: `Swap a meal or edit ingredients`, detail: `${label} still ~${Math.round(gap)} kcal under target — swap in a bigger meal, add to a meal's ingredients, or regenerate this meal's calorie-tier version in the Meal Library` }
    }
    return { text: `Swap a meal or edit ingredients`, detail: `${label} still ~${Math.round(Math.abs(gap))} kcal over target — swap in a smaller meal, trim a meal's ingredients, or regenerate this meal's calorie-tier version in the Meal Library` }
  }
  const suggestion1 = getTargetSuggestion(option1Total, 'Option 1')
  const suggestion2 = option2Subtotal.cal > 0 ? getTargetSuggestion(option2Total, 'Option 2') : null

  function targetStatus(total) {
    if (!assignment?.calorie_target) return null
    if (total.cal > assignment.calorie_target + OVER_TARGET_TOLERANCE) {
      return <p className="text-sm font-medium text-orange-500">{Math.round(total.cal - assignment.calorie_target)} kcal over target (max {OVER_TARGET_TOLERANCE})</p>
    }
    if (total.cal < assignment.calorie_target - UNDER_TARGET_TOLERANCE) {
      return <p className="text-sm font-medium text-blue-500">{Math.round(assignment.calorie_target - total.cal)} kcal under target (max {UNDER_TARGET_TOLERANCE})</p>
    }
    return null
  }

  function toggleSlot(key) {
    setExpandedSlots(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  function dayTotalViolations() {
    return [
      option1Subtotal.cal > 0 ? suggestion1 : null,
      option2Subtotal.cal > 0 ? suggestion2 : null,
    ].filter(Boolean)
  }

  async function handleSaveSlots() {
    if (!assignment || effectiveWeek == null) return
    const violations = dayTotalViolations()
    if (violations.length > 0) {
      setSlotsError(`${violations.map(v => v.detail).join(' ')} Fix this before saving.`)
      return
    }
    setSlotsError('')
    setSavingSlots(true)
    await supabase.from('client_week_meals').upsert(
      { client_id: client.id, coach_id: coachId, assignment_id: assignment.id, week_number: effectiveWeek, slots: editedSlots, ingredient_overrides: ingredientOverrides },
      { onConflict: 'assignment_id,week_number' }
    )
    setSavingSlots(false); setSlotsDirty(false)
  }

  async function handleSaveStaticMeals() {
    if (!assignment) return
    const violations = dayTotalViolations()
    if (violations.length > 0) {
      setStaticError(`${violations.map(v => v.detail).join(' ')} Fix this before saving.`)
      return
    }
    setStaticError('')
    setSavingStatic(true)
    await supabase.from('client_plan_assignments').update({
      preworkout_meal_id: staticEdits.preworkout_meal_id || null,
      evening_snack_meal_id: staticEdits.evening_snack_meal_id || null,
      preworkout_static: staticFlags.preworkout_static,
      evening_snack_static: staticFlags.evening_snack_static,
    }).eq('id', assignment.id)
    setSavingStatic(false); setStaticDirty(false)
  }

  function makeStatic(key, flagKey, templateMealId) {
    setStaticEdits(prev => ({ ...prev, [key]: templateMealId || null }))
    setStaticFlags(prev => ({ ...prev, [flagKey]: true }))
    setStaticDirty(true)
  }

  function useTemplateDefault(key, flagKey) {
    setStaticFlags(prev => ({ ...prev, [flagKey]: false }))
    setStaticDirty(true)
  }

  async function handleRepeatLastWeek() {
    if (!assignment || effectiveWeek == null) return
    setRepeating(true)
    const prevWeek = effectiveWeek > 1 ? effectiveWeek - 1 : 20
    const [{ data: prevTmpl }, { data: prevCwm }] = await Promise.all([
      supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', assignment.plan_group_id).eq('week_number', prevWeek).maybeSingle(),
      supabase.from('client_week_meals').select('slots').eq('assignment_id', assignment.id).eq('week_number', prevWeek).maybeSingle(),
    ])
    const prevTSlots = {}
    for (const s of (prevTmpl?.template_meal_slots || [])) prevTSlots[s.slot_type] = s.meal_id
    setEditedSlots({ ...prevTSlots, ...(prevCwm?.slots || {}) })
    setSlotsDirty(true); setRepeating(false)
  }

  async function handleAssign(e) {
    e.preventDefault(); setSaving(true); setError('')
    await supabase.from('client_plan_assignments').update({ active: false, ended_at: new Date().toISOString() }).eq('client_id', client.id).eq('active', true)
    const group = planGroups.find(g => g.id === form.plan_group_id)
    const { data: newAssignment, error: err } = await supabase.from('client_plan_assignments').insert({
      client_id: client.id, coach_id: coachId,
      plan_group_id: form.plan_group_id,
      plan_group_name: group?.name || '20 Week Plan',
      calorie_target: form.calorie_target ? parseInt(form.calorie_target) : null,
      start_date: new Date().toISOString().split('T')[0],
      week_override: form.starting_week ? parseInt(form.starting_week) : null,
    }).select('id').single()
    if (err) { setSaving(false); setError(err.message); return }

    // Auto-apply default static meals configured on the plan group
    if (newAssignment && (group?.default_preworkout_meal_id || group?.default_evening_snack_meal_id)) {
      const defaults = {}
      if (group.default_preworkout_meal_id) {
        defaults.preworkout_meal_id = group.default_preworkout_meal_id
        defaults.preworkout_static = true
      }
      if (group.default_evening_snack_meal_id) {
        defaults.evening_snack_meal_id = group.default_evening_snack_meal_id
        defaults.evening_snack_static = true
      }
      await supabase.from('client_plan_assignments').update(defaults).eq('id', newAssignment.id)
    }

    setSaving(false); setShowForm(false); load()
  }

  async function handleSaveOverride(e) {
    e.preventDefault()
    await supabase.from('client_plan_assignments').update({ week_override: overrideWeek !== '' ? parseInt(overrideWeek) : null }).eq('id', assignment.id)
    setShowOverride(false); load()
  }

  async function handleClearOverride() {
    await supabase.from('client_plan_assignments').update({ week_override: null }).eq('id', assignment.id)
    setOverrideWeek(''); load()
  }

  async function handleRemove() {
    if (!confirm('Remove this meal plan assignment?')) return
    await supabase.from('client_plan_assignments').update({ active: false, ended_at: new Date().toISOString() }).eq('client_id', client.id).eq('active', true)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-5 max-w-2xl">

      {!assignment && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">No meal plan assigned yet.</p>
          {planGroups.length === 0
            ? <p className="text-xs text-gray-400">Generate a 20-week plan from the Templates page first.</p>
            : <button onClick={() => setShowForm(true)} className="btn-primary">Assign Meal Plan</button>}
        </div>
      )}

      {assignment && !planGroup && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            This client was assigned to "{assignment.plan_group_name || 'a plan'}", but that plan no longer exists
          </p>
          <p className="text-xs text-gray-400 mb-4">It was probably deleted from the Templates page. Assign a different plan to fix this.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowForm(true)} className="btn-primary">Assign a Plan</button>
            <button onClick={handleRemove} className="btn-secondary">Clear assignment</button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAssign} className="card space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{assignment ? 'Change Meal Plan' : 'Assign Meal Plan'}</h3>
          <div>
            <label className="label">Plan</label>
            <select className="input" required value={form.plan_group_id}
              onChange={e => setForm(f => ({ ...f, plan_group_id: e.target.value, starting_week: '1' }))}>
              <option value="">Select a plan…</option>
              {planGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Calorie target (kcal/day)</label>
              <select className="input" value={form.calorie_target} onChange={e => setForm(f => ({ ...f, calorie_target: e.target.value }))}>
                <option value="">Select a tier…</option>
                {CALORIE_TIERS.map(t => <option key={t} value={t}>{t} kcal</option>)}
              </select>
            </div>
            <div>
              <label className="label">Starting week</label>
              <select className="input" value={form.starting_week} onChange={e => setForm(f => ({ ...f, starting_week: e.target.value }))}>
                <option value="">Follow plan's current week</option>
                {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !form.plan_group_id} className="btn-primary">{saving ? 'Saving…' : assignment ? 'Update' : 'Assign Plan'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {assignment && planGroup && (
        <>
          {/* Plan header */}
          <div className="card space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.plan_group_name || planGroup.name}</h3>
                {assignment.calorie_target && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{assignment.calorie_target} kcal / day</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setForm({ plan_group_id: assignment.plan_group_id, calorie_target: assignment.calorie_target || '', starting_week: '' }); setShowForm(true); setShowOverride(false) }} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">Change</button>
                <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
              </div>
            </div>

            <div className="flex items-center gap-5 py-3 px-4 rounded-xl bg-pink-50/60 dark:bg-pink-900/10">
              <div className="text-center">
                <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{effectiveWeek ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Week</p>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                {isOverridden ? (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Week {assignment.week_override} <span className="text-xs font-normal text-orange-500">(individual override)</span></p>
                    <p className="text-xs text-gray-400">Plan is on Week {globalWeek}</p>
                    <button onClick={handleClearOverride} className="text-xs text-brand-500 hover:text-brand-700 font-medium">Clear &rarr; follow plan (Week {globalWeek})</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Following plan — same week as all clients</p>
                    <button onClick={() => { setOverrideWeek(globalWeek ?? 1); setShowOverride(true) }} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">Put on a different week</button>
                  </>
                )}
              </div>
            </div>

            {showOverride && (
              <form onSubmit={handleSaveOverride} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Put on week:</span>
                <select className="input py-1" value={overrideWeek} onChange={e => setOverrideWeek(e.target.value)}>
                  {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}
                </select>
                <button type="submit" className="btn-primary py-1.5 px-3 text-sm">Save</button>
                <button type="button" onClick={() => setShowOverride(false)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
              </form>
            )}
          </div>

          {/* Rotating meal slots */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Week {effectiveWeek} meals
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Follows the master plan — change any meal for this client only</p>
              </div>
              <button onClick={handleRepeatLastWeek} disabled={repeating || effectiveWeek == null} className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">
                {repeating ? 'Loading…' : `← Repeat Week ${effectiveWeek != null && effectiveWeek > 1 ? effectiveWeek - 1 : 20}`}
              </button>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {MEAL_SLOTS.map(slot => {
                const currentId = editedSlots[slot.key] || ''
                const isExpanded = expandedSlots.has(slot.key)
                const slotOverrides = ingredientOverrides[slot.key]
                const macros = mealMacros(currentId, mealMap, tier, slotOverrides)
                const options = mealsByCategory[slot.cat] || []
                const isOverridden = templateSlots[slot.key] !== undefined && (editedSlots[slot.key] || null) !== (templateSlots[slot.key] || null)
                const hasIngredientEdits = hasAnyOverride(slotOverrides)
                const missingTierVersion = currentId && tier && !tierVersionExists(currentId, mealMap, tier)
                const conflicts = getMealConflicts(mealMap[currentId], tier, clientAllergies, clientDislikes)
                const hasConflicts = conflicts.allergens.length > 0 || conflicts.dislikes.length > 0
                const canSwap = hasConflicts && !!findSafeMeal(slot.cat, currentId, clientAllergies, clientDislikes, mealMap, mealsByCategory, tier)
                return (
                  <div key={slot.key}>
                    <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                      <button onClick={() => currentId && toggleSlot(slot.key)} className="flex-shrink-0">
                        <svg className={`w-3.5 h-3.5 transition-transform text-gray-300 dark:text-gray-600 ${isExpanded ? 'rotate-90' : ''} ${!currentId ? 'opacity-0' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{slot.label}</span>
                      <select
                        className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                        value={currentId}
                        onChange={e => { setEditedSlots(prev => ({ ...prev, [slot.key]: e.target.value || null })); setSlotsDirty(true) }}
                      >
                        <option value="">— None —</option>
                        {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      {conflicts.allergens.length > 0 && (
                        <span className="text-xs font-medium text-red-500 flex-shrink-0" title={conflicts.allergens.map(c => `${ALLERGEN_LABELS[c.allergen]}: ${c.ingredientName}`).join(', ')}>
                          ⚠ Allergen
                        </span>
                      )}
                      {conflicts.dislikes.length > 0 && conflicts.allergens.length === 0 && (
                        <span className="text-xs font-medium text-amber-500 flex-shrink-0" title={conflicts.dislikes.map(d => d.ingredientName).join(', ')}>
                          ⚠ Disliked
                        </span>
                      )}
                      {isOverridden && (
                        <span className="text-xs text-orange-500 flex-shrink-0" title="Different from the master template">Custom</span>
                      )}
                      {hasIngredientEdits && (
                        <span className="text-xs text-blue-500 flex-shrink-0" title="Ingredient quantities adjusted for this client">Adjusted</span>
                      )}
                      {missingTierVersion && (
                        <span className="text-xs text-amber-500 flex-shrink-0" title={`This meal has no saved ${tier} kcal version — showing its base portion instead. Generate it in the Meal Library to fix this.`}>No {tier} kcal version</span>
                      )}
                      {currentId && macros.cal > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">{Math.round(macros.cal)} kcal</span>
                      )}
                    </div>

                    {hasConflicts && (
                      <div className="ml-9 mr-3 mb-1 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 space-y-1.5">
                        {conflicts.allergens.map(c => {
                          const safeAlt = findSafeAlternative(c, clientAllergies, clientDislikes, library)
                          return (
                            <div key={c.allergen + c.ingredientName} className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-red-600 dark:text-red-400 flex-1">
                                <span className="font-medium">{ALLERGEN_LABELS[c.allergen]}</span> — {c.ingredientName}
                              </span>
                              {safeAlt && (
                                <button
                                  onClick={() => swapIngredient(slot.key, c.removeId, c.quantity_g, safeAlt)}
                                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded transition-colors"
                                >
                                  Swap for {safeAlt.name}
                                </button>
                              )}
                              {canSwap && (
                                <button
                                  onClick={() => autoSwapMeal(slot.key, slot.cat)}
                                  className="text-xs border border-red-400 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 px-2 py-0.5 rounded transition-colors"
                                >
                                  Swap meal
                                </button>
                              )}
                            </div>
                          )
                        })}
                        {conflicts.dislikes.map(d => {
                          const safeAlt = findSafeAlternative(d, clientAllergies, clientDislikes, library)
                          return (
                            <div key={d.dislike + d.ingredientName} className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-amber-600 dark:text-amber-400 flex-1">
                                <span className="font-medium">Disliked</span> — {d.ingredientName}
                              </span>
                              {safeAlt && (
                                <button
                                  onClick={() => swapIngredient(slot.key, d.removeId, d.quantity_g, safeAlt)}
                                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded transition-colors"
                                >
                                  Swap for {safeAlt.name}
                                </button>
                              )}
                              <button
                                onClick={() => removeDislikedIngredient(slot.key, d.removeId)}
                                className="text-xs border border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 px-2 py-0.5 rounded transition-colors"
                              >
                                Remove
                              </button>
                              {canSwap && (
                                <button
                                  onClick={() => autoSwapMeal(slot.key, slot.cat)}
                                  className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
                                >
                                  Swap meal
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {isExpanded && currentId && (
                      <div className="ml-9 px-3 pb-3 bg-gray-50/40 dark:bg-gray-800/20">
                        <TierIngredientList
                          mealId={currentId}
                          mealMap={mealMap}
                          tier={tier}
                          overrides={slotOverrides}
                          library={library}
                          libraryById={libraryById}
                          onQtyChange={(ingId, val) => slotHandlers.changeQty(slot.key, ingId, val)}
                          onRemove={ingId => slotHandlers.remove(slot.key, ingId)}
                          onRestore={ingId => slotHandlers.restore(slot.key, ingId)}
                          onAdd={newIng => slotHandlers.add(slot.key, newIng)}
                          onRemoveAdded={addedId => slotHandlers.removeAdded(slot.key, addedId)}
                          onRevertAll={() => slotHandlers.revertAll(slot.key)}
                          onToggleStatic={ing => toggleIngredientStatic(currentId, ing)}
                          onStaticQtyChange={(ing, qty) => updateStaticIngredientQty(currentId, ing, qty)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(option1Subtotal.cal > 0 || option2Subtotal.cal > 0) && (
              <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 space-y-1">
                {option1Subtotal.cal > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Option 1 subtotal (A meals)</span>
                    <span className="tabular-nums text-sm font-semibold text-gray-700 dark:text-gray-200">{Math.round(option1Subtotal.cal)} kcal</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option1Subtotal.carb)}g C &middot; {Math.round(option1Subtotal.prot)}g P &middot; {Math.round(option1Subtotal.fat)}g F</span>
                  </div>
                )}
                {option2Subtotal.cal > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Option 2 subtotal (B meals)</span>
                    <span className="tabular-nums text-sm font-medium text-gray-500 dark:text-gray-400">{Math.round(option2Subtotal.cal)} kcal</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option2Subtotal.carb)}g C &middot; {Math.round(option2Subtotal.prot)}g P &middot; {Math.round(option2Subtotal.fat)}g F</span>
                  </div>
                )}
              </div>
            )}

            {slotsDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
                {slotsError && (
                  <p className="text-sm font-medium text-red-500">{slotsError}</p>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveSlots} disabled={savingSlots} className="btn-primary py-1.5 px-4 text-sm">{savingSlots ? 'Saving…' : 'Save meal changes'}</button>
                  <button onClick={() => { setEditedSlots({ ...templateSlots }); setIngredientOverrides({}); setSlotsDirty(false); setSlotsError('') }} className="text-sm text-gray-400 hover:text-gray-700">Reset to template</button>
                </div>
              </div>
            )}
          </div>

          {/* Static meals */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pre-workout &amp; Evening Snack</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Select a meal for each slot and edit ingredients per client below.</p>
            </div>

            {[
              { key: 'preworkout_meal_id', flagKey: 'preworkout_static', templateKey: 'preworkout', label: 'Pre-workout', cat: 'pre_workout' },
              { key: 'evening_snack_meal_id', flagKey: 'evening_snack_static', templateKey: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
            ].map(({ key, flagKey, templateKey, label, cat }) => {
              const isStatic = staticFlags[flagKey]
              const mealId = editedSlots[templateKey] || ''
              const isExpanded = expandedSlots.has(key)
              const options = mealsByCategory[cat] || []
              const keyOverrides = ingredientOverrides[templateKey]
              const macros = mealMacros(mealId, mealMap, tier, keyOverrides)
              const hasIngredientEdits = hasAnyOverride(keyOverrides)
              const missingTierVersion = mealId && tier && !tierVersionExists(mealId, mealMap, tier)
              return (
                <div key={key} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                    <button onClick={() => toggleSlot(key)} className="flex-shrink-0">
                      <svg className={`w-3.5 h-3.5 transition-transform text-gray-300 dark:text-gray-600 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
                    <select
                      className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                      value={mealId}
                      onChange={e => { setEditedSlots(prev => ({ ...prev, [templateKey]: e.target.value || null })); setSlotsDirty(true) }}
                    >
                      <option value="">— None —</option>
                      {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    {hasIngredientEdits && (
                      <span className="text-xs text-blue-500 flex-shrink-0" title="Ingredient quantities adjusted for this client">Adjusted</span>
                    )}
                    {missingTierVersion && (
                      <span className="text-xs text-amber-500 flex-shrink-0" title={`This meal has no saved ${tier} kcal version — showing its base portion instead. Generate it in the Meal Library to fix this.`}>No {tier} kcal version</span>
                    )}
                    {mealId && macros.cal > 0 && <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{Math.round(macros.cal)} kcal</span>}
                    <button
                      onClick={() => isStatic ? useTemplateDefault(key, flagKey) : makeStatic(key, flagKey, mealId)}
                      className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex-shrink-0 whitespace-nowrap"
                      title={isStatic ? 'Stop pinning — revert to the plan template each week' : 'Pin this meal so it carries forward every week automatically'}
                    >
                      {isStatic ? 'Use template default' : 'Make static'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="ml-9 px-3 pb-3 bg-gray-50/40 dark:bg-gray-800/20">
                      {mealId ? (
                        <TierIngredientList
                          mealId={mealId}
                          mealMap={mealMap}
                          tier={tier}
                          overrides={keyOverrides}
                          library={library}
                          libraryById={libraryById}
                          onQtyChange={(ingId, val) => slotHandlers.changeQty(templateKey, ingId, val)}
                          onRemove={ingId => slotHandlers.remove(templateKey, ingId)}
                          onRestore={ingId => slotHandlers.restore(templateKey, ingId)}
                          onAdd={newIng => slotHandlers.add(templateKey, newIng)}
                          onRemoveAdded={addedId => slotHandlers.removeAdded(templateKey, addedId)}
                          onRevertAll={() => slotHandlers.revertAll(templateKey)}
                          onToggleStatic={ing => toggleIngredientStatic(mealId, ing)}
                          onStaticQtyChange={(ing, qty) => updateStaticIngredientQty(mealId, ing, qty)}
                        />
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No meal set in the plan template for this slot.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {staticDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
                {staticError && <p className="text-sm font-medium text-red-500">{staticError}</p>}
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveStaticMeals} disabled={savingStatic} className="btn-primary py-1.5 px-4 text-sm">{savingStatic ? 'Saving…' : 'Save static meals'}</button>
                  <button onClick={() => { setStaticFlags({ preworkout_static: !!assignment?.preworkout_static, evening_snack_static: !!assignment?.evening_snack_static }); setStaticDirty(false); setStaticError('') }} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Daily totals */}
          {(option1Total.cal > 0 || option2Total.cal > 0 || assignment?.calorie_target) && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Daily total <span className="font-normal text-gray-400">(Option 1)</span>
                </span>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(option1Total.cal)} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option1Total.carb)}g C &middot; {Math.round(option1Total.prot)}g P &middot; {Math.round(option1Total.fat)}g F</p>
                </div>
              </div>
              {targetStatus(option1Total)}

              {option2Subtotal.cal > 0 && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Daily total <span className="font-normal text-gray-400">(Option 2)</span>
                    </span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(option2Total.cal)} kcal</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option2Total.carb)}g C &middot; {Math.round(option2Total.prot)}g P &middot; {Math.round(option2Total.fat)}g F</p>
                    </div>
                  </div>
                  {targetStatus(option2Total)}
                </>
              )}

              {assignment?.calorie_target && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Target</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {assignment.calorie_target} kcal
                    {client.current_carbs ? ` · ${client.current_carbs}g C` : ''}
                    {client.current_protein ? ` · ${client.current_protein}g P` : ''}
                    {client.current_fat ? ` · ${client.current_fat}g F` : ''}
                  </span>
                </div>
              )}

              {suggestion1 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Suggestion (Option 1)</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{suggestion1.text}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{suggestion1.detail}</p>
                </div>
              )}
              {suggestion2 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Suggestion (Option 2)</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{suggestion2.text}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{suggestion2.detail}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Plan history */}
      {pastAssignments.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Plan History</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {pastAssignments.map(p => {
              const start = p.start_date
                ? new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : p.created_at
                  ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
              const end = p.ended_at
                ? new Date(p.ended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Removed'
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {p.plan_group_name || 'Unnamed plan'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{start} → {end}</p>
                  </div>
                  {p.calorie_target && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{p.calorie_target} kcal</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const TRAINING_BLOCKS = [
  { key: 'Block 1', label: 'Block 1' },
  { key: 'Block 2', label: 'Block 2' },
  { key: 'Block 3', label: 'Block 3' },
]
const TRAINING_DAY_ORDER = ['5 Day', '4 Day', '3 Day']

function getProgBlock(name) {
  for (const b of TRAINING_BLOCKS) { if (name?.includes(b.key)) return b.key }
  return null
}
function getProgDays(name) {
  for (const d of TRAINING_DAY_ORDER) { if (name?.startsWith(d)) return d }
  return null
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function stripDayPrefix(name) {
  if (!name) return ''
  for (const d of WEEK_DAYS) {
    if (name === d) return ''
    if (name.startsWith(d + ' ') || name.startsWith(d + '—')) {
      return name.slice(d.length).replace(/^[\s–—\-]+/, '').trim()
    }
  }
  return name
}

function TrainingTab({ client, coachId, onSaved }) {
  const [programs, setPrograms] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [assignedSessions, setAssignedSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ block: '', days: '' })
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [liftOptions, setLiftOptions] = useState([])
  const [topLiftOverride, setTopLiftOverride] = useState([
    client.top_lifts?.[0]?.name || '',
    client.top_lifts?.[1]?.name || '',
    client.top_lifts?.[2]?.name || '',
  ])
  const [savingLifts, setSavingLifts] = useState(false)

  async function load() {
    const [{ data: progs }, { data: asgn }] = await Promise.all([
      supabase.from('training_programs').select('*').eq('coach_id', coachId).order('name'),
      supabase.from('client_training_assignments')
        .select('*, training_programs(name, weeks_total, top_lifts)')
        .eq('client_id', client.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    setPrograms(progs || [])
    setAssignment(asgn || null)

    if (asgn?.program_id) {
      const [{ data: sessions }, { data: exSessions }] = await Promise.all([
        supabase
          .from('training_sessions')
          .select('id, name, workout_id, workouts(id, name)')
          .eq('program_id', asgn.program_id),
        supabase
          .from('training_sessions')
          .select('session_exercises(name)')
          .eq('program_id', asgn.program_id),
      ])
      setAssignedSessions(sessions || [])
      setLiftOptions([...new Set(
        (exSessions || []).flatMap(s => (s.session_exercises || []).map(e => e.name)).filter(Boolean)
      )].sort())
    } else {
      setAssignedSessions([])
      setLiftOptions([])
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  const hasSavedOverride = (client.top_lifts || []).some(l => l?.name)
  const blockTopLifts = (assignment?.training_programs?.top_lifts || []).filter(l => l?.name).map(l => l.name)

  // Keep the fields showing something meaningful even without an override:
  // the client's saved override if there is one, otherwise the block's own
  // defaults — so the coach always sees what will actually be used.
  useEffect(() => {
    if (loading) return
    setTopLiftOverride(hasSavedOverride
      ? [client.top_lifts?.[0]?.name || '', client.top_lifts?.[1]?.name || '', client.top_lifts?.[2]?.name || '']
      : [blockTopLifts[0] || '', blockTopLifts[1] || '', blockTopLifts[2] || '']
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasSavedOverride, JSON.stringify(client.top_lifts), JSON.stringify(blockTopLifts)])

  async function saveTopLifts() {
    setSavingLifts(true)
    await supabase.from('clients').update({
      top_lifts: topLiftOverride.filter(n => n.trim()).map(name => ({ name: name.trim() })),
    }).eq('id', client.id)
    setSavingLifts(false)
    onSaved?.()
  }

  async function revertTopLifts() {
    setSavingLifts(true)
    await supabase.from('clients').update({ top_lifts: [] }).eq('id', client.id)
    setSavingLifts(false)
    onSaved?.()
  }

  const selectedProgram = programs.find(p =>
    p.name?.startsWith(form.days) && p.name?.includes(form.block)
  )
  const availableDays = TRAINING_DAY_ORDER.filter(d =>
    programs.some(p => p.name?.startsWith(d) && p.name?.includes(form.block))
  )

  async function handleAssign(e) {
    e.preventDefault()
    if (!selectedProgram) return
    setSaving(true)
    await supabase.from('client_training_assignments').update({ active: false }).eq('client_id', client.id)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('client_training_assignments').insert({
      client_id: client.id,
      coach_id: coachId,
      program_id: selectedProgram.id,
      program_name: selectedProgram.name,
      active: true,
      start_date: today,
    })

    // Auto-populate client's weekly schedule from the assigned program.
    // Only replaces 'workout' type items — cardio, HIIT, and rest entries are preserved.
    await supabase.from('client_schedule_items')
      .delete().eq('client_id', client.id).eq('item_type', 'workout')
    const { data: sessions } = await supabase
      .from('training_sessions').select('id, name, workout_id')
      .eq('program_id', selectedProgram.id).eq('week_number', 1)
    const seenDays = new Set()
    const toInsert = []
    for (const s of (sessions || [])) {
      const day = WEEK_DAYS.find(d => s.name === d || s.name.startsWith(d + ' ') || s.name.startsWith(d + '—') || s.name.startsWith(d + ' —'))
      if (!day || seenDays.has(day)) continue
      seenDays.add(day)
      const label = s.name === day ? day : s.name.slice(day.length).replace(/^[\s–—\-]+/, '').trim() || day
      toInsert.push({ client_id: client.id, coach_id: coachId, day_of_week: day, item_type: 'workout', workout_id: s.workout_id || null, custom_label: label, order_index: 0 })
    }
    if (toInsert.length > 0) await supabase.from('client_schedule_items').insert(toInsert)

    setSaving(false)
    setShowForm(false)
    setReloadKey(k => k + 1)
    load()
  }

  async function handleRemove() {
    if (!confirm('Remove training assignment?')) return
    await supabase.from('client_training_assignments').update({ active: false }).eq('client_id', client.id)
    load()
  }


  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  const prog = assignment?.training_programs

  return (
    <div className="space-y-5 max-w-2xl">
      <ClientWeeklyPlan key={reloadKey} clientId={client.id} coachId={coachId} assignment={assignment} />

      <div className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Top 3 Lifts</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Client will log weight and reps for these in their weekly check-in.</p>
        </div>

        {!assignment ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No training block assigned yet — set lifts for this client below, or assign a training block further down that has them configured.
          </p>
        ) : blockTopLifts.length > 0 ? (
          topLiftOverride.some(n => !n) && (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40 px-3 py-2.5">
              <p className="text-xs text-brand-700 dark:text-brand-300">
                Pulled automatically from the assigned training block: <span className="font-medium">{blockTopLifts.join(', ')}</span>.
                {hasSavedOverride ? ' Overridden below for this client.' : ' Shown below — change any of them if you want something different for this client.'}
              </p>
            </div>
          )
        ) : (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 px-3 py-2.5 space-y-1.5">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This client is assigned to <span className="font-medium">{assignment.program_name || prog?.name}</span>, and that exact block has no top lifts saved on it — set them just for this client below, or fix it at the source:
            </p>
            <Link to={`/coach/training/${assignment.program_id}`} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
              Open "{assignment.program_name || prog?.name}" to set its top lifts →
            </Link>
          </div>
        )}
        {[0, 1, 2].map(i => (
          <div key={i}>
            <label className="label">Lift {i + 1} {blockTopLifts.length > 0 && <span className="text-gray-400 font-normal">(override)</span>}</label>
            {liftOptions.length > 0 ? (
              <select
                className="input"
                value={topLiftOverride[i]}
                onChange={e => setTopLiftOverride(prev => prev.map((v, j) => j === i ? e.target.value : v))}
              >
                <option value="">— Select exercise —</option>
                {liftOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                type="text"
                value={topLiftOverride[i]}
                onChange={e => setTopLiftOverride(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                placeholder={['e.g. Squat', 'e.g. Bench Press', 'e.g. Deadlift'][i]}
              />
            )}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button type="button" onClick={saveTopLifts} disabled={savingLifts} className="btn-primary py-1.5 px-4 text-sm">
            {savingLifts ? 'Saving…' : 'Save'}
          </button>
          {hasSavedOverride && (
            <button
              type="button"
              onClick={revertTopLifts}
              disabled={savingLifts}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
            >
              Revert to the training block's original lifts
            </button>
          )}
        </div>
      </div>

      {!assignment && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">No training programme assigned.</p>
          {programs.length === 0
            ? <p className="text-xs text-gray-400">Create a training programme from the Training page first.</p>
            : <button onClick={() => setShowForm(true)} className="btn-primary">Assign Programme</button>}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAssign} className="card space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{assignment ? 'Change Programme' : 'Assign Training Programme'}</h3>
          <div>
            <label className="label">Block</label>
            <select className="input" required value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value, days: '' }))}>
              <option value="">Select a block…</option>
              {TRAINING_BLOCKS.filter(b => programs.some(p => p.name?.includes(b.key))).map(b => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </div>
          {form.block && (
            <div>
              <label className="label">Training days per week</label>
              <select className="input" required value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))}>
                <option value="">Select training days…</option>
                {availableDays.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !selectedProgram} className="btn-primary">{saving ? 'Saving…' : 'Assign'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {assignment && prog && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.program_name || prog.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{prog.weeks_total ?? 12}-week block · Started</p>
                <input
                  type="date"
                  defaultValue={assignment.start_date || assignment.created_at.split('T')[0]}
                  className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-brand-500 cursor-pointer"
                  onChange={async e => {
                    const val = e.target.value
                    if (!val) return
                    await supabase.from('client_training_assignments').update({ start_date: val }).eq('id', assignment.id)
                    setAssignment(prev => ({ ...prev, start_date: val }))
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => { setForm({ block: getProgBlock(assignment.program_name) || '', days: getProgDays(assignment.program_name) || '' }); setShowForm(true) }} className="text-xs text-brand-500 hover:text-brand-700 font-medium">Change</button>
              <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
            </div>
          </div>

          {(() => {
            const blockTotal = prog.weeks_total ?? 12
            const blockStart = assignment.start_date || assignment.created_at.split('T')[0]
            const weeksElapsed = Math.floor((Date.now() - new Date(blockStart).getTime()) / (7 * 24 * 60 * 60 * 1000))
            if (weeksElapsed < blockTotal) return null
            return (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Block complete — time to change</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">This client has completed the {blockTotal}-week block. Assign a new programme when ready.</p>
              </div>
            )
          })()}

          {/* Mon–Sun template from the assigned programme */}
          {assignedSessions.length > 0 && (() => {
            const byDay = {}
            for (const s of assignedSessions) {
              const day = WEEK_DAYS.find(d => s.name === d || s.name.startsWith(d + ' ') || s.name.startsWith(d + '—'))
              if (day) byDay[day] = s
            }
            return (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Programme template</p>
                {WEEK_DAYS.map(day => {
                  const s = byDay[day]
                  const label = stripDayPrefix(s?.workouts?.name)
                    || (s ? s.name.replace(new RegExp(`^${day}[\\s\\u2013\\u2014\\-]+`), '').trim() || s.name : null)
                  return (
                    <div key={day} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                      s
                        ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30'
                        : 'bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800'
                    }`}>
                      <span className={`text-xs font-bold w-20 flex-shrink-0 ${s ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>{day}</span>
                      {s
                        ? <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
                        : <span className="text-xs text-gray-300 dark:text-gray-700 italic">Rest</span>
                      }
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

const CHECKIN_PHOTO_ANGLES = [
  { key: 'front', label: 'Front' },
  { key: 'back',  label: 'Back' },
  { key: 'left',  label: 'Left side' },
  { key: 'right', label: 'Right side' },
]

function CheckinsTab({ clientId, collectMeasurements }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  // Map of weekStartISO → { ticked, total, tasksWithNotes }
  const [weekSummaries, setWeekSummaries] = useState({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', clientId)
        .order('week_number', { ascending: false })
      setCheckins(data || [])
      setLoading(false)

      // Fetch task data for all check-in weeks in one query
      if (data && data.length > 0) {
        const dates = data.map(c => c.submitted_at || c.updated_at).filter(Boolean)
        if (dates.length === 0) return
        const weekStarts = [...new Set(dates.map(d => _weekStartFor(d)))]
        const allDates = weekStarts.flatMap(ws => {
          const we = _weekEndFor(ws)
          return [ws, we]
        })
        const earliest = allDates.reduce((a, b) => a < b ? a : b)
        const latest   = allDates.reduce((a, b) => a > b ? a : b)

        const { data: taskRows } = await supabase
          .from('client_daily_tasks')
          .select('task_date, completed, notes, task_type, task_key, label, is_private')
          .eq('client_id', clientId)
          .gte('task_date', earliest)
          .lte('task_date', latest)

        if (!taskRows) return
        const summaries = {}
        weekStarts.forEach(ws => {
          const we = _weekEndFor(ws)
          const rows = taskRows.filter(r => r.task_date >= ws && r.task_date <= we)
          summaries[ws] = {
            ticked: rows.filter(r => r.completed).length,
            total:  rows.length,
            tasksWithNotes: rows.filter(r => r.notes?.trim()),
          }
        })
        setWeekSummaries(summaries)
      }
    }
    load()
  }, [clientId])

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // checkins[0] = most recent, checkins[last] = oldest
  function prevCheckin(i) { return checkins[i + 1] || null }

  function weightDelta(c, p) {
    if (c.weight_kg == null || p?.weight_kg == null) return null
    return Math.round((parseFloat(c.weight_kg) - parseFloat(p.weight_kg)) * 10) / 10
  }

  function liftDelta(lift, p) {
    const prev = p?.lift_results?.find(l => l?.name === lift?.name)
    if (!prev || lift?.weight_kg == null || prev?.weight_kg == null) return null
    return {
      kg: Math.round((parseFloat(lift.weight_kg) - parseFloat(prev.weight_kg)) * 10) / 10,
      reps: (parseInt(lift.reps) || 0) - (parseInt(prev.reps) || 0),
    }
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  if (checkins.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No check-ins submitted yet.</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Check-ins appear here once the client submits their weekly form.</p>
      </div>
    )
  }

  // Photo comparison: newest, previous, first (all distinct)
  const withPhotos = checkins.filter(c => c.progress_photos && Object.values(c.progress_photos).some(Boolean))
  const newestP = withPhotos[0]
  const prevP = withPhotos[1]
  const firstP = withPhotos[withPhotos.length - 1]
  const compAngles = ['front', 'back', 'left', 'right'].filter(a => newestP?.progress_photos?.[a])
  const showComparison = newestP && firstP && newestP.id !== firstP.id && compAngles.length > 0

  // Ascending for the history table
  const ascending = [...checkins].reverse()

  return (
    <div className="space-y-6 max-w-3xl">
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Weight / progress history table ── */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progress History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Week', 'Date', 'Weight', 'Change', 'Energy', 'Sleep', 'Food', 'Gym'].map(h => (
                  <th key={h} className="text-left pb-2.5 pr-4 text-xs text-gray-400 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {ascending.map((c, i) => {
                const p = ascending[i - 1] || null
                const delta = weightDelta(c, p)
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">Wk {c.week_number}</td>
                    <td className="py-2.5 pr-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.updated_at || c.submitted_at)}</td>
                    <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                      {c.weight_kg != null ? `${c.weight_kg} kg` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">
                      {delta !== null ? (
                        <span className={`font-semibold text-xs ${delta < 0 ? 'text-green-600 dark:text-green-400' : delta > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                          {delta > 0 ? '+' : ''}{delta} kg
                        </span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {c.energy_level != null
                        ? <span className={`font-semibold text-xs ${checkinRatingColor(c.energy_level)}`}>{c.energy_level}/5</span>
                        : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {c.sleep_quality != null
                        ? <span className={`font-semibold text-xs ${checkinRatingColor(c.sleep_quality)}`}>{c.sleep_quality}/5</span>
                        : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {c.food_adherence != null
                        ? <span className={`font-semibold text-xs ${checkinRatingColor(c.food_adherence)}`}>{c.food_adherence}/5</span>
                        : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    <td className="py-2.5">
                      {c.gym_adherence != null
                        ? <span className={`font-semibold text-xs ${checkinRatingColor(c.gym_adherence)}`}>{c.gym_adherence}/5</span>
                        : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Photo comparison: first vs current per angle ── */}
      {showComparison && (
        <div className="card space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Photo Comparison</h3>
            <p className="text-xs text-gray-400 mt-0.5">Week {firstP.week_number} → Week {newestP.week_number}</p>
          </div>
          {compAngles.map(angle => {
            const firstUrl = firstP.progress_photos[angle]
            const nowUrl = newestP.progress_photos[angle]
            return (
              <div key={angle}>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 capitalize">{angle}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: `First · Wk ${firstP.week_number}`, url: firstUrl },
                    { label: `Now · Wk ${newestP.week_number}`, url: nowUrl },
                  ].map(col => (
                    <div key={col.label} className="space-y-1">
                      {col.url ? (
                        <button
                          onClick={() => setLightbox(col.url)}
                          className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity block"
                        >
                          <img src={col.url} alt={col.label} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-full aspect-[3/4] rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                      <p className="text-xs text-center text-gray-400 dark:text-gray-500">{col.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Individual check-in cards ── */}
      {checkins.map((c, i) => {
        const p = prevCheckin(i)
        const wDelta = weightDelta(c, p)
        return (
          <div key={c.id} className="card space-y-4">
            {/* Header + weight delta */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Week {c.week_number}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(c.updated_at || c.submitted_at)}</p>
              </div>
              {wDelta !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  wDelta < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : wDelta > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                }`}>
                  {wDelta > 0 ? '↑ +' : wDelta < 0 ? '↓ ' : ''}{wDelta} kg vs last week
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {c.weight_kg != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{c.weight_kg} <span className="text-sm font-normal text-gray-500">kg</span></p>
                </div>
              )}
              {collectMeasurements && c.waist_cm != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Waist</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{c.waist_cm} <span className="text-sm font-normal text-gray-500">cm</span></p>
                </div>
              )}
              {collectMeasurements && c.hips_cm != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hips</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{c.hips_cm} <span className="text-sm font-normal text-gray-500">cm</span></p>
                </div>
              )}
              {c.energy_level != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Energy</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{c.energy_level}<span className="text-xs font-normal text-gray-400">/5</span> <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{CHECKIN_RATING_LABELS.energy_level[c.energy_level]}</span></p>
                </div>
              )}
              {c.sleep_quality != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sleep</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{c.sleep_quality}<span className="text-xs font-normal text-gray-400">/5</span> <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{CHECKIN_RATING_LABELS.sleep_quality[c.sleep_quality]}</span></p>
                </div>
              )}
              {c.food_adherence != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Food adherence</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{c.food_adherence}<span className="text-xs font-normal text-gray-400">/5</span> <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{CHECKIN_RATING_LABELS.food_adherence[c.food_adherence]}</span></p>
                </div>
              )}
              {c.gym_adherence != null && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gym adherence</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{c.gym_adherence}<span className="text-xs font-normal text-gray-400">/5</span> <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{CHECKIN_RATING_LABELS.gym_adherence[c.gym_adherence]}</span></p>
                </div>
              )}
            </div>

            {/* Lifts with week-on-week deltas */}
            {c.lift_results?.filter(l => l?.name).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Lifts</p>
                <div className="grid grid-cols-3 gap-3">
                  {c.lift_results.filter(l => l?.name).map((lift, li) => {
                    const d = liftDelta(lift, p)
                    return (
                      <div key={li} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{lift.name}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lift.weight_kg ? `${lift.weight_kg} kg` : '—'}
                          {lift.reps ? <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">× {lift.reps}</span> : null}
                        </p>
                        {d !== null && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {d.kg !== 0 && (
                              <span className={`text-xs font-semibold ${d.kg > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {d.kg > 0 ? '↑ +' : '↓ '}{d.kg} kg
                              </span>
                            )}
                            {d.reps !== 0 && (
                              <span className={`text-xs font-semibold ${d.reps > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {d.reps > 0 ? '↑ +' : '↓ '}{d.reps} reps
                              </span>
                            )}
                            {d.kg === 0 && d.reps === 0 && (
                              <span className="text-xs text-gray-400">same</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Photos */}
            {c.progress_photos && Object.values(c.progress_photos).some(Boolean) && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Photos</p>
                <div className="grid grid-cols-4 gap-2">
                  {CHECKIN_PHOTO_ANGLES.map(angle => c.progress_photos[angle.key] && (
                    <div key={angle.key} className="flex flex-col gap-1">
                      <button
                        onClick={() => setLightbox(c.progress_photos[angle.key])}
                        className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                      >
                        <img src={c.progress_photos[angle.key]} alt={angle.label} className="w-full h-full object-cover" />
                      </button>
                      <p className="text-xs text-center text-gray-400 dark:text-gray-500">{angle.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {c.notes && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{c.notes}</p>
              </div>
            )}

            {/* ── Weekly task summary ── */}
            {(() => {
              const ws = _weekStartFor(c.submitted_at || c.updated_at)
              const summary = weekSummaries[ws]
              if (!summary) return null
              const pct = summary.total > 0 ? Math.round((summary.ticked / summary.total) * 100) : 0
              return (
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Daily Plan — Week Summary</p>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{summary.ticked} of {summary.total} tasks ticked off</span>
                        <span className={`font-semibold ${pct >= 80 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-400 dark:bg-green-500' : pct >= 50 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-red-400 dark:bg-red-500'}`}
                          style={{ width:`${pct}%` }}/>
                      </div>
                    </div>
                    {summary.tasksWithNotes.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Comments</p>
                        {summary.tasksWithNotes.map((t, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.completed ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}/>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-snug">
                                {t.task_type === 'system'
                                  ? (t.task_key?.replace(/_\d+$/, '') || t.task_key)
                                  : (t.label || 'Task')}
                                <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-600 font-normal">
                                  {new Date(t.task_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">"{t.notes}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {c.coach_response && (
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Your response</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.coach_response}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CoachClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    return tab && TABS.includes(tab) ? tab : 'Overview'
  })

  async function loadClient() {
    const { data, error: err } = await supabase.from('clients').select(`
      id, coach_id, profile_id, goal, current_calories, current_protein,
      current_carbs, current_fat, steps_target, water_target_litres, sleep_target_hours,
      start_date, access_weeks, access_expires_at,
      is_active, is_paused, notes, created_at, tags, collect_measurements, top_lifts,
      allergies, dislikes, phone, date_of_birth, height_cm, intake_form,
      profiles!clients_profile_id_fkey(full_name, email)
    `).eq('id', clientId).eq('coach_id', profile.id).single()
    if (err || !data) setError('Client not found or you do not have access.')
    else setClient(data)
    setLoading(false)
  }

  useEffect(() => { loadClient() }, [clientId])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />
  if (error) return (
    <div className="p-6">
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate('/coach/clients')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Clients
        </button>
        <div className="flex items-center gap-3 sm:ml-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="font-semibold text-brand-700 dark:text-brand-400 text-sm">{client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.profiles?.full_name || '—'}</h1>
              <StatusBadge client={client} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{client.profiles?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 -mx-1 px-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Overview'    && <OverviewTab client={client} onSaved={loadClient} />}
        {activeTab === 'Meal Plan'  && <MealPlanTab client={client} coachId={profile.id} />}
        {activeTab === 'Training'   && <TrainingTab client={client} coachId={profile.id} onSaved={loadClient} />}
        {activeTab === 'Daily Plan' && <DailyPlanTab client={client} />}
        {activeTab === 'Check-ins'  && <CheckinsTab clientId={client.id} collectMeasurements={client.collect_measurements} />}
        {activeTab === 'Weight'     && <WeightTab clientId={client.id} />}
        {activeTab === 'Measurements' && <MeasurementsTab clientId={client.id} />}
        {activeTab === 'Photos'     && <PhotosTab clientId={client.id} />}
        {activeTab === 'Notes'      && <NotesTab client={client} />}
      </div>
    </div>
  )
}
