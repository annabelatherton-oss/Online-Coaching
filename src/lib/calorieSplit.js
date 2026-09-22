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

// When a client doesn't eat one of the 5 categories at all (e.g. no pre-workout meal, or the
// coach removed their evening snack), its % share doesn't just vanish — it's redistributed across
// whatever's left, proportional to each remaining category's own share, so the day's total
// calories/macros stay exactly the same and every other meal gets correspondingly bigger. A flat
// per-category constant would let a big category (dinner, 25%) absorb the same amount as a small
// one (pre-workout, 10%) despite having far more room to grow proportionally — scaling every
// survivor by the same factor (100 / activeSum) keeps their relative sizes to each other unchanged.
export function redistributeMealSplit(mealSplit, removedCategories) {
  if (!removedCategories || removedCategories.length === 0) return mealSplit
  const active = MEAL_SPLIT_CATEGORIES.filter(c => !removedCategories.includes(c))
  const activeSum = active.reduce((s, c) => s + (mealSplit[c] || 0), 0)
  const result = {}
  for (const cat of MEAL_SPLIT_CATEGORIES) {
    if (removedCategories.includes(cat)) result[cat] = 0
    else result[cat] = activeSum > 0 ? (mealSplit[cat] || 0) / activeSum * 100 : 0
  }
  return result
}
