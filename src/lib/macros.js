// Standard daily macro split (% of total calories), applied by default to every client.
export const MACRO_SPLIT = { carbs: 40, protein: 35, fat: 25 }
const KCAL_PER_G = { carbs: 4, protein: 4, fat: 9 }

export function calcMacrosFromSplit(calories, splitPct) {
  const cals = Number(calories) || 0
  return {
    protein_g: Math.round((cals * (splitPct.protein || 0) / 100) / KCAL_PER_G.protein),
    carbs_g: Math.round((cals * (splitPct.carbs || 0) / 100) / KCAL_PER_G.carbs),
    fat_g: Math.round((cals * (splitPct.fat || 0) / 100) / KCAL_PER_G.fat),
  }
}

export function calcStandardMacros(calories) {
  return calcMacrosFromSplit(calories, MACRO_SPLIT)
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
