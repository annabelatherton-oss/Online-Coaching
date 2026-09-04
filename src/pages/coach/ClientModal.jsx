import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MACRO_SPLIT, calcMacrosFromSplit, splitPercentFromGrams } from '../../lib/macros'
import { ALLERGENS, ALLERGEN_LABELS } from '../../lib/allergens'
import DislikePicker from '../../components/DislikePicker'

export default function ClientModal({ client, onClose, onSaved, duplicateData }) {
  const { profile } = useAuth()
  const isEdit = Boolean(client)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    goal: '',
    current_calories: '',
    current_protein: '',
    current_carbs: '',
    current_fat: '',
    access_weeks: 12,
    start_date: new Date().toISOString().split('T')[0],
    tags: [],
    allergies: [],
    dislikes: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [showOptional, setShowOptional] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // The carbs/protein/fat split (% of calories) driving the gram fields below.
  const [split, setSplit] = useState({ ...MACRO_SPLIT })

  useEffect(() => {
    if (client) {
      setForm({
        full_name: client.profiles?.full_name || '',
        email: client.profiles?.email || '',
        password: '',
        goal: client.goal || '',
        current_calories: client.current_calories || '',
        current_protein: client.current_protein || '',
        current_carbs: client.current_carbs || '',
        current_fat: client.current_fat || '',
        access_weeks: client.access_weeks || 12,
        start_date: client.start_date
          ? client.start_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
        tags: client.tags || [],
        allergies: client.allergies || [],
        dislikes: client.dislikes || [],
      })
      setSplit(splitPercentFromGrams(
        { protein_g: client.current_protein, carbs_g: client.current_carbs, fat_g: client.current_fat },
        client.current_calories
      ))
    } else if (duplicateData) {
      setForm(f => ({
        ...f,
        goal: duplicateData.goal || '',
        current_calories: duplicateData.current_calories || '',
        current_protein: duplicateData.current_protein || '',
        current_carbs: duplicateData.current_carbs || '',
        current_fat: duplicateData.current_fat || '',
        access_weeks: duplicateData.access_weeks || 12,
        tags: duplicateData.tags || [],
      }))
      setSplit(splitPercentFromGrams(
        { protein_g: duplicateData.current_protein, carbs_g: duplicateData.current_carbs, fat_g: duplicateData.current_fat },
        duplicateData.current_calories
      ))
    }
  }, [client, duplicateData])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

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

  function handleTagKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !form.tags.includes(tag)) {
        setForm(f => ({ ...f, tags: [...f.tags, tag] }))
      }
      setTagInput('')
    }
  }

  function removeTag(tag) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        // Update profile name
        await supabase
          .from('profiles')
          .update({ full_name: form.full_name })
          .eq('id', client.profile_id)

        // Update client row
        const { error: clientErr } = await supabase
          .from('clients')
          .update({
            goal: form.goal,
            current_calories: form.current_calories ? parseInt(form.current_calories) : null,
            current_protein: form.current_protein ? parseInt(form.current_protein) : null,
            current_carbs: form.current_carbs ? parseInt(form.current_carbs) : null,
            current_fat: form.current_fat ? parseInt(form.current_fat) : null,
            access_weeks: parseInt(form.access_weeks),
            start_date: form.start_date,
            tags: form.tags,
            allergies: form.allergies,
            dislikes: form.dislikes || [],
          })
          .eq('id', client.id)

        if (clientErr) throw clientErr
      } else {
        // Create auth user via secondary client (won't displace coach session)
        let newUserId = null
        const { data: signUpData, error: signUpErr } = await supabaseAdmin.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name } },
        })

        // Use the returned user ID if available, otherwise fall back to RPC lookup
        if (signUpData?.user?.id) {
          newUserId = signUpData.user.id
        } else if (signUpErr) {
          // User likely already exists — look them up via RPC (bypasses RLS)
          const { data: existingId } = await supabase
            .rpc('get_profile_id_by_email', { email_address: form.email })
          if (!existingId) throw new Error(`Could not find account for ${form.email}. Error: ${signUpErr.message}`)
          newUserId = existingId
        }

        if (!newUserId) throw new Error('Failed to create user account.')

        // Ensure profile is correct
        await supabase.from('profiles').upsert({
          id: newUserId,
          role: 'client',
          full_name: form.full_name,
          email: form.email,
        })

        // Create client row (delete any orphaned previous attempt first)
        await supabase.from('clients').delete().eq('profile_id', newUserId)
        const newClientPayload = {
          coach_id: profile.id,
          profile_id: newUserId,
          goal: form.goal,
          current_calories: form.current_calories ? parseInt(form.current_calories) : null,
          current_protein: form.current_protein ? parseInt(form.current_protein) : null,
          current_carbs: form.current_carbs ? parseInt(form.current_carbs) : null,
          current_fat: form.current_fat ? parseInt(form.current_fat) : null,
          access_weeks: parseInt(form.access_weeks),
          start_date: form.start_date,
          is_active: true,
          is_paused: false,
          tags: form.tags,
          allergies: form.allergies,
          dislikes: form.dislikes || [],
          activity_level: 'moderate',
        }
        let { error: clientErr } = await supabase.from('clients').insert(newClientPayload)
        // activity_level is a newer column — if the migration adding it hasn't been run yet,
        // don't let that block creating the client entirely.
        if (clientErr && /column/i.test(clientErr.message || '') && /activity_level/i.test(clientErr.message || '')) {
          const { activity_level, ...rest } = newClientPayload
          clientErr = (await supabase.from('clients').insert(rest)).error
        }
        if (clientErr) throw clientErr
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit ? 'Edit Client' : duplicateData ? 'Duplicate Client' : 'Add New Client'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              type="text"
              required
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              required
              disabled={isEdit}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="jane@example.com"
            />
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed after account creation.</p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="label">Temporary password</label>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 6 characters"
              />
              <p className="text-xs text-gray-400 mt-1">
                Share this with your client so they can log in. They can change it later.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start date</label>
              <input
                className="input"
                type="date"
                required
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Access (weeks)</label>
              <input
                className="input"
                type="number"
                required
                min={1}
                max={52}
                value={form.access_weeks}
                onChange={e => set('access_weeks', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Goal</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.goal}
              onChange={e => set('goal', e.target.value)}
              placeholder="e.g. Lose 10kg, build lean muscle"
            />
          </div>

          <div>
            <label className="label">Current calories (kcal/day)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.current_calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="e.g. 1800"
            />
            <p className="text-xs text-gray-400 mt-1">
              Macros default to the standard 40% carbs / 35% protein / 25% fat split — expand below to view or override.
            </p>
          </div>

          {/* Optional fields toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(v => !v)}
            className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            <svg className={`w-4 h-4 transition-transform ${showOptional ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showOptional ? 'Hide' : 'Add'} macros, tags & food restrictions (optional)
          </button>

          {showOptional && (
            <>
              <div className="flex items-center justify-between">
                <label className="label !mb-0">Macro split (% of calories)</label>
                <button
                  type="button"
                  onClick={resetToStandardSplit}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Use standard split (40/35/25)
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Carbs %</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={split.carbs}
                    onChange={e => setSplitPct('carbs', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.current_carbs || 0}g</p>
                </div>
                <div>
                  <label className="label">Protein %</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={split.protein}
                    onChange={e => setSplitPct('protein', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.current_protein || 0}g</p>
                </div>
                <div>
                  <label className="label">Fat %</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={split.fat}
                    onChange={e => setSplitPct('fat', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.current_fat || 0}g</p>
                </div>
              </div>
              {splitTotal !== 100 && (
                <p className="text-xs text-amber-500">Split totals {splitTotal}% — adjust so the three add up to 100%.</p>
              )}

              <div>
                <label className="label">Tags</label>
                <input
                  className="input"
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press Enter"
                />
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-brand-900 dark:hover:text-brand-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Allergies</label>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
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
                <label className="label">Food dislikes / intolerances</label>
                <DislikePicker coachId={profile.id} value={form.dislikes} onChange={v => set('dislikes', v)} />
                <p className="text-xs text-gray-400 mt-1">
                  Meals containing these ingredients will be flagged on the plan.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
