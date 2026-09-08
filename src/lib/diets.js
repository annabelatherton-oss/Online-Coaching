import { ALLERGEN_KEYWORDS } from './mealSwaps'

export const DIET_LABELS = {
  vegetarian:  'Vegetarian',
  vegan:       'Vegan',
  pescatarian: 'Pescatarian',
  gluten_free: 'Gluten-Free',
  dairy_free:  'Dairy-Free',
}

export const DIETS = Object.keys(DIET_LABELS)

const MEAT_KEYWORDS = [
  'chicken', 'turkey', 'beef', 'steak', 'mince', 'pork', 'lamb', 'bacon', 'sausage',
  'chorizo', 'gammon', 'ham', 'salami', 'pepperoni', 'duck', 'venison', 'meatball',
]

// Ingredient-name keywords each diet must avoid — reuses the same allergen keyword lists the
// allergy-conflict system already relies on, so "gluten-free"/"dairy-free" catch exactly what a
// gluten/dairy allergy would. This is name-matching, same approach and same limitations as the
// existing allergen system — a starting point for the coach to review, not a guarantee.
export const DIET_FORBIDDEN_KEYWORDS = {
  vegetarian:  [...MEAT_KEYWORDS, ...ALLERGEN_KEYWORDS.fish, ...ALLERGEN_KEYWORDS.shellfish],
  vegan:       [...MEAT_KEYWORDS, ...ALLERGEN_KEYWORDS.fish, ...ALLERGEN_KEYWORDS.shellfish, ...ALLERGEN_KEYWORDS.dairy, ...ALLERGEN_KEYWORDS.eggs, 'honey'],
  pescatarian: [...MEAT_KEYWORDS],
  gluten_free: [...ALLERGEN_KEYWORDS.gluten],
  dairy_free:  [...ALLERGEN_KEYWORDS.dairy],
}

// Named products that would otherwise trip a forbidden keyword by coincidence — "Gluten Free
// Oats" contains "oat" (a gluten keyword, since regular oats are often cross-contaminated), and
// "Oat Milk" contains "milk" (a dairy keyword) despite being a plant milk. Checked before the
// forbidden-keyword scan below so a product explicitly labelled for the diet isn't excluded from
// its own diet's plan by the very keyword that makes it safe.
// A name starting "Vegan " (e.g. "Vegan Mince", "Vegan Cheese Slice") is meat/fish/dairy/egg-free
// by definition, even though it trips a forbidden keyword by coincidence ("mince", "cheese") —
// applies everywhere those keywords are forbidden: vegetarian, vegan, and dairy-free.
const VEGAN_LABELLED = /^vegan\b/
// A plant milk contains "milk" (a dairy keyword) without being dairy — applies to both dairy-free
// and vegan, since dairy is forbidden under both.
const PLANT_MILK = /\b(oat|almond|soy|soya|coconut|rice|cashew)\s*milk\b/

const DIET_SAFE_EXCEPTIONS = {
  // Quorn's whole range is meat-free by definition, despite product names like "Quorn Mince" or
  // "Quorn Chicken Pieces" containing a meat keyword — but Quorn isn't vegan (most of the range
  // is bound with egg white), so this exception is scoped to vegetarian only.
  vegetarian: [/^quorn\b/, VEGAN_LABELLED],
  vegan: [VEGAN_LABELLED, PLANT_MILK],
  gluten_free: [/gluten[\s-]?free/],
  dairy_free: [PLANT_MILK, VEGAN_LABELLED, /dairy[\s-]?free/],
}

function isDietSafeException(name, dietKey) {
  const exceptions = DIET_SAFE_EXCEPTIONS[dietKey]
  if (!exceptions) return false
  const lower = (name || '').toLowerCase()
  return exceptions.some(re => re.test(lower))
}

// True if any of the given ingredient names contains a keyword forbidden by this diet.
export function ingredientsViolateDiet(ingredientNames, dietKey) {
  const forbidden = DIET_FORBIDDEN_KEYWORDS[dietKey] || []
  return (ingredientNames || []).some(name => {
    if (isDietSafeException(name, dietKey)) return false
    const lower = (name || '').toLowerCase()
    return forbidden.some(kw => lower.includes(kw))
  })
}

// Which of a meal's base ingredients tripped a diet's forbidden keywords — used to show the
// coach exactly why a meal got auto-excluded, so a false positive is easy to spot and undo.
export function dietViolations(meal, dietKey) {
  const forbidden = DIET_FORBIDDEN_KEYWORDS[dietKey] || []
  const hits = []
  for (const ing of (meal.meal_ingredients || [])) {
    if (isDietSafeException(ing.name, dietKey)) continue
    const lower = (ing.name || '').toLowerCase()
    const kw = forbidden.find(k => lower.includes(k))
    if (kw) hits.push(ing.name)
  }
  return hits
}
