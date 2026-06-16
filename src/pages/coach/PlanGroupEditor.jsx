import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

export default function PlanGroupEditor() {
  const { groupId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [planGroup, setPlanGroup] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [expanded, setExpanded] = useState(new Set())
  const [dirty, setDirty] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: group }, { data: templates }, { data: meals }] = await Promise.all([
        supabase.from('plan_groups').select('*').eq('id', groupId).single(),
        supabase
          .from('weekly_templates')
          .select('id, week_number, template_meal_slots(slot_type, meal_id)')
          .eq('plan_group_id', groupId)
          .order('week_number'),
        supabase
          .from('meals')
          .select('id, name, category')
          .eq('coach_id', profile.id)
          .order('name'),
      ])

      if (group) setPlanGroup(group)

      const byCategory = {}
      for (const m of (meals || [])) {
        ;(byCategory[m.category] = byCategory[m.category] || []).push(m)
      }
      setMealsByCategory(byCategory)

      const built = (templates || []).map(t => {
        const slots = {}
        for (const s of (t.template_meal_slots || [])) {
          slots[s.slot_type] = s.meal_id
        }
        return { templateId: t.id, weekNum: t.week_number, slots }
      })
      setWeeks(built)
      setLoading(false)
    }
    load()
  }, [groupId, profile.id])

  function toggleExpand(weekNum) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(weekNum) ? s.delete(weekNum) : s.add(weekNum)
      return s
    })
  }

  function changeSlot(weekIdx, slotKey, mealId) {
    setWeeks(prev => prev.map((w, i) => {
      if (i !== weekIdx) return w
      return { ...w, slots: { ...w.slots, [slotKey]: mealId || null } }
    }))
    setDirty(prev => {
      const s = new Set(prev)
      s.add(weeks[weekIdx].templateId)
      return s
    })
  }

  async function updateCurrentWeek(week) {
    await supabase.from('plan_groups').update({ current_week: week }).eq('id', groupId)
    setPlanGroup(prev => ({ ...prev, current_week: week }))
  }

  async function handleSaveDirty() {
    setSaving(true)
    setSaveError('')

    for (const week of weeks) {
      if (!dirty.has(week.templateId)) continue

      const { error: delErr } = await supabase
        .from('template_meal_slots')
        .delete()
        .eq('template_id', week.templateId)

      if (delErr) { setSaveError(delErr.message); setSaving(false); return }

      const rows = SLOTS
        .filter(s => week.slots[s.key])
        .map(s => ({
          template_id: week.templateId,
          slot_type: s.key,
          meal_id: week.slots[s.key],
          scaled_version_id: null,
        }))

      if (rows.length) {
        const { error: insErr } = await supabase.from('template_meal_slots').insert(rows)
        if (insErr) { setSaveError(insErr.message); setSaving(false); return }
      }
    }

    setDirty(new Set())
    setSaving(false)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/coach/meal-templates')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{planGroup?.name}</h1>
          {dirty.size > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              {dirty.size} unsaved
            </span>
          )}
        </div>
        <button
          onClick={handleSaveDirty}
          disabled={saving || dirty.size === 0}
          className="btn-primary"
        >
          {saving ? 'Saving…' : `Save ${dirty.size} Week${dirty.size !== 1 ? 's' : ''}`}
        </button>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
        </div>
      )}

      {planGroup && (
        <div className="card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Current week:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateCurrentWeek(planGroup.current_week > 1 ? planGroup.current_week - 1 : 20)}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ‹
              </button>
              <select
                className="mx-1 text-sm font-semibold text-gray-900 dark:text-white bg-pink-50 dark:bg-pink-900/20 border-0 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-300 cursor-pointer"
                value={planGroup.current_week}
                onChange={e => updateCurrentWeek(parseInt(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
              <button
                onClick={() => updateCurrentWeek(planGroup.current_week < 20 ? planGroup.current_week + 1 : 1)}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ›
              </button>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Advance this each week — all clients update automatically
            </span>
          </div>
        </div>
      )}

      {weeks.map((week, weekIdx) => {
        const isOpen = expanded.has(week.weekNum)
        const isCurrent = planGroup && week.weekNum === planGroup.current_week
        const isDirty = dirty.has(week.templateId)

        return (
          <div key={week.templateId} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
              onClick={() => toggleExpand(week.weekNum)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Week {week.weekNum}</span>
                {isCurrent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                    Current
                  </span>
                )}
                {isDirty && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    Unsaved
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="divide-y divide-pink-50 dark:divide-pink-900/10">
                {SLOTS.map(slot => {
                  const options = mealsByCategory[slot.cat] || []
                  return (
                    <div key={slot.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                      <span className="w-40 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {slot.label}
                      </span>
                      <select
                        className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                        value={week.slots[slot.key] || ''}
                        onChange={e => changeSlot(weekIdx, slot.key, e.target.value)}
                      >
                        <option value="">— None —</option>
                        {options.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {dirty.size > 0 && (
        <div className="sticky bottom-4 flex justify-end pb-2">
          <button
            onClick={handleSaveDirty}
            disabled={saving}
            className="btn-primary shadow-lg"
          >
            {saving ? 'Saving…' : `Save ${dirty.size} Week${dirty.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
