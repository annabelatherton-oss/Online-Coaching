// Standard daily macro split (% of total calories) — used when a client has no goal phase set.
export const MACRO_SPLIT = { carbs: 40, protein: 35, fat: 25 }

// Default split per goal phase — auto-applied when a coach sets/changes a client's phase on the
// Overview tab, but still just a starting point: a coach can edit the %s per client afterwards.
export const GOAL_MACRO_SPLITS = {
  cut: { carbs: 40, protein: 40, fat: 20 },
  maintain: { carbs: 40, protein: 35, fat: 25 },
  bulk: { carbs: 45, protein: 30, fat: 25 },
}

export function splitForGoal(goalType) {
  return GOAL_MACRO_SPLITS[goalType] ? { ...GOAL_MACRO_SPLITS[goalType] } : { ...MACRO_SPLIT }
}

const KCAL_PER_G = { carbs: 4, protein: 4, fat: 9 }

export function calcMacrosFromSplit(calories, splitPct) {
  const cals = Number(calories) || 0
  return {
    protein_g: Math.round((cals * (splitPct.protein || 0) / 100) / KCAL_PER_G.protein),
    carbs_g: Math.round((cals * (splitPct.carbs || 0) / 100) / KCAL_PER_G.carbs),
    fat_g: Math.round((cals * (splitPct.fat || 0) / 100) / KCAL_PER_G.fat),
  }
}

export function calcStandardMacros(calories, goalType) {
  return calcMacrosFromSplit(calories, splitForGoal(goalType))
}

// Back-calculates the carbs/protein/fat % split (of calories) from saved gram values,
// so editing an existing client starts from their actual current split.
export function splitPercentFromGrams({ protein_g, carbs_g, fat_g }, calories) {
  const cals = Number(calories) || 0
  if (!cals) return { ...MACRO_SPLIT }
  return {
    carbs: Math.round((carbs_g || 0) * KCAL_PER_G.carbs / cals * 100),
    protein: Math.round((protein_g || 0) * KCAL_PER_G.protein / cals * 100),
    fat: Math.round((fat_g || 0) * KCAL_PER_G.fat / cals * 100),
  }
}
