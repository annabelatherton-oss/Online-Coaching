import { weekForDate } from './planWeek'

// For every lift name that's ever been logged — either in a check-in's lift_results, or as a
// manually backfilled lift_entries row (for history that predates check-ins, or was never
// submitted as one) — builds its full history plus the earliest and latest recorded set (in date
// order) and how much the weight has increased between them — the "biggest lifts" strength-progress
// summary shown to both the client and their coach. Includes every lift that's ever been logged,
// not just the client's designated main lifts, so a significant increase on anything else still
// surfaces here. The full `history` (not just first/latest) is what lets a lift's progression chart
// keep showing every week it was ever logged, even after the coach moves on to requesting different
// lifts — that data doesn't disappear, it just stops growing.
export function computeLiftProgress(checkins, manualEntries = [], startDate = null) {
  const realCheckins = (checkins || [])
    .filter(c => c.week_number > 0)
    .map(c => ({ ...c, _date: c.submitted_at || c.updated_at || null }))
    .sort((a, b) => (a._date || '').localeCompare(b._date || ''))

  // Week number for a given date — calendar-based (weeks elapsed since the client's start date)
  // whenever that's available, since that's what the rest of the app uses. Falls back to the
  // entry's position among all real check-ins up to that date, for a client with no start_date set.
  function weekFor(date) {
    if (startDate && date) {
      const w = weekForDate(date, startDate)
      if (w != null) return w
    }
    return date ? realCheckins.filter(c => (c._date || '') <= date).length : null
  }

  const liftMap = {} // name -> history rows
  realCheckins.forEach(ci => {
    ;(ci.lift_results || []).filter(l => l?.name && l.weight_kg != null && l.reps != null).forEach(l => {
      ;(liftMap[l.name] ||= []).push({
        weight_kg: parseFloat(l.weight_kg), reps: parseInt(l.reps),
        date: ci._date, personalWeek: weekFor(ci._date),
      })
    })
  })
  ;(manualEntries || []).filter(e => e?.lift_name && e.weight_kg != null && e.reps != null && e.recorded_at).forEach(e => {
    ;(liftMap[e.lift_name] ||= []).push({
      weight_kg: parseFloat(e.weight_kg), reps: parseInt(e.reps),
      date: e.recorded_at, personalWeek: weekFor(e.recorded_at), manual: true,
    })
  })

  return Object.entries(liftMap)
    .map(([name, rows]) => ({ name, history: rows.sort((a, b) => (a.date || '').localeCompare(b.date || '')) }))
    .filter(({ history }) => history.length > 0)
    .map(({ name, history }) => {
      const first = history[0]
      const latest = history[history.length - 1]
      const kgIncrease = Math.round((latest.weight_kg - first.weight_kg) * 10) / 10
      const pctIncrease = first.weight_kg > 0 ? Math.round((kgIncrease / first.weight_kg) * 100) : null
      return { name, first, latest, kgIncrease, pctIncrease, history }
    })
    // Biggest increases first, so the most significant gains are what a coach or client sees first.
    .sort((a, b) => b.kgIncrease - a.kgIncrease)
}
