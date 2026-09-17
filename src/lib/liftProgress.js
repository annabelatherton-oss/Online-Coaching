// For every lift name that's ever been logged in a check-in's lift_results, finds the earliest
// and latest recorded set (in check-in order) and how much the weight has increased between
// them — the "biggest lifts" strength-progress summary shown to both the client and their coach.
// Includes every lift that's ever been logged, not just the client's designated main lifts, so a
// significant increase on anything else still surfaces here.
export function computeLiftProgress(checkins) {
  const liftMap = {} // name -> { first, latest }
  const sorted = [...checkins].sort((a, b) => a.week_number - b.week_number)
  sorted.forEach((ci, i) => {
    const pw = i + 1
    ;(ci.lift_results || []).filter(l => l?.name && l.weight_kg != null && l.reps != null).forEach(l => {
      if (!liftMap[l.name]) liftMap[l.name] = { first: null, latest: null }
      if (!liftMap[l.name].first) liftMap[l.name].first = { weight_kg: parseFloat(l.weight_kg), reps: parseInt(l.reps), personalWeek: pw }
      liftMap[l.name].latest = { weight_kg: parseFloat(l.weight_kg), reps: parseInt(l.reps), personalWeek: pw }
    })
  })
  return Object.entries(liftMap)
    .filter(([, v]) => v.first && v.latest)
    .map(([name, { first, latest }]) => {
      const kgIncrease = Math.round((latest.weight_kg - first.weight_kg) * 10) / 10
      const pctIncrease = first.weight_kg > 0 ? Math.round((kgIncrease / first.weight_kg) * 100) : null
      return { name, first, latest, kgIncrease, pctIncrease }
    })
    // Biggest increases first, so the most significant gains are what a coach or client sees first.
    .sort((a, b) => b.kgIncrease - a.kgIncrease)
}
