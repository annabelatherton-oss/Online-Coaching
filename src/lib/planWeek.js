// Maps an arbitrary date to "which week of the plan" it falls in, counted in whole 7-day periods
// elapsed since the client's start date — so the week number advances with calendar time whether
// or not a check-in was actually submitted that week. A start date set retrospectively (e.g. the
// coach backdates it) immediately reclassifies every date since then, including past entries.
export function weekForDate(dateStr, startDate) {
  if (!dateStr || !startDate) return null
  const target = new Date(dateStr).getTime()
  const start = new Date(startDate).getTime()
  if (Number.isNaN(target) || Number.isNaN(start)) return null
  const diffDays = (target - start) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return null
  return Math.floor(diffDays / 7) + 1
}

export function weekLabel(dateStr, startDate) {
  const w = weekForDate(dateStr, startDate)
  return w != null ? `Week ${w}` : 'Pre-plan'
}
