// Maps an arbitrary date to "which week of the plan" it falls in. There's no calendar-week
// concept stored anywhere for most progress data (manual weight entries, measurements) — the
// only real timeline a client has is their own check-in history, so a date's "week" is just how
// many check-ins had happened by that date. This matches the personal-week convention used
// elsewhere in the app (week N = the Nth check-in ever submitted).
export function buildWeekTimeline(checkins) {
  return [...new Set((checkins || []).map(c => c.submitted_at || c.updated_at).filter(Boolean))]
    .map(d => new Date(d).getTime())
    .filter(t => !Number.isNaN(t))
    .sort((a, b) => a - b)
}

export function weekForDate(dateStr, timeline) {
  if (!dateStr || !timeline?.length) return null
  const target = new Date(dateStr).getTime()
  if (Number.isNaN(target)) return null
  let week = 0
  for (const t of timeline) {
    if (t <= target) week++
    else break
  }
  return week || null
}

export function weekLabel(dateStr, timeline) {
  const w = weekForDate(dateStr, timeline)
  return w != null ? `Week ${w}` : 'Pre-plan'
}
