// Standard daily macro split (% of total calories) — used when a client has no goal phase set.
export const MACRO_SPLIT = { carbs: 40, protein: 35, fat: 25 }

export const GOAL_TYPES = ['cut', 'maintain', 'bulk']

// Bootstrap default split per goal phase — auto-applied when a coach sets/changes a client's
// phase on the Overview tab, but still just a starting point in two ways: a coach can edit the
// %s per client afterwards, and can also override these coach-wide defaults in Settings
// (profiles.goal_macro_splits), which normalizeGoalMacroSplits()/splitForGoal() layer on top of.
export const DEFAULT_GOAL_MACRO_SPLITS = {
  cut: { carbs: 40, protein: 40, fat: 20 },
  maintain: { carbs: 40, protein: 35, fat: 25 },
  bulk: { carbs: 50, protein: 30, fat: 20 },
}

// profiles.goal_macro_splits may be null, or missing a phase, or missing a macro within a phase
// (e.g. saved before bulk existed) — fill any gaps from the hardcoded defaults so callers always
// get all 3 phases with all 3 macros.
export function normalizeGoalMacroSplits(raw) {
  const result = {}
  for (const goal of GOAL_TYPES) {
    result[goal] = { ...DEFAULT_GOAL_MACRO_SPLITS[goal], ...(raw?.[goal] || {}) }
  }
  return result
}

// customSplits, if given, should already be normalizeGoalMacroSplits() output.
export function splitForGoal(goalType, customSplits) {
  if (!goalType) return { ...MACRO_SPLIT }
  const source = customSplits?.[goalType] || DEFAULT_GOAL_MACRO_SPLITS[goalType]
  return source ? { ...source } : { ...MACRO_SPLIT }
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

export function calcStandardMacros(calories, goalType, customSplits) {
  return calcMacrosFromSplit(calories, splitForGoal(goalType, customSplits))
}

// Standard protein target — grams per kg of bodyweight, not a % of calories, since how much
// protein someone needs scales with how much of them there is to feed, not with how many
// calories happen to be on the plan. Coach-editable in Settings; 2 is the widely-used default.
export const DEFAULT_PROTEIN_G_PER_KG = 2

export function normalizeProteinPerKg(raw) {
  const n = Number(raw)
  return n > 0 ? n : DEFAULT_PROTEIN_G_PER_KG
}

// Daily macro targets with protein set directly from bodyweight instead of as a % of calories —
// carbs and fat then split whatever calories protein leaves behind, in the same ratio to each
// other as the goal phase's carbs/fat %s (their split vs protein no longer means anything once
// protein isn't a % itself). Falls back to the plain %-of-calories split (calcStandardMacros) when
// bodyweight isn't known yet, rather than showing a misleading 0g protein target.
export function calcBodyweightMacros(calories, bodyweightKg, proteinPerKg, goalType, customSplits) {
  const cals = Number(calories) || 0
  const split = splitForGoal(goalType, customSplits)
  const bw = Number(bodyweightKg) || 0
  if (bw <= 0) return calcMacrosFromSplit(cals, split)
  const protein_g = Math.round(bw * normalizeProteinPerKg(proteinPerKg))
  const remaining = Math.max(0, cals - protein_g * KCAL_PER_G.protein)
  const ratioTotal = (split.carbs || 0) + (split.fat || 0)
  const carbShare = ratioTotal > 0 ? split.carbs / ratioTotal : 0.62
  const fatShare = ratioTotal > 0 ? split.fat / ratioTotal : 0.38
  return {
    protein_g,
    carbs_g: Math.round(remaining * carbShare / KCAL_PER_G.carbs),
    fat_g: Math.round(remaining * fatShare / KCAL_PER_G.fat),
  }
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
