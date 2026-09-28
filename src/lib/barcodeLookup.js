import { supabase } from './supabase'

// Open Food Facts is a free, keyless, CORS-enabled product database, so this hits it directly
// from the browser rather than through an Edge Function — there's no secret to protect.
const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product'

function normalizeName(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

// Catches "already in the library under a slightly different name" (a coach-typed "Snickers" vs
// Open Food Facts' "Snickers Bar — Mars", or punctuation/case differences) without a full fuzzy-
// matching library: exact match on the normalized name, or every word of the shorter normalized
// name appearing in the longer one. Requires at least 2 words on the shorter side so a single
// generic word (e.g. "Milk") doesn't match everything that happens to contain it.
function findFuzzyNameMatch(names, candidates) {
  const targets = names.map(normalizeName).filter(Boolean)
  for (const cand of candidates) {
    const candNorm = normalizeName(cand.name)
    if (!candNorm) continue
    for (const t of targets) {
      if (candNorm === t) return cand
      const [shorter, longer] = candNorm.length <= t.length ? [candNorm, t] : [t, candNorm]
      const shortWords = shorter.split(' ').filter(Boolean)
      if (shortWords.length >= 2 && shortWords.every(w => longer.includes(w))) return cand
    }
  }
  return null
}

function macrosFromOFF(product) {
  const n = product?.nutriments || {}
  const per100 = {
    cal:  n['energy-kcal_100g'] ?? 0,
    prot: n['proteins_100g']    ?? 0,
    carb: n['carbohydrates_100g'] ?? 0,
    fat:  n['fat_100g']         ?? 0,
  }
  // The product's own declared serving size is what someone would actually eat in one go;
  // falls back to a flat 100g ("per 100g") when the product doesn't declare one.
  const servingG = parseFloat(product?.serving_quantity) || 100
  const ratio = servingG / 100
  return {
    servingSize: Math.round(servingG),
    servingUnit: 'g',
    calories: Math.round(per100.cal * ratio),
    protein:  Math.round(per100.prot * ratio * 10) / 10,
    carbs:    Math.round(per100.carb * ratio * 10) / 10,
    fat:      Math.round(per100.fat * ratio * 10) / 10,
  }
}

/**
 * Resolves a scanned barcode to an ingredient-shaped object: { id, name, serving_size,
 * serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving }.
 * Checks this coach's own cached ingredients first (instant, no network), then falls back to
 * Open Food Facts for a genuinely new product and caches the result for next time. Returns null
 * if neither has it — the caller should fall back to manual search/entry, not treat it as an error
 * (plenty of home-made or loose items simply aren't in Open Food Facts).
 */
export async function lookupBarcode(barcode, coachId) {
  const { data: cached } = await supabase
    .from('ingredients')
    .select('*')
    .eq('coach_id', coachId)
    .eq('barcode', barcode)
    .maybeSingle()
  if (cached) return cached

  let product
  try {
    const res = await fetch(`${OFF_URL}/${encodeURIComponent(barcode)}.json?fields=product_name,brands,nutriments,serving_quantity`)
    const json = await res.json()
    if (json.status !== 1 || !json.product) return null
    product = json.product
  } catch {
    return null
  }

  const macros = macrosFromOFF(product)
  const name = [product.product_name, product.brands].filter(Boolean).join(' — ').slice(0, 200) || `Scanned item (${barcode})`

  // Before creating a new entry, check whether this product is already in the library under a
  // slightly different name — added directly by the coach, or cached from a scan before barcodes
  // were tracked at all. If so, just tag that existing row with this barcode and use it, rather
  // than growing the library with a near-duplicate every time someone scans it.
  const { data: existing } = await supabase.from('ingredients').select('*').eq('coach_id', coachId)
  const fuzzyMatch = findFuzzyNameMatch([name, product.product_name], existing || [])
  if (fuzzyMatch) {
    if (!fuzzyMatch.barcode) {
      await supabase.from('ingredients').update({ barcode }).eq('id', fuzzyMatch.id)
    }
    return { ...fuzzyMatch, barcode }
  }

  const row = {
    coach_id: coachId,
    barcode,
    name,
    serving_size: macros.servingSize,
    serving_unit: macros.servingUnit,
    calories_per_serving: macros.calories,
    protein_per_serving: macros.protein,
    carbs_per_serving: macros.carbs,
    fat_per_serving: macros.fat,
  }

  // Insert can lose a race to another client scanning the same product at the same moment, or
  // collide on the (coach_id, name) constraint if this exact name already exists for another
  // reason — either way it's a unique-violation, and re-reading by barcode below recovers
  // whichever row actually ended up saved. If caching genuinely failed for some other reason,
  // the looked-up macros are still returned (with id: null) so the client can log their treat.
  const { error: insertErr } = await supabase.from('ingredients').insert(row)
  if (insertErr && insertErr.code !== '23505') return { ...row, id: null }

  const { data: saved } = await supabase
    .from('ingredients')
    .select('*')
    .eq('coach_id', coachId)
    .eq('barcode', barcode)
    .maybeSingle()
  return saved || { ...row, id: null }
}
