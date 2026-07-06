import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const RATING_LABELS = {
  energy_level: ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'],
  sleep_quality: ['', 'Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
  adherence:     ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
}

function RatingInput({ field, value, onChange }) {
  const labels = RATING_LABELS[field]
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(field, n === value ? null : n)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
            value === n
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-300'
          }`}
          title={labels[n]}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function ClientCheckin() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)
  const [collectMeasurements, setCollectMeasurements] = useState(false)
  const [topLifts, setTopLifts] = useState([])
  const [existing, setExisting] = useState(null)
  const [form, setForm] = useState({
    weight_kg: '',
    waist_cm: '',
    hips_cm: '',
    energy_level: null,
    sleep_quality: null,
    adherence: null,
    notes: '',
    lift_results: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id, coach_id, collect_measurements, top_lifts')
        .eq('profile_id', session.user.id)
        .single()
      if (!clientRow) { setLoading(false); return }
      setClientData(clientRow)
      setCollectMeasurements(!!clientRow.collect_measurements)
      const lifts = (clientRow.top_lifts || []).filter(l => l?.name)
      setTopLifts(lifts)

      const { data: asgn } = await supabase
        .from('client_plan_assignments')
        .select('id, plan_group_id, week_override')
        .eq('client_id', clientRow.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let week = 1
      if (asgn) {
        if (asgn.week_override != null) {
          week = asgn.week_override
        } else {
          const { data: pg } = await supabase
            .from('plan_groups')
            .select('current_week')
            .eq('id', asgn.plan_group_id)
            .single()
          week = pg?.current_week ?? 1
        }
      }
      setWeekNumber(week)

      const { data: checkin } = await supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', clientRow.id)
        .eq('week_number', week)
        .maybeSingle()

      if (checkin) {
        setExisting(checkin)
        setForm(f => ({
          ...f,
          weight_kg:     checkin.weight_kg    ?? '',
          waist_cm:      checkin.waist_cm     ?? '',
          hips_cm:       checkin.hips_cm      ?? '',
          energy_level:  checkin.energy_level ?? null,
          sleep_quality: checkin.sleep_quality ?? null,
          adherence:     checkin.adherence    ?? null,
          notes:         checkin.notes        ?? '',
          lift_results:  checkin.lift_results ?? [],
        }))
      }
      setLoading(false)
    }
    load()
  }, [session.user.id])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function setLift(index, key, value) {
    setForm(f => {
      const results = [...(f.lift_results || [])]
      results[index] = { ...results[index], name: topLifts[index]?.name, [key]: value }
      return { ...f, lift_results: results }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clientData) return
    setSaving(true); setError(''); setSaved(false)

    const payload = {
      client_id:     clientData.id,
      coach_id:      clientData.coach_id,
      week_number:   weekNumber,
      updated_at:    new Date().toISOString(),
      weight_kg:     form.weight_kg !== '' ? parseFloat(form.weight_kg) : null,
      waist_cm:      collectMeasurements && form.waist_cm !== '' ? parseFloat(form.waist_cm) : null,
      hips_cm:       collectMeasurements && form.hips_cm  !== '' ? parseFloat(form.hips_cm)  : null,
      energy_level:  form.energy_level,
      sleep_quality: form.sleep_quality,
      adherence:     form.adherence,
      notes:         form.notes || null,
      lift_results:  form.lift_results?.length ? form.lift_results : null,
    }

    const { error: err } = existing
      ? await supabase.from('client_checkins').update(payload).eq('id', existing.id)
      : await supabase.from('client_checkins').insert(payload)

    setSaving(false)
    if (err) { setError('Could not save. Please try again.'); return }
    setSaved(true)
    if (!existing) {
      const { data } = await supabase.from('client_checkins').select('*').eq('client_id', clientData.id).eq('week_number', weekNumber).maybeSingle()
      setExisting(data)
    }
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Check-in</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {weekNumber != null ? `Week ${weekNumber}` : 'Your weekly progress update.'}
          {existing && <span className="ml-1 text-brand-500">Already submitted — you can update it below.</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Body metrics */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Body metrics</h2>
          <div>
            <label className="label">Weight (kg)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              value={form.weight_kg}
              onChange={e => set('weight_kg', e.target.value)}
              placeholder="e.g. 72.5"
            />
          </div>
          {collectMeasurements && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Waist (cm)</label>
                <input className="input" type="number" step="0.5" min="0" value={form.waist_cm} onChange={e => set('waist_cm', e.target.value)} placeholder="—" />
              </div>
              <div>
                <label className="label">Hips (cm)</label>
                <input className="input" type="number" step="0.5" min="0" value={form.hips_cm} onChange={e => set('hips_cm', e.target.value)} placeholder="—" />
              </div>
            </div>
          )}
        </div>

        {/* Ratings */}
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">How was this week?</h2>

          <div>
            <label className="label">Energy levels</label>
            <RatingInput field="energy_level" value={form.energy_level} onChange={set} />
            {form.energy_level && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">{RATING_LABELS.energy_level[form.energy_level]}</p>}
          </div>

          <div>
            <label className="label">Sleep quality</label>
            <RatingInput field="sleep_quality" value={form.sleep_quality} onChange={set} />
            {form.sleep_quality && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">{RATING_LABELS.sleep_quality[form.sleep_quality]}</p>}
          </div>

          <div>
            <label className="label">Adherence to your plan</label>
            <RatingInput field="adherence" value={form.adherence} onChange={set} />
            {form.adherence && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">{RATING_LABELS.adherence[form.adherence]}</p>}
          </div>
        </div>

        {/* Top lifts */}
        {topLifts.length > 0 && (
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">This week's lifts</h2>
            {topLifts.map((lift, i) => {
              const result = form.lift_results?.[i] || {}
              return (
                <div key={i}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lift.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Weight (kg)</label>
                      <input
                        className="input"
                        type="number"
                        step="0.5"
                        min="0"
                        value={result.weight_kg ?? ''}
                        onChange={e => setLift(i, 'weight_kg', e.target.value)}
                        placeholder="e.g. 80"
                      />
                    </div>
                    <div>
                      <label className="label">Reps</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={result.reps ?? ''}
                        onChange={e => setLift(i, 'reps', e.target.value)}
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Notes */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notes for your coach</h2>
          <textarea
            className="input resize-none"
            rows={4}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="How you're feeling, any struggles, wins, anything else you want your coach to know…"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : existing ? 'Update check-in' : 'Submit check-in'}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  )
}
