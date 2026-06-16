import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function WeeklyTemplatesList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('weekly_templates')
      .select('*, template_meal_slots(id)')
      .eq('coach_id', profile.id)
      .order('created_at', { ascending: false })
    setTemplates(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.id])

  async function handleDelete(id) {
    if (!confirm('Delete this template? This cannot be undone.')) return
    await supabase.from('weekly_templates').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''} — build once, assign to any client
          </p>
        </div>
        <button onClick={() => navigate('/coach/meal-templates/new')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : templates.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-3">No templates yet. Create your first one!</p>
          <button onClick={() => navigate('/coach/meal-templates/new')} className="btn-primary">
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => {
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
      )}
    </div>
  )
}
