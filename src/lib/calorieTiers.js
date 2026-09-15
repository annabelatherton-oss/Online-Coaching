// The fixed calorie levels a coach can fork a plan group's 50-week meal selections for. Every tier
// is selectable in a plan's editor regardless of whether a client is assigned it yet (so a plan can
// be fully prepared before anyone's on it) — forking one copies the plan's standard meals as a
// starting point, so a coach only has to swap a meal once for everyone on that calorie level
// instead of editing every client.
export const CALORIE_TIERS = [1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500]
