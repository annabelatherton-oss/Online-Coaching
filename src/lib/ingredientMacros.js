// A library ingredient's serving_size must be greater than 0 to convert its per-serving macros
// into a per-gram rate. The Ingredients Library form enforces that on save ("Serving size must be
// greater than 0"), but a handful of older or imported rows can still have it missing or zero —
// and every place that adds or swaps in an ingredient by weight used to divide by it directly, with
// no guard (or an inconsistent one: several spots defaulted the QUANTITY to 100 when serving_size
// was invalid but still computed the per-gram factor from the invalid value, zeroing every macro
// while the quantity field looked completely normal). That's what a client spotted on a bagel —
// calories reading 0 for a real, non-zero quantity — and the same pattern was duplicated across
// half a dozen add/swap functions. Every one of them should go through here instead, so an invalid
// serving_size always falls back the same way (the same 100 a brand-new ingredient starts on)
// rather than silently zeroing a meal's calories.
export function usableServingSize(libIng) {
  const s = parseFloat(libIng?.serving_size)
  return s > 0 ? s : 100
}

export function hasValidServingSize(libIng) {
  return parseFloat(libIng?.serving_size) > 0
}

function round1(n) {
  return Math.round(n * 10) / 10
}

// {calories, protein_g, carbs_g, fat_g} for `qty` grams (or servings, if serving_unit isn't grams)
// of a library ingredient — the one place this per-gram conversion happens, so it can't drift out
// of sync between the half-dozen call sites that need it.
export function macrosForQty(libIng, qty) {
  const f = qty / usableServingSize(libIng)
  return {
    calories:  round1(f * (libIng?.calories_per_serving || 0)),
    protein_g: round1(f * (libIng?.protein_per_serving  || 0)),
    carbs_g:   round1(f * (libIng?.carbs_per_serving    || 0)),
    fat_g:     round1(f * (libIng?.fat_per_serving       || 0)),
  }
}
