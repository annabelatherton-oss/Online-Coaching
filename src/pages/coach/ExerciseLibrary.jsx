import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const MUSCLE_GROUPS = ['Glutes', 'Quads', 'Hamstrings', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Full Body', 'Adductors', 'Abductors', 'Hip Flexors']
const EQUIPMENT_LIST = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'EZ Bar', 'Straight Bar', 'Resistance Band', 'Bodyweight', 'Kettlebell', 'Pull-up Bar', 'Trap Bar', 'Landmine', 'Battle Ropes', 'Sled', 'TRX', 'Medicine Ball']
const EXERCISE_TYPES = ['Compound', 'Isolation']

// Standalone equipment-specific coaching cue, appended to the generic cue.
const EQUIPMENT_CUE_PHRASES = {
  'Barbell': 'Keep your grip and stance consistent every set so you can track progress properly.',
  'Dumbbell': "Move both sides evenly — don't let one side rush ahead of the other.",
  'Cable': "Keep tension on the muscle throughout the set — don't let the weight stack rest between reps.",
  'Machine': "Adjust the seat or pad so the joint lines up with the machine's pivot point before you start.",
  'Smith Machine': 'Use the fixed bar path to focus on the muscle rather than balancing the bar.',
  'EZ Bar': 'Grip the angled part of the bar for the most comfortable wrist position.',
  'Straight Bar': 'Keep your grip even on both sides of the bar.',
  'Resistance Band': "Keep tension on the band throughout — don't let it go slack at any point.",
  'Bodyweight': 'Control the tempo rather than rushing through reps.',
  'Kettlebell': 'Keep your core braced throughout to control the momentum of the bell.',
  'Pull-up Bar': 'Start each rep from a full, controlled hang.',
  'Trap Bar': 'Keep the bar close and your back flat throughout the lift.',
  'Landmine': "Keep the movement smooth through the bar's natural arc.",
  'Battle Ropes': 'Keep your core braced and maintain a steady rhythm throughout.',
  'Sled': 'Keep your steps short and drive through the whole foot.',
  'TRX': 'Keep your body rigid and control the instability rather than fighting it.',
  'Medicine Ball': 'Move with control on the set-up, then commit fully on the explosive part.',
  'Pec Deck': 'Keep your back flat against the pad throughout the set.',
}

function articleFor(word) {
  return /^[aeiou]/i.test(word || '') ? 'an' : 'a'
}

// Builds sensible default coaching cues for a variation that doesn't have
// hand-written ones yet — tailored to the exact variation (equipment) and
// muscle focus, so nothing needs hand-writing for the whole library.
// Leads with the exact variation (e.g. "Bicep Curl with a barbell is…") and
// avoids implying a single "target" muscle when more than one is worked.
function generateCoachingCues(name, equipment, primaryMuscle, secondaryMuscles, exerciseType) {
  const typeText = exerciseType === 'Isolation'
    ? 'an isolation exercise that focuses tension on one muscle group with minimal help from surrounding muscles'
    : 'a compound exercise that works multiple joints and muscle groups together'
  const opening = equipment
    ? `${articleFor(name).charAt(0).toUpperCase()}${articleFor(name).slice(1)} ${name} with ${articleFor(equipment)} ${equipment.toLowerCase()} is ${typeText}.`
    : `${articleFor(name).charAt(0).toUpperCase()}${articleFor(name).slice(1)} ${name} is ${typeText}.`
  const muscles = [primaryMuscle, ...(secondaryMuscles || [])].filter(Boolean)
  const muscleText = muscles.length > 1
    ? ` It works your ${muscles.slice(0, -1).map(m => m.toLowerCase()).join(', ')} and ${muscles[muscles.length - 1].toLowerCase()}.`
    : muscles.length === 1
      ? ` It targets your ${muscles[0].toLowerCase()}.`
      : ''
  const formCue = exerciseType === 'Isolation'
    ? ' Move through a full range of motion and keep the tension on the muscle throughout — avoid using momentum to move the weight.'
    : ' Brace your core and keep good form throughout the whole set, moving through a full range of motion.'
  const equipmentCue = equipment && EQUIPMENT_CUE_PHRASES[equipment] ? ` ${EQUIPMENT_CUE_PHRASES[equipment]}` : ''
  return `${opening}${muscleText}${formCue}${equipmentCue} Control the weight on the way down as well as the way up.`
}
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

const MUSCLE_COLOURS = {
  Glutes: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Quads: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Hamstrings: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Back: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Chest: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Shoulders: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Biceps: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Triceps: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Core: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Calves: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

const EMPTY_FORM = { name: '', primary_muscle: '', secondary_muscles: [], exercise_type: '', difficulty: '', tags: [], notes: '' }
const EMPTY_VARIATION = { equipment: '', video_url: '', instructions: '', coaching_cues: '', tempo: '', default_rest_seconds: '' }

function Badge({ label, colourClass }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colourClass || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{label}</span>
}

function ExerciseModal({ exercise, allExercises, onSave, onClose }) {
  const [form, setForm] = useState(exercise ? {
    ...exercise,
    secondary_muscles: exercise.secondary_muscles || [],
    tags: exercise.tags || [],
  } : { ...EMPTY_FORM })
  const [variations, setVariations] = useState([{ ...EMPTY_VARIATION }])
  const [activeTab, setActiveTab] = useState(0)
  const [loadingVariations, setLoadingVariations] = useState(!!exercise)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [secInput, setSecInput] = useState('')
  const [alternativeIds, setAlternativeIds] = useState([])
  const [altInput, setAltInput] = useState('')

  useEffect(() => {
    if (!exercise) return
    supabase.from('exercise_variations').select('*').eq('exercise_id', exercise.id).order('order_index').then(({ data }) => {
      setVariations(data && data.length > 0 ? data.map(v => ({ ...v, default_rest_seconds: v.default_rest_seconds ?? '' })) : [{ ...EMPTY_VARIATION }])
      setLoadingVariations(false)
    })
    supabase.from('exercise_alternatives').select('alternative_exercise_id').eq('exercise_id', exercise.id).order('order_index').then(({ data }) => {
      setAlternativeIds((data || []).map(r => r.alternative_exercise_id))
    })
  }, [exercise])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function setVariation(idx, field, value) {
    setVariations(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v))
  }
  function addVariation() {
    setVariations(prev => [...prev, { ...EMPTY_VARIATION }])
    setActiveTab(variations.length)
  }
  function removeVariation(idx) {
    if (variations.length <= 1) return
    setVariations(prev => prev.filter((_, i) => i !== idx))
    setActiveTab(t => Math.max(0, t >= idx ? t - 1 : t))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      name: form.name.trim(),
    }, variations.map((v, i) => ({
      equipment: v.equipment || null,
      video_url: v.video_url || null,
      instructions: v.instructions || null,
      coaching_cues: v.coaching_cues || null,
      tempo: v.tempo || null,
      default_rest_seconds: v.default_rest_seconds !== '' && v.default_rest_seconds != null ? parseInt(v.default_rest_seconds) : null,
      order_index: i,
    })), alternativeIds)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{exercise ? 'Edit exercise' : 'Add exercise'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Exercise name *</label>
            <input className="input w-full" placeholder="e.g. Hip Thrust" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Primary muscle</label>
              <select className="input w-full" value={form.primary_muscle} onChange={e => set('primary_muscle', e.target.value)}>
                <option value="">Select…</option>
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Exercise type</label>
              <select className="input w-full" value={form.exercise_type} onChange={e => set('exercise_type', e.target.value)}>
                <option value="">Select…</option>
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Difficulty</label>
              <select className="input w-full" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                <option value="">Select…</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Secondary muscles</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.secondary_muscles || []).map(m => (
                <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {m}
                  <button onClick={() => set('secondary_muscles', form.secondary_muscles.filter(x => x !== m))} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="input flex-1 text-sm py-1.5" value={secInput} onChange={e => setSecInput(e.target.value)}>
                <option value="">Add secondary muscle…</option>
                {MUSCLE_GROUPS.filter(m => !form.secondary_muscles.includes(m)).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={() => { if (secInput) { set('secondary_muscles', [...form.secondary_muscles, secInput]); setSecInput('') } }}
                className="btn-primary py-1.5 px-3 text-sm flex-shrink-0">Add</button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Variations</label>
              <button type="button" onClick={addVariation} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">+ Add variation</button>
            </div>

            {loadingVariations ? (
              <div className="text-sm text-gray-400 py-4">Loading variations…</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {variations.map((v, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === i
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <button type="button" onClick={() => setActiveTab(i)}>
                        {v.equipment || `Variation ${i + 1}`}
                      </button>
                      {variations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariation(i)}
                          title="Delete this variation"
                          className={`leading-none px-0.5 ${activeTab === i ? 'text-brand-100 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Equipment *</label>
                    <select className="input w-full" value={variations[activeTab]?.equipment || ''} onChange={e => setVariation(activeTab, 'equipment', e.target.value)}>
                      <option value="">Select…</option>
                      {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Default rest (seconds)</label>
                      <input type="number" min={0} className="input w-full" placeholder="e.g. 90" value={variations[activeTab]?.default_rest_seconds ?? ''} onChange={e => setVariation(activeTab, 'default_rest_seconds', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tempo</label>
                      <input className="input w-full" placeholder="e.g. 3010" value={variations[activeTab]?.tempo || ''} onChange={e => setVariation(activeTab, 'tempo', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Video URL (optional)</label>
                    <input type="url" className="input w-full" placeholder="https://…" value={variations[activeTab]?.video_url || ''} onChange={e => setVariation(activeTab, 'video_url', e.target.value)} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Coaching cues</label>
                      <button
                        type="button"
                        onClick={() => setVariation(activeTab, 'coaching_cues', generateCoachingCues(
                          form.name, variations[activeTab]?.equipment, form.primary_muscle, form.secondary_muscles, form.exercise_type
                        ))}
                        className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                      >
                        Generate
                      </button>
                    </div>
                    <textarea rows={2} className="input w-full resize-none" placeholder="Key cues for the client…" value={variations[activeTab]?.coaching_cues || ''} onChange={e => setVariation(activeTab, 'coaching_cues', e.target.value)} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Instructions</label>
                    <textarea rows={3} className="input w-full resize-none" placeholder="Step-by-step instructions…" value={variations[activeTab]?.instructions || ''} onChange={e => setVariation(activeTab, 'instructions', e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Alternative exercises</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Shown to clients as a swap option if this exercise's equipment isn't free — for a different movement, not just a different variation.</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {alternativeIds.map(id => {
                const alt = allExercises?.find(e => e.id === id)
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {alt?.name || 'Unknown'}
                    <button onClick={() => setAlternativeIds(prev => prev.filter(x => x !== id))} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                )
              })}
            </div>
            <div className="flex gap-2">
              <select className="input flex-1 text-sm py-1.5" value={altInput} onChange={e => setAltInput(e.target.value)}>
                <option value="">Add alternative…</option>
                {(allExercises || [])
                  .filter(e => e.id !== exercise?.id && !alternativeIds.includes(e.id))
                  .map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button onClick={() => { if (altInput) { setAlternativeIds(prev => [...prev, altInput]); setAltInput('') } }}
                className="btn-primary py-1.5 px-3 text-sm flex-shrink-0">Add</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notes</label>
            <textarea rows={2} className="input w-full resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.tags || []).map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                  {t} <button onClick={() => set('tags', form.tags.filter(x => x !== t))} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm py-1.5" placeholder="Add tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput('') } }} />
              <button onClick={() => { if (tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput('') } }}
                className="btn-primary py-1.5 px-3 text-sm flex-shrink-0">Add</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary py-2 px-5 text-sm">
            {saving ? 'Saving…' : exercise ? 'Save changes' : 'Add exercise'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExerciseLibrary() {
  const { profile } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')
  const [filterEquipment, setFilterEquipment] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | exercise object
  const [filling, setFilling] = useState(false)
  const [variationsByExercise, setVariationsByExercise] = useState({})
  const [deleteCheck, setDeleteCheck] = useState(null) // null | { ex, loading } | { ex, sessions, workouts }
  const [replacementId, setReplacementId] = useState('')

  async function load() {
    const { data } = await supabase.from('exercises').select('*').eq('coach_id', profile.id).eq('is_archived', false).order('name')
    setExercises(data || [])
    const ids = (data || []).map(e => e.id)
    if (ids.length > 0) {
      const { data: vars } = await supabase.from('exercise_variations').select('*').in('exercise_id', ids).order('order_index')
      const grouped = {}
      ;(vars || []).forEach(v => { (grouped[v.exercise_id] ||= []).push(v) })
      setVariationsByExercise(grouped)
    } else {
      setVariationsByExercise({})
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = exercises.filter(ex => {
    if (filterMuscle && ex.primary_muscle !== filterMuscle) return false
    if (filterEquipment && !(variationsByExercise[ex.id] || []).some(v => v.equipment === filterEquipment)) return false
    if (filterType && ex.exercise_type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return ex.name.toLowerCase().includes(q) || (ex.primary_muscle || '').toLowerCase().includes(q)
    }
    return true
  })

  async function handleSave(form, variations, alternativeIds) {
    let exerciseId = modal === 'new' ? null : modal.id
    if (modal === 'new') {
      const { data } = await supabase.from('exercises').insert({ ...form, coach_id: profile.id }).select('id').single()
      exerciseId = data?.id
    } else {
      await supabase.from('exercises').update(form).eq('id', modal.id)
    }
    if (exerciseId) {
      await supabase.from('exercise_variations').delete().eq('exercise_id', exerciseId)
      await supabase.from('exercise_variations').insert(variations.map(v => ({ ...v, exercise_id: exerciseId })))
      await supabase.from('exercise_alternatives').delete().eq('exercise_id', exerciseId)
      if (alternativeIds?.length > 0) {
        await supabase.from('exercise_alternatives').insert(
          alternativeIds.map((id, i) => ({ exercise_id: exerciseId, alternative_exercise_id: id, order_index: i }))
        )
      }
    }
    setModal(null)
    load()
  }

  async function handleArchive(ex) {
    if (!confirm(`Archive "${ex.name}"?`)) return
    await supabase.from('exercises').update({ is_archived: true }).eq('id', ex.id)
    load()
  }

  async function handleDelete(ex) {
    setReplacementId('')
    setDeleteCheck({ ex, loading: true })

    // Only check the real exercise_id link back to this card — matching by name
    // alone would flag coincidental same-named text that was never actually this
    // exercise.
    const [{ data: workoutRows }, { data: sessionRows }] = await Promise.all([
      supabase.from('workout_exercises').select('id, name, workouts(name)').eq('exercise_id', ex.id),
      supabase.from('session_exercises').select('id, name, training_sessions(name, training_programs(name))').eq('exercise_id', ex.id),
    ])

    const workouts = (workoutRows || [])
      .filter(r => r.workouts)
      .map(r => ({ workout: r.workouts.name, name: r.name }))

    const sessions = (sessionRows || [])
      .filter(r => r.training_sessions)
      .map(r => ({ programme: r.training_sessions.training_programs?.name || 'Untitled programme', session: r.training_sessions.name, name: r.name }))

    setDeleteCheck({ ex, workouts, sessions })
  }

  async function confirmDelete() {
    if (!deleteCheck) return
    await supabase.from('exercises').delete().eq('id', deleteCheck.ex.id)
    setDeleteCheck(null)
    load()
  }

  // One-off action: fills in default coaching cues for every variation that
  // doesn't have any yet, so nothing needs hand-writing for the whole library.
  // Never touches a variation that already has coaching cues (coach edits stay).
  async function fillMissingCoachingCues() {
    setFilling(true)
    const updates = []
    for (const ex of exercises) {
      for (const v of variationsByExercise[ex.id] || []) {
        if (v.coaching_cues) continue
        updates.push({ id: v.id, coaching_cues: generateCoachingCues(ex.name, v.equipment, ex.primary_muscle, ex.secondary_muscles, ex.exercise_type) })
      }
    }
    await Promise.all(updates.map(u => supabase.from('exercise_variations').update({ coaching_cues: u.coaching_cues }).eq('id', u.id)))
    await load()
    setFilling(false)
  }

  async function replaceAndDelete(replacement) {
    if (!deleteCheck || !replacement) return
    setDeleteCheck(dc => ({ ...dc, replacing: true }))
    await supabase.from('workout_exercises').update({ name: replacement.name, exercise_id: replacement.id }).eq('exercise_id', deleteCheck.ex.id)
    await supabase.from('session_exercises').update({ name: replacement.name, exercise_id: replacement.id }).eq('exercise_id', deleteCheck.ex.id)
    await supabase.from('exercises').delete().eq('id', deleteCheck.ex.id)
    setDeleteCheck(null)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exercise Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fillMissingCoachingCues} disabled={filling}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {filling ? 'Filling…' : 'Fill missing coaching cues'}
          </button>
          <button onClick={() => setModal('new')} className="btn-primary py-1.5 px-4 text-sm">
            + Add exercise
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          className="input text-sm py-1.5 w-52"
          placeholder="Search exercises…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input text-sm py-1.5" value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)}>
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input text-sm py-1.5" value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)}>
          <option value="">All equipment</option>
          {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input text-sm py-1.5" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterMuscle || filterEquipment || filterType) && (
          <button onClick={() => { setSearch(''); setFilterMuscle(''); setFilterEquipment(''); setFilterType('') }}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Clear</button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-16">
          {exercises.length === 0 ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Library is empty</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Initialize with common exercises" to pre-populate with 80+ exercises, or add your own.</p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No exercises match your filters.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ex => (
          <div key={ex.id} className="card hover:border-brand-300 dark:hover:border-brand-700 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{ex.name}</p>
                {(variationsByExercise[ex.id] || []).some(v => v.equipment) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {(variationsByExercise[ex.id] || []).map(v => v.equipment).filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {ex.primary_muscle && (
                    <Badge label={ex.primary_muscle} colourClass={MUSCLE_COLOURS[ex.primary_muscle]} />
                  )}
                  {ex.exercise_type && (
                    <Badge label={ex.exercise_type} colourClass="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" />
                  )}
                  {ex.difficulty && (
                    <Badge label={ex.difficulty} colourClass={
                      ex.difficulty === 'Advanced' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      ex.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    } />
                  )}
                </div>
                {(variationsByExercise[ex.id] || []).find(v => v.coaching_cues)?.coaching_cues && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {(variationsByExercise[ex.id] || []).find(v => v.coaching_cues).coaching_cues}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => setModal(ex)} className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 px-1.5 py-1">Edit</button>
                <button onClick={() => handleArchive(ex)} className="text-xs text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 px-1.5 py-1">Archive</button>
                <button onClick={() => handleDelete(ex)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ExerciseModal
          exercise={modal === 'new' ? null : modal}
          allExercises={exercises}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteCheck(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Delete "{deleteCheck.ex.name}"?</h2>
            {deleteCheck.loading ? (
              <p className="text-sm text-gray-400 py-4">Checking where it's used…</p>
            ) : (deleteCheck.workouts.length === 0 && deleteCheck.sessions.length === 0) ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Not selected in any workout or training block — safe to delete.</p>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  This exact card is selected in {deleteCheck.workouts.length + deleteCheck.sessions.length} place{deleteCheck.workouts.length + deleteCheck.sessions.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 max-h-48 overflow-y-auto">
                  {deleteCheck.workouts.map((w, i) => (
                    <li key={`w${i}`} className="flex items-start gap-1.5">
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>Workout: {w.workout} (shows as "{w.name}")</span>
                    </li>
                  ))}
                  {deleteCheck.sessions.map((s, i) => (
                    <li key={`s${i}`} className="flex items-start gap-1.5">
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>{s.programme} — {s.session} (shows as "{s.name}")</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="input flex-1 text-sm py-1.5"
                    value={replacementId}
                    onChange={e => setReplacementId(e.target.value)}
                  >
                    <option value="">Replace with…</option>
                    {exercises.filter(e => e.id !== deleteCheck.ex.id).map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => replaceAndDelete(exercises.find(e => e.id === replacementId))}
                    disabled={!replacementId || deleteCheck.replacing}
                    className="btn-primary py-1.5 px-3 text-sm flex-shrink-0 disabled:opacity-50"
                  >
                    {deleteCheck.replacing ? 'Replacing…' : 'Replace & delete'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setDeleteCheck(null)} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteCheck.loading || deleteCheck.replacing} className="bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 px-4 text-sm font-medium disabled:opacity-50">
                Delete anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
