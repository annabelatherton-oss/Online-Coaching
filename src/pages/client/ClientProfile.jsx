import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'
import DislikePicker from '../../components/DislikePicker'

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 dark:text-white">{value || '—'}</dd>
    </div>
  )
}

function buildInfoForm(c) {
  return {
    phone: c.phone || '',
    date_of_birth: c.date_of_birth || '',
    height_cm: c.height_cm || '',
    goal: c.goal || '',
    dislikes: c.dislikes || [],
    intake_motivators: c.intake_form?.motivators || '',
    intake_barriers: c.intake_form?.barriers || '',
    intake_health_history: c.intake_form?.health_history || '',
    intake_plan_interest: c.intake_form?.plan_interest || '',
    intake_current_diet: c.intake_form?.current_diet || '',
    intake_current_training: c.intake_form?.current_training || '',
    intake_cardio_preferences: c.intake_form?.cardio_preferences || '',
    intake_food_preferences: c.intake_form?.food_preferences || '',
    intake_meal_preference: c.intake_form?.meal_preference || '',
    intake_other_info: c.intake_form?.other_info || '',
  }
}

export default function ClientProfile() {
  const { profile, session } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [weightEntries, setWeightEntries] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)

  // Weight form
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightForm, setWeightForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_kg: '',
  })
  const [savingWeight, setSavingWeight] = useState(false)

  // Info edit form
  const [showInfoEdit, setShowInfoEdit] = useState(false)
  const [infoForm, setInfoForm] = useState({})
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)

  useEffect(() => {
    async function load() {
      // Load client data
      const { data: clientRow } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', session.user.id)
        .single()
      setClientData(clientRow)
      if (clientRow) {
        setInfoForm(buildInfoForm(clientRow))
      }

      if (clientRow) {
        // Load weight entries
        const { data: weights } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('client_id', clientRow.id)
          .order('recorded_at', { ascending: false })
        setWeightEntries(weights || [])

        // Load measurements
        const { data: meas } = await supabase
          .from('measurements')
          .select('*')
          .eq('client_id', clientRow.id)
          .order('recorded_at', { ascending: false })
        setMeasurements(meas || [])
      }

      setLoading(false)
    }
    load()
  }, [session.user.id])

  async function addWeightEntry(e) {
    e.preventDefault()
    setSavingWeight(true)
    await supabase.from('weight_entries').insert({
      client_id: clientData.id,
      weight_kg: parseFloat(weightForm.weight_kg),
      recorded_at: weightForm.date,
    })
    // Reload
    const { data: weights } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('client_id', clientData.id)
      .order('recorded_at', { ascending: false })
    setWeightEntries(weights || [])
    setSavingWeight(false)
    setShowWeightForm(false)
    setWeightForm({ date: new Date().toISOString().split('T')[0], weight_kg: '' })
  }

  async function saveInfo(e) {
    e.preventDefault()
    setSavingInfo(true)
    await supabase.from('clients').update({
      phone: infoForm.phone || null,
      date_of_birth: infoForm.date_of_birth || null,
      height_cm: infoForm.height_cm ? parseFloat(infoForm.height_cm) : null,
      goal: infoForm.goal || null,
      dislikes: infoForm.dislikes || [],
      intake_form: {
        motivators: infoForm.intake_motivators || null,
        barriers: infoForm.intake_barriers || null,
        health_history: infoForm.intake_health_history || null,
        plan_interest: infoForm.intake_plan_interest || null,
        current_diet: infoForm.intake_current_diet || null,
        current_training: infoForm.intake_current_training || null,
        cardio_preferences: infoForm.intake_cardio_preferences || null,
        food_preferences: infoForm.intake_food_preferences || null,
        meal_preference: infoForm.intake_meal_preference || null,
        other_info: infoForm.intake_other_info || null,
      },
    }).eq('profile_id', session.user.id)
    setSavingInfo(false)
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2500)
    setShowInfoEdit(false)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const expiry = clientData?.access_expires_at
    ? new Date(clientData.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const latestMeasurement = measurements[0]

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function fmtVal(v) {
    return v != null ? `${v} cm` : '—'
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your programme details and progress tracking.
        </p>
      </div>

      {/* Avatar + name */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-white">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {profile?.full_name || '—'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
        </div>
      </div>

      {/* My Information — editable intake form */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">My Information</h3>
          {!showInfoEdit && (
            <button onClick={() => { setInfoForm(buildInfoForm(clientData)); setShowInfoEdit(true) }} className="btn-secondary py-1.5 px-3 text-xs">
              Edit
            </button>
          )}
        </div>

        {showInfoEdit ? (
          <form onSubmit={saveInfo} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input" type="tel" value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} placeholder="07700 900 000" />
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" value={infoForm.date_of_birth} onChange={e => setInfoForm(f => ({ ...f, date_of_birth: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Height (cm)</label>
                <input className="input" type="number" step="0.1" value={infoForm.height_cm} onChange={e => setInfoForm(f => ({ ...f, height_cm: e.target.value }))} placeholder="e.g. 165" />
              </div>
            </div>
            <div>
              <label className="label">Main goal</label>
              <textarea className="input resize-none" rows={2} value={infoForm.goal} onChange={e => setInfoForm(f => ({ ...f, goal: e.target.value }))} placeholder="e.g. Lose weight and feel stronger" />
            </div>
            {[
              { key: 'intake_motivators', label: 'Main motivators' },
              { key: 'intake_barriers', label: 'Barriers to your goals' },
              { key: 'intake_health_history', label: 'Health history / concerns' },
              { key: 'intake_current_diet', label: 'Current diet' },
              { key: 'intake_current_training', label: 'Current training' },
              { key: 'intake_cardio_preferences', label: 'Cardio preferences' },
              { key: 'intake_food_preferences', label: 'Food preferences' },
              { key: 'intake_other_info', label: 'Anything else' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <textarea className="input resize-none" rows={2} value={infoForm[key]} onChange={e => setInfoForm(f => ({ ...f, [key]: e.target.value }))} placeholder="—" />
              </div>
            ))}
            <div>
              <label className="label">Food dislikes</label>
              <DislikePicker coachId={clientData?.coach_id} value={infoForm.dislikes || []} onChange={v => setInfoForm(f => ({ ...f, dislikes: v }))} />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingInfo} className="btn-primary">{savingInfo ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setShowInfoEdit(false)} className="btn-secondary">Cancel</button>
              {infoSaved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
            </div>
          </form>
        ) : (
          <dl>
            {clientData?.phone && <InfoRow label="Phone" value={clientData.phone} />}
            {clientData?.date_of_birth && <InfoRow label="Date of birth" value={new Date(clientData.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
            {clientData?.height_cm && <InfoRow label="Height" value={`${clientData.height_cm} cm`} />}
            {clientData?.goal && <InfoRow label="Goal" value={clientData.goal} />}
            {clientData?.intake_form?.motivators && <InfoRow label="Motivators" value={clientData.intake_form.motivators} />}
            {clientData?.intake_form?.barriers && <InfoRow label="Barriers" value={clientData.intake_form.barriers} />}
            {clientData?.intake_form?.health_history && <InfoRow label="Health history" value={clientData.intake_form.health_history} />}
            {clientData?.dislikes?.length > 0 && <InfoRow label="Food dislikes" value={clientData.dislikes.join(', ')} />}
            {!clientData?.phone && !clientData?.goal && !clientData?.intake_form?.motivators && (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No information added yet. Click Edit to fill in your details.</p>
            )}
          </dl>
        )}
      </div>

      {/* Programme Details */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Programme Details</h3>
        <dl>
          <InfoRow label="Goal" value={clientData?.goal} />
          <InfoRow label="Current calories" value={clientData?.current_calories ? `${clientData.current_calories} kcal/day` : null} />
          <InfoRow
            label="Start date"
            value={clientData?.start_date
              ? new Date(clientData.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : null}
          />
          <InfoRow label="Access duration" value={clientData?.access_weeks ? `${clientData.access_weeks} weeks` : null} />
          <InfoRow label="Access expires" value={expiry} />
        </dl>
      </div>

      {/* Macros */}
      {(clientData?.current_protein || clientData?.current_carbs || clientData?.current_fat) && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Daily Macro Targets</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Protein</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{clientData.current_protein ?? '—'}<span className="text-sm font-normal text-gray-400 ml-0.5">g</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Carbs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{clientData.current_carbs ?? '—'}<span className="text-sm font-normal text-gray-400 ml-0.5">g</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Fat</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{clientData.current_fat ?? '—'}<span className="text-sm font-normal text-gray-400 ml-0.5">g</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Weight History */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Weight History</h3>
          <button
            onClick={() => setShowWeightForm(v => !v)}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            {showWeightForm ? 'Cancel' : 'Log Weight'}
          </button>
        </div>

        {showWeightForm && (
          <form onSubmit={addWeightEntry} className="flex flex-col sm:flex-row gap-3 items-end border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex-1">
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                required
                value={weightForm.date}
                onChange={e => setWeightForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="label">Weight (kg)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                required
                value={weightForm.weight_kg}
                onChange={e => setWeightForm(f => ({ ...f, weight_kg: e.target.value }))}
                placeholder="e.g. 72.5"
              />
            </div>
            <button type="submit" disabled={savingWeight} className="btn-primary whitespace-nowrap">
              {savingWeight ? 'Saving…' : 'Add'}
            </button>
          </form>
        )}

        <WeightChart data={weightEntries} />

        {weightEntries.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {weightEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{fmtDate(entry.recorded_at)}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{entry.weight_kg} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {weightEntries.length === 0 && !showWeightForm && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No weight entries yet. Click "Log Weight" to get started.</p>
        )}
      </div>

      {/* Latest Measurements */}
      {latestMeasurement && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Latest Measurements — {fmtDate(latestMeasurement.recorded_at)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Chest', value: latestMeasurement.chest_cm },
              { label: 'Waist', value: latestMeasurement.waist_cm },
              { label: 'Hips', value: latestMeasurement.hips_cm },
              { label: 'Thighs', value: latestMeasurement.thighs_cm },
              { label: 'Arms', value: latestMeasurement.arms_cm },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{fmtVal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
