// Max heart rate: standard age-predicted formula (220 - age).
// Zone bands: standard 5-zone % of max HR (Zone 1 50-60% ... Zone 5 90-100%).
const ZONE_RANGES = {
  'Zone 1': [0.50, 0.60],
  'Zone 2': [0.60, 0.70],
  'Zone 3': [0.70, 0.80],
  'Zone 4': [0.80, 0.90],
  'Zone 5': [0.90, 1.00],
}

export function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function maxHeartRate(dateOfBirth) {
  const age = calcAge(dateOfBirth)
  if (age == null) return null
  return Math.round(220 - age)
}

function roundToNearest5(n) {
  return Math.round(n / 5) * 5
}

// Returns { min, max } target bpm for a zone label, or null if age/zone unavailable.
export function zoneBpmRange(dateOfBirth, zoneLabel) {
  const hrMax = maxHeartRate(dateOfBirth)
  const range = ZONE_RANGES[zoneLabel]
  if (!hrMax || !range) return null
  return { min: roundToNearest5(hrMax * range[0]), max: roundToNearest5(hrMax * range[1]) }
}

export function formatZoneBpm(dateOfBirth, zoneLabel) {
  const r = zoneBpmRange(dateOfBirth, zoneLabel)
  return r ? `${r.min}–${r.max} bpm` : null
}
