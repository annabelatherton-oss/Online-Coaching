// Standard daily macro split, applied by default to every client's calorie target.
export const MACRO_SPLIT = { carbs: 0.40, protein: 0.35, fat: 0.25 }
const KCAL_PER_G = { carbs: 4, protein: 4, fat: 9 }

export function calcStandardMacros(calories) {
  const cals = Number(calories) || 0
  return {
    protein_g: Math.round((cals * MACRO_SPLIT.protein) / KCAL_PER_G.protein),
    carbs_g: Math.round((cals * MACRO_SPLIT.carbs) / KCAL_PER_G.carbs),
    fat_g: Math.round((cals * MACRO_SPLIT.fat) / KCAL_PER_G.fat),
  }
}
