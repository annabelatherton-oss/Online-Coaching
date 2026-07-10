import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const MUSCLE_GROUPS = ['Glutes', 'Quads', 'Hamstrings', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Full Body', 'Adductors', 'Abductors', 'Hip Flexors']
const EQUIPMENT_LIST = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Resistance Band', 'Bodyweight', 'Kettlebell', 'Pull-up Bar', 'Trap Bar', 'Landmine', 'Battle Ropes', 'Sled', 'TRX', 'Medicine Ball']
const EXERCISE_TYPES = ['Compound', 'Isolation']
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

const SEED_EXERCISES = [
  // Glutes
  { name: 'Hip Thrust', primary_muscle: 'Glutes', equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Drive through heels, squeeze glutes at the top, keep chin tucked' },
  { name: 'Romanian Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Hinge at the hips, soft knee bend, bar close to legs' },
  { name: 'Bulgarian Split Squat', primary_muscle: 'Glutes', secondary_muscles: ['Quads'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Hip Abduction Machine', primary_muscle: 'Glutes', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Cable Kickback', primary_muscle: 'Glutes', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Hyperextension', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings', 'Back'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Glute Bridge', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Sumo Squat', primary_muscle: 'Glutes', secondary_muscles: ['Quads', 'Adductors'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Step Up', primary_muscle: 'Glutes', secondary_muscles: ['Quads'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Single Leg Romanian Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Advanced' },
  { name: 'Donkey Kick', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Smith Machine Hip Thrust', primary_muscle: 'Glutes', equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Cable Pull Through', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Banded Hip Thrust', primary_muscle: 'Glutes', equipment: 'Resistance Band', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Abduction Machine', primary_muscle: 'Glutes', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  // Quads
  { name: 'Back Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced' },
  { name: 'Front Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced' },
  { name: 'Leg Press', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Hack Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Leg Extension', primary_muscle: 'Quads', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Goblet Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Walking Lunge', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Reverse Lunge', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Smith Machine Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Sissy Squat', primary_muscle: 'Quads', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Advanced' },
  // Hamstrings
  { name: 'Lying Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Seated Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Nordic Curl', primary_muscle: 'Hamstrings', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced' },
  { name: 'Stiff Leg Deadlift', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Good Morning', primary_muscle: 'Hamstrings', secondary_muscles: ['Back'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  // Back
  { name: 'Pull Up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Full dead hang start, drive elbows to hips' },
  { name: 'Chin Up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Seated Cable Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Bent Over Barbell Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Single Arm Dumbbell Row', primary_muscle: 'Back', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'T-Bar Row', primary_muscle: 'Back', equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Face Pull', primary_muscle: 'Back', secondary_muscles: ['Shoulders'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Deadlift', primary_muscle: 'Back', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced' },
  { name: 'Chest Supported Row', primary_muscle: 'Back', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Cable Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Rack Pull', primary_muscle: 'Back', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  // Chest
  { name: 'Barbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Incline Barbell Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Dumbbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Incline Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Dumbbell Fly', primary_muscle: 'Chest', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Push Up', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Dips', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Pec Deck', primary_muscle: 'Chest', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  // Shoulders
  { name: 'Barbell Overhead Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Dumbbell Shoulder Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Lateral Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Cable Lateral Raise', primary_muscle: 'Shoulders', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Front Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Rear Delt Fly', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Arnold Press', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Upright Row', primary_muscle: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  // Biceps
  { name: 'Barbell Curl', primary_muscle: 'Biceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Dumbbell Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Hammer Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Cable Curl', primary_muscle: 'Biceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Incline Dumbbell Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Preacher Curl', primary_muscle: 'Biceps', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Concentration Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  // Triceps
  { name: 'Tricep Pushdown', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Skull Crusher', primary_muscle: 'Triceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Intermediate' },
  { name: 'Close Grip Bench Press', primary_muscle: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Overhead Tricep Extension', primary_muscle: 'Triceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Tricep Dips', primary_muscle: 'Triceps', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Rope Pushdown', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Overhead Cable Extension', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  // Core
  { name: 'Plank', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Crunches', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Cable Crunch', primary_muscle: 'Core', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Hanging Leg Raise', primary_muscle: 'Core', equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate' },
  { name: 'Ab Wheel Rollout', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced' },
  { name: 'Russian Twist', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Side Plank', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Dead Bug', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner' },
  { name: 'Back Extension', primary_muscle: 'Core', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner' },
  // Calves
  { name: 'Standing Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Seated Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
  { name: 'Leg Press Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner' },
]

const EMPTY_FORM = { name: '', primary_muscle: '', secondary_muscles: [], equipment: '', exercise_type: '', difficulty: '', video_url: '', coaching_cues: '', instructions: '', tempo: '', default_rest_seconds: '', tags: [], notes: '' }

function Badge({ label, colourClass }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colourClass || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{label}</span>
}

function ExerciseModal({ exercise, onSave, onClose }) {
  const [form, setForm] = useState(exercise ? {
    ...exercise,
    secondary_muscles: exercise.secondary_muscles || [],
    tags: exercise.tags || [],
    default_rest_seconds: exercise.default_rest_seconds ?? '',
  } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [secInput, setSecInput] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      name: form.name.trim(),
      default_rest_seconds: form.default_rest_seconds !== '' ? parseInt(form.default_rest_seconds) : null,
    })
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
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Equipment</label>
              <select className="input w-full" value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                <option value="">Select…</option>
                {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Default rest (seconds)</label>
              <input type="number" min={0} className="input w-full" placeholder="e.g. 90" value={form.default_rest_seconds} onChange={e => set('default_rest_seconds', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tempo</label>
              <input className="input w-full" placeholder="e.g. 3010" value={form.tempo} onChange={e => set('tempo', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Video URL (optional)</label>
            <input type="url" className="input w-full" placeholder="https://…" value={form.video_url} onChange={e => set('video_url', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Coaching cues</label>
            <textarea rows={2} className="input w-full resize-none" placeholder="Key cues for the client…" value={form.coaching_cues} onChange={e => set('coaching_cues', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Instructions</label>
            <textarea rows={3} className="input w-full resize-none" placeholder="Step-by-step instructions…" value={form.instructions} onChange={e => set('instructions', e.target.value)} />
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
  const [seeding, setSeeding] = useState(false)
  const [importing, setImporting] = useState(false)

  async function load() {
    const { data } = await supabase.from('exercises').select('*').eq('coach_id', profile.id).eq('is_archived', false).order('name')
    setExercises(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = exercises.filter(ex => {
    if (filterMuscle && ex.primary_muscle !== filterMuscle) return false
    if (filterEquipment && ex.equipment !== filterEquipment) return false
    if (filterType && ex.exercise_type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return ex.name.toLowerCase().includes(q) || (ex.primary_muscle || '').toLowerCase().includes(q)
    }
    return true
  })

  async function handleSave(form) {
    if (modal === 'new') {
      await supabase.from('exercises').insert({ ...form, coach_id: profile.id })
    } else {
      await supabase.from('exercises').update(form).eq('id', modal.id)
    }
    setModal(null)
    load()
  }

  async function handleDelete(ex) {
    if (!confirm(`Archive "${ex.name}"?`)) return
    await supabase.from('exercises').update({ is_archived: true }).eq('id', ex.id)
    load()
  }

  async function seedLibrary() {
    setSeeding(true)
    const existingNames = new Set(exercises.map(e => e.name.toLowerCase()))
    const toInsert = SEED_EXERCISES.filter(e => !existingNames.has(e.name.toLowerCase()))
      .map(e => ({ ...e, coach_id: profile.id, secondary_muscles: e.secondary_muscles || [] }))
    if (toInsert.length > 0) {
      await supabase.from('exercises').insert(toInsert)
      await load()
    }
    setSeeding(false)
  }

  async function importFromProgrammes() {
    setImporting(true)
    const { data: sessData } = await supabase.from('training_sessions').select('session_exercises(name)')
    const allNames = [...new Set(
      (sessData || []).flatMap(s => (s.session_exercises || []).map(e => e.name).filter(Boolean))
    )]
    const existingLower = new Set(exercises.map(e => e.name.toLowerCase()))
    const toInsert = allNames.filter(n => n.trim() && !existingLower.has(n.trim().toLowerCase()))
    if (toInsert.length > 0) {
      await supabase.from('exercises').insert(toInsert.map(name => ({ coach_id: profile.id, name: name.trim() })))
      await load()
    }
    setImporting(false)
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
          <button onClick={importFromProgrammes} disabled={importing}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {importing ? 'Importing…' : 'Import from programmes'}
          </button>
          {exercises.length === 0 && (
            <button onClick={seedLibrary} disabled={seeding}
              className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
              {seeding ? 'Adding…' : 'Initialize with common exercises'}
            </button>
          )}
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
                {ex.equipment && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{ex.equipment}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => setModal(ex)} className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 px-1.5 py-1">Edit</button>
                <button onClick={() => handleDelete(ex)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1">Archive</button>
              </div>
            </div>
            {ex.coaching_cues && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2 italic">"{ex.coaching_cues}"</p>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <ExerciseModal
          exercise={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
