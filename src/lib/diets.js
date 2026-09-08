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

// True if any of the given ingredient names contains a keyword forbidden by this diet.
export function ingredientsViolateDiet(ingredientNames, dietKey) {
  const forbidden = DIET_FORBIDDEN_KEYWORDS[dietKey] || []
  return (ingredientNames || []).some(name => {
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
    const lower = (ing.name || '').toLowerCase()
    const kw = forbidden.find(k => lower.includes(k))
    if (kw) hits.push(ing.name)
  }
  return hits
}
