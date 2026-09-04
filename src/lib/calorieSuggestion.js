/**
 * Suggests a calorie target from the client's stats and how their weight has
 * actually moved over the last couple of weeks, compared to what's expected
 * for their goal (cut / maintain / bulk). Every number the suggestion is
 * built from is returned alongside it, so the coach can see the reasoning
 * rather than just a number appearing from nowhere.
 *
 * Method:
 * 1. Estimate BMR (Mifflin-St Jeor) from weight/height/age/sex.
 * 2. Estimate TDEE = BMR x an activity multiplier.
 * 3. A starting target comes from TDEE x a goal percentage (cut ~80%, bulk ~110%).
 * 4. That starting point is then nudged using the client's actual recent weight
 *    trend: if they're not moving at the expected rate for their goal, the gap
 *    between actual and expected weekly change (as a fraction of bodyweight)
 *    is converted to a kcal/day adjustment via the standard ~7700 kcal-per-kg
 *    rule. Small gaps are suggested as a cardio nudge instead of a further
 *    calorie cut, since that's usually the better lever for a small shortfall.
 */

export const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (little/no exercise)',
  light: 'Light (exercise 1-3 days/wk)',
  moderate: 'Moderate (exercise 3-5 days/wk)',
  very_active: 'Very active (hard exercise 6-7 days/wk)',
  extra_active: 'Extra active (very hard exercise or physical job)',
}
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

export const GOAL_LABELS = { cut: 'Cutting', maintain: 'Maintaining', bulk: 'Bulking' }
const GOAL_BASE_PCT = { cut: 0.80, maintain: 1.0, bulk: 1.10 }

// Expected weekly bodyweight change, as a fraction of bodyweight (e.g. -0.0075 = -0.75%/week).
const GOAL_RATE_RANGE = {
  cut: { min: -0.010, max: -0.005 },
  maintain: { min: -0.0025, max: 0.0025 },
  bulk: { min: 0.0025, max: 0.005 },
}

const KCAL_PER_KG = 7700
const CARDIO_THRESHOLD_KCAL = 250 // below this, suggest activity instead of a further calorie cut

export function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

function calcBMR({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (sex === 'male') return base + 5
  if (sex === 'female') return base - 161
  return base - 78 // midpoint of the male/female offsets when sex isn't recorded
}

// Picks the trend window from a client's weight history: the earliest and latest
// points within the last ~21 days (covers "the last 2 weeks" even with a few days'
// slack in weigh-in timing), and needs at least 2 distinct points to say anything.
// `points` must be [{ recorded_at: 'YYYY-MM-DD', weight_kg }] sorted oldest→newest.
function recentTrend(points) {
  if (!points || points.length < 2) return null
  const latest = points[points.length - 1]
  const latestDate = new Date(latest.recorded_at)
  const windowStart = new Date(latestDate.getTime() - 21 * 24 * 60 * 60 * 1000)
  const windowed = points.filter(p => new Date(p.recorded_at) >= windowStart)
  if (windowed.length < 2) return null
  const first = windowed[0]
  const days = (latestDate - new Date(first.recorded_at)) / (24 * 60 * 60 * 1000)
  if (days < 3) return null // too close together to trust as a rate
  const changeKg = latest.weight_kg - first.weight_kg
  const weeklyRateKg = (changeKg / days) * 7
  return { weeklyRateKg, latestWeightKg: latest.weight_kg, days, fromDate: first.recorded_at, toDate: latest.recorded_at }
}

/**
 * @param {object} client - needs height_cm, date_of_birth, sex, activity_level, goal_type
 * @param {Array} weightPoints - [{ recorded_at, weight_kg }] sorted oldest→newest
 * @param {number|null} currentTarget - the client's current calorie_target, if any
 */
export function suggestCalorieTarget(client, weightPoints, currentTarget) {
  const missing = []
  if (!client.height_cm) missing.push('height')
  if (!client.date_of_birth) missing.push('date of birth')
  if (!client.activity_level) missing.push('activity level')
  if (!client.goal_type) missing.push('goal (cutting/maintaining/bulking)')
  if (missing.length) return { ready: false, missing }

  const trend = recentTrend(weightPoints)
  const age = calcAge(client.date_of_birth)
  const latestWeight = trend?.latestWeightKg ?? weightPoints?.[weightPoints.length - 1]?.weight_kg
  if (!latestWeight) return { ready: false, missing: ['a recent weigh-in'] }

  const bmr = calcBMR({ weightKg: latestWeight, heightCm: client.height_cm, age, sex: client.sex })
  const tdee = bmr * ACTIVITY_MULTIPLIERS[client.activity_level]
  const baseTarget = tdee * GOAL_BASE_PCT[client.goal_type]

  if (!trend) {
    // No usable trend yet — just the stats-based estimate, nothing to compare it against.
    return {
      ready: true, hasTrend: false, bmr, tdee, baseTarget,
      suggestedTarget: Math.round(baseTarget / 25) * 25,
      recommendation: { type: 'baseline', message: 'Not enough recent weigh-ins to check progress yet — this is a starting estimate from their stats alone.' },
    }
  }

  const range = GOAL_RATE_RANGE[client.goal_type]
  const actualFrac = trend.weeklyRateKg / trend.latestWeightKg
  const onTrack = actualFrac >= range.min && actualFrac <= range.max
  const targetMidFrac = (range.min + range.max) / 2
  const gapFrac = targetMidFrac - actualFrac
  const dailyAdjustment = Math.round((gapFrac * trend.latestWeightKg * KCAL_PER_KG / 7) / 25) * 25
  const base = currentTarget || Math.round(baseTarget / 25) * 25

  let recommendation
  if (onTrack) {
    recommendation = { type: 'keep', message: `Weight is changing at the expected rate for ${GOAL_LABELS[client.goal_type].toLowerCase()} — no change needed.` }
  } else if (dailyAdjustment < 0 && Math.abs(dailyAdjustment) < CARDIO_THRESHOLD_KCAL) {
    recommendation = {
      type: 'increase_cardio',
      message: `Progress is a little behind target — try adding activity instead of cutting calories further: roughly ${Math.round(Math.abs(dailyAdjustment) / 100) * 1500} extra steps/day, or ~${Math.round(Math.abs(dailyAdjustment) / 10)} minutes of moderate cardio.`,
    }
  } else if (dailyAdjustment < 0) {
    recommendation = { type: 'decrease_calories', amount: dailyAdjustment, message: `Progress is behind target for ${GOAL_LABELS[client.goal_type].toLowerCase()} — suggest lowering by ${Math.abs(dailyAdjustment)} kcal/day.` }
  } else {
    recommendation = { type: 'increase_calories', amount: dailyAdjustment, message: `Change is faster than the target range for ${GOAL_LABELS[client.goal_type].toLowerCase()} — suggest raising by ${dailyAdjustment} kcal/day.` }
  }

  const suggestedTarget = onTrack || recommendation.type === 'increase_cardio'
    ? base
    : Math.max(1000, base + (recommendation.amount || 0))

  return {
    ready: true, hasTrend: true, bmr, tdee, baseTarget,
    weeklyRateKg: trend.weeklyRateKg, actualFrac, targetRange: range,
    trendFrom: trend.fromDate, trendTo: trend.toDate,
    onTrack, suggestedTarget, recommendation,
  }
}
