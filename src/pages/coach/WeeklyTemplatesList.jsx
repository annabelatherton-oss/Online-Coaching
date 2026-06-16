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
  const [individualTemplates, setIndividualTemplates] = useState([])
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
        .select('id, plan_group_id, name, week_number, calorie_target, template_meal_slots(id)')
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false }),
    ])

    const knownGroupIds = new Set((groups || []).map(g => g.id))
    const counts = {}
    const individual = []
    for (const t of (templates || [])) {
      if (t.plan_group_id && knownGroupIds.has(t.plan_group_id)) {
        counts[t.plan_group_id] = (counts[t.plan_group_id] || 0) + 1
      } else {
        // No plan_group_id, or plan_group was deleted — show as individual
        individual.push(t)
      }
    }

    setPlanGroups(groups || [])
    setWeekCounts(counts)
    setIndividualTemplates(individual)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.id])

  async function updateWeek(groupId, week) {
    await supabase.from('plan_groups').update({ current_week: week }).eq('id', groupId)
    setPlanGroups(prev => prev.map(g => g.id === groupId ? { ...g, current_week: week } : g))
  }

  async function handleDeleteGroup(groupId) {
    if (!confirm('Delete this 20-week plan? This cannot be undone.')) return
    await supabase.from('weekly_templates').delete().eq('plan_group_id', groupId)
    await supabase.from('plan_groups').delete().eq('id', groupId)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template? This cannot be undone.')) return
    await supabase.from('weekly_templates').delete().eq('id', id)
    load()
  }

  const totalTemplates = planGroups.length + individualTemplates.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {planGroups.length > 0 && `${planGroups.length} plan set${planGroups.length !== 1 ? 's' : ''}`}
            {planGroups.length > 0 && individualTemplates.length > 0 && ' · '}
            {individualTemplates.length > 0 && `${individualTemplates.length} individual template${individualTemplates.length !== 1 ? 's' : ''}`}
            {totalTemplates === 0 && 'No templates yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/coach/meal-templates/generate')} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate 20 Weeks
          </button>
          <button onClick={() => navigate('/coach/meal-templates/new')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : totalTemplates === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-3">No templates yet.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/coach/meal-templates/generate')} className="btn-secondary">Generate 20 Weeks</button>
            <button onClick={() => navigate('/coach/meal-templates/new')} className="btn-primary">New Template</button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">

          {/* 20-Week Plan Sets */}
          {planGroups.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                20-Week Plans
              </h2>
              {planGroups.map(group => (
                <div key={group.id} className="card space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {weekCounts[group.id] || 0} weeks · all clients follow the same week simultaneously
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Week control */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Current week:</span>
                      <button
                        onClick={() => updateWeek(group.id, group.current_week > 1 ? group.current_week - 1 : 20)}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Previous week"
                      >
                        ‹
                      </button>
                      <select
                        className="mx-1 text-sm font-semibold text-gray-900 dark:text-white bg-pink-50 dark:bg-pink-900/20 border-0 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-300 cursor-pointer"
                        value={group.current_week}
                        onChange={e => updateWeek(group.id, parseInt(e.target.value))}
                      >
                        {Array.from({ length: 20 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateWeek(group.id, group.current_week < 20 ? group.current_week + 1 : 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Next week"
                      >
                        ›
                      </button>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Advance this each week — all clients update automatically
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Individual Templates */}
          {individualTemplates.length > 0 && (
            <div className="space-y-3">
              {planGroups.length > 0 && (
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Individual Templates
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {individualTemplates.map(t => {
                  const slotCount = (t.template_meal_slots || []).length
                  return (
                    <div
                      key={t.id}
                      className="card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/coach/meal-templates/${t.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{t.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {t.week_number != null && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                Week {t.week_number}
                              </span>
                            )}
                            {t.calorie_target && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                                {t.calorie_target} kcal
                              </span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {slotCount} meal{slotCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-3 flex-shrink-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/coach/meal-templates/${t.id}`)}
                            className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
