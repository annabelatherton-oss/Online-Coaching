// The next N Mondays (including today if today itself is a Monday), as 'YYYY-MM-DD' strings —
// used wherever a coach picks a start date for a client's next meal plan / training block, since
// every client's week always runs Monday-Sunday.
export function upcomingMondays(count = 12) {
  const out = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // getDay(): 0=Sun..6=Sat — days to add to reach this week's (or today's) Monday.
  const toMonday = (1 - d.getDay() + 7) % 7
  d.setDate(d.getDate() + toMonday)
  for (let i = 0; i < count; i++) {
    out.push(new Date(d).toISOString().split('T')[0])
    d.setDate(d.getDate() + 7)
  }
  return out
}
