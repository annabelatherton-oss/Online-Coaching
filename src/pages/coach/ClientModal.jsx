import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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
    access_weeks: 4,
    start_date: new Date().toISOString().split('T')[0],
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        access_weeks: client.access_weeks || 4,
        start_date: client.start_date
          ? client.start_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
        tags: client.tags || [],
      })
    } else if (duplicateData) {
      setForm(f => ({
        ...f,
        goal: duplicateData.goal || '',
        current_calories: duplicateData.current_calories || '',
        current_protein: duplicateData.current_protein || '',
        current_carbs: duplicateData.current_carbs || '',
        current_fat: duplicateData.current_fat || '',
        access_weeks: duplicateData.access_weeks || 4,
        tags: duplicateData.tags || [],
      }))
    }
  }, [client, duplicateData])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

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
          })
          .eq('id', client.id)

        if (clientErr) throw clientErr
      } else {
        // Create auth user via secondary client (won't displace coach session)
        const { data: signUpData, error: signUpErr } = await supabaseAdmin.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.full_name },
          },
        })
        if (signUpErr) throw signUpErr

        const newUserId = signUpData.user?.id
        if (!newUserId) throw new Error('Failed to create user account.')

        // The trigger already created the profile row — just update the name/role to be sure
        await supabase.from('profiles').upsert({
          id: newUserId,
          role: 'client',
          full_name: form.full_name,
          email: form.email,
        })

        // Create client row
        const { error: clientErr } = await supabase.from('clients').insert({
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
        })
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
              onChange={e => set('current_calories', e.target.value)}
              placeholder="e.g. 1800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Protein (g)</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.current_protein}
                onChange={e => set('current_protein', e.target.value)}
                placeholder="e.g. 150"
              />
            </div>
            <div>
              <label className="label">Carbs (g)</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.current_carbs}
                onChange={e => set('current_carbs', e.target.value)}
                placeholder="e.g. 200"
              />
            </div>
            <div>
              <label className="label">Fat (g)</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.current_fat}
                onChange={e => set('current_fat', e.target.value)}
                placeholder="e.g. 70"
              />
            </div>
          </div>

          {/* Tags */}
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
