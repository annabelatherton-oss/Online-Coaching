// Shared countdown math for a client's target date (e.g. a wedding, competition, holiday),
// used anywhere the date needs to be highlighted with "X days/weeks to go".

export function daysUntil(targetDateStr) {
  if (!targetDateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDateStr + 'T00:00:00')
  if (isNaN(target.getTime())) return null
  return Math.round((target - today) / (24 * 60 * 60 * 1000))
}

export function formatCountdown(days) {
  if (days == null) return ''
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 14) return `${days} days to go`
  const weeks = Math.round(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'} to go`
}

export function formatTargetDate(targetDateStr) {
  if (!targetDateStr) return ''
  return new Date(targetDateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
