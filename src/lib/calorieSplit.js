// The 5 meal categories a day's calories are split across, in display order.
export const MEAL_SPLIT_CATEGORIES = ['pre_workout', 'breakfast', 'lunch', 'dinner', 'evening_snack']

export const MEAL_SPLIT_LABELS = {
  pre_workout: 'Pre-workout',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  evening_snack: 'Evening snack',
}

// Standard daily calorie split (% of total calories), coach-wide and editable — every calorie-tier
// meal generation (see calorieTierScaling.js) apportions a tier's total calories across categories
// using this split, since one generated ingredient set per (meal, tier) has to serve every client on
// that tier. Used as the bootstrap default until a coach saves their own split to profiles.meal_split.
export const DEFAULT_MEAL_SPLIT = { pre_workout: 10, breakfast: 25, lunch: 30, dinner: 25, evening_snack: 10 }

// profiles.meal_split may be missing keys (e.g. saved before a category existed) — fill gaps from
// the default so callers always get all 5 categories.
export function normalizeMealSplit(split) {
  const result = { ...DEFAULT_MEAL_SPLIT }
  if (split) {
    for (const cat of MEAL_SPLIT_CATEGORIES) {
      if (split[cat] != null) result[cat] = Number(split[cat])
    }
  }
  return result
}
