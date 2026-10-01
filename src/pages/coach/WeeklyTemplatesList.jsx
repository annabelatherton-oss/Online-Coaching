import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function WeeklyTemplatesList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [planGroups, setPlanGroups] = useState([])
  const [weekCounts, setWeekCounts] = useState({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: groups }, { data: templates }] = await Promise.all([
      supabase
        .from('plan_groups')
        .select('*')
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('weekly_templates')
        .select('plan_group_id')
        .eq('coach_id', profile.id)
        .is('calorie_tier', null),
    ])

    const counts = {}
    for (const t of (templates || [])) {
      if (t.plan_group_id) counts[t.plan_group_id] = (counts[t.plan_group_id] || 0) + 1
    }

    setPlanGroups(groups || [])
    setWeekCounts(counts)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.id])

  async function handleDeleteGroup(groupId) {
    if (!confirm('Delete this 20-week plan? This cannot be undone.')) return
    // Unassign any clients pointed at this plan so they don't end up with a dangling
    // assignment (which renders as a blank Meal Plan tab on their profile).
    await supabase.from('client_plan_assignments').update({ active: false }).eq('plan_group_id', groupId)
    await supabase.from('weekly_templates').delete().eq('plan_group_id', groupId)
    await supabase.from('plan_groups').delete().eq('id', groupId)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {planGroups.length > 0 ? `${planGroups.length} plan set${planGroups.length !== 1 ? 's' : ''}` : 'No plans yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/coach/meal-templates/generate')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate 50 Weeks
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : planGroups.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-3">No plans yet.</p>
          <button onClick={() => navigate('/coach/meal-templates/generate')} className="btn-primary">Generate 50 Weeks</button>
        </div>
      ) : (
        <div className="space-y-4">
          {planGroups.map(group => (
            <div key={group.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/coach/meal-templates/plans/${group.id}`)}>
                  <h3 className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{group.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {weekCounts[group.id] || 0} weeks · all clients follow the same week simultaneously
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/coach/meal-templates/plans/${group.id}`)}
                    className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Current week is read-only here — change it from inside the Plan editor instead,
                  which (unlike this list used to) also snapshots the outgoing week for the
                  "sent"/"changed" tracking on each tier. Advancing is a deliberate call only you
                  can make once every client's check-in for that week is actually handled — never
                  automatic, since nothing else knows whether everyone's been delivered yet. */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Current week:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{group.current_week}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">— change it from the Plan editor</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
