// Maps an arbitrary date to "which week of the plan" it falls in. Weeks are anchored to Fridays —
// the day check-ins and the next week's plan actually go out — not to 7-day blocks counted from
// each client's own start date. A client who starts mid-week gets a short partial "Week 1" that
// runs up to the next Friday; every Friday after that begins the next week, same as everyone else.
// This advances with calendar time whether or not a check-in was actually submitted that week, and
// a start date set retrospectively (e.g. the coach backdates it) immediately reclassifies every
// date since then, including past entries.
const MS_PER_DAY = 24 * 60 * 60 * 1000
// Epoch day 1 (1970-01-02) was a Friday, so an epoch day number ≡ 1 (mod 7) is always a Friday.
const FRIDAY_EPOCH_MOD = 1

function epochDay(dateStr) {
  const t = new Date(dateStr).getTime()
  return Number.isNaN(t) ? null : Math.floor(t / MS_PER_DAY)
}

// How many Fridays have occurred on or before the given epoch day.
function fridaysThrough(day) {
  return Math.floor((day - FRIDAY_EPOCH_MOD) / 7) + 1
}

export function weekForDate(dateStr, startDate) {
  if (!dateStr || !startDate) return null
  const targetDay = epochDay(dateStr)
  const startDay = epochDay(startDate)
  if (targetDay == null || startDay == null || targetDay < startDay) return null
  const fridaysPassed = fridaysThrough(targetDay) - fridaysThrough(startDay)
  return fridaysPassed + 1
}

export function weekLabel(dateStr, startDate) {
  const w = weekForDate(dateStr, startDate)
  return w != null ? `Week ${w}` : 'Pre-plan'
}
