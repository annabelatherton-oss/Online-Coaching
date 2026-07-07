/**
 * AI meal photo generator — uses Pollinations.ai (free, no API key needed).
 * Generates a food photo for every meal that doesn't already have one,
 * uploads it to Supabase storage, and updates photo_url.
 *
 * Usage (run from the project root on your Mac):
 *
 *   COACH_EMAIL=you@example.com \
 *   COACH_PASSWORD=yourpassword \
 *   node scripts/generate-meal-photos.mjs
 *
 * To regenerate ALL photos (including ones that already exist):
 *
 *   OVERWRITE=true \
 *   COACH_EMAIL=you@example.com \
 *   COACH_PASSWORD=yourpassword \
 *   node scripts/generate-meal-photos.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rjaduiqakoudnmkjwwdw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqYWR1aXFha291ZG5ta2p3d2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDg2MDgsImV4cCI6MjA5NzEyNDYwOH0.InJt5LSdg3rYrV6akYxsbCuPmC6jEUHs8HCHMasBUmU'

const EMAIL    = process.env.COACH_EMAIL
const PASSWORD = process.env.COACH_PASSWORD
const OVERWRITE = process.env.OVERWRITE === 'true'

if (!EMAIL || !PASSWORD) {
  console.error('Set COACH_EMAIL and COACH_PASSWORD environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function cookingMethodHint(instructions) {
  if (!instructions) return ''
  // Pull the last step (the serve/plating step) as it best describes the finished dish
  const steps = instructions
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\./.test(l))
  const lastStep = steps[steps.length - 1] || ''
  // Also grab any cooking verbs from the first step
  const firstStep = steps[0] || ''
  const combined = `${firstStep} ${lastStep}`.toLowerCase()

  // Extract key cooking method words to guide the image
  const methods = []
  if (/scrambl/.test(combined)) methods.push('scrambled')
  if (/fried|fry/.test(combined)) methods.push('pan-fried')
  if (/air.fri/.test(combined)) methods.push('crispy')
  if (/bak/.test(combined)) methods.push('baked')
  if (/grill/.test(combined)) methods.push('grilled')
  if (/boil|mash/.test(combined)) methods.push('mashed')
  if (/blend|soup/.test(combined)) methods.push('blended')
  if (/toast/.test(combined)) methods.push('toasted')
  if (/wrap|fold/.test(combined)) methods.push('wrapped')

  return methods.join(', ')
}

function buildPrompt(mealName, ingredients, instructions) {
  const mainIngredients = ingredients
    .slice(0, 5)
    .map(i => i.name)
    .join(', ')
  const method = cookingMethodHint(instructions)
  return [
    `professional food photography of ${mealName}`,
    method ? `${method} dish` : '',
    mainIngredients ? `featuring ${mainIngredients}` : '',
    'served and plated as a finished meal ready to eat,',
    'overhead shot on a white plate, bright natural lighting,',
    'appetizing, high resolution, restaurant quality, no text, no raw ingredients',
  ].filter(Boolean).join(', ')
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchImageWithRetry(prompt, retries = 3) {
  // Use a stable seed derived from the prompt so the same meal always gets
  // the same image on re-runs (unless the prompt changes).
  const seed = prompt.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 99999
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}`

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length < 5000) throw new Error('Response too small — likely an error page')
      return buffer
    } catch (err) {
      if (attempt === retries - 1) throw err
      const delay = 3000 * (attempt + 1)
      console.log(`    retry ${attempt + 1} in ${delay / 1000}s (${err.message})`)
      await sleep(delay)
    }
  }
}

async function main() {
  console.log(`Signing in as ${EMAIL}...`)
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (authErr) { console.error('Sign-in failed:', authErr.message); process.exit(1) }
  const coachId = auth.user.id
  console.log(`Signed in. Coach ID: ${coachId}\n`)

  const { data: meals, error: mealsErr } = await supabase
    .from('meals')
    .select('id, name, instructions, photo_url, meal_ingredients(name)')
    .eq('coach_id', coachId)
    .order('name')

  if (mealsErr) { console.error('Failed to fetch meals:', mealsErr.message); process.exit(1) }

  const toProcess = OVERWRITE
    ? meals
    : meals.filter(m => !m.photo_url)

  console.log(`${toProcess.length} meals to generate (${meals.length - toProcess.length} already have photos)\n`)

  let succeeded = 0, failed = 0

  for (const meal of toProcess) {
    const ingredients = meal.meal_ingredients || []
    const prompt = buildPrompt(meal.name, ingredients, meal.instructions)
    process.stdout.write(`  Generating "${meal.name}"... `)

    try {
      const buffer = await fetchImageWithRetry(prompt)
      const storagePath = `${coachId}/${meal.id}-recipe.jpg`

      const { error: uploadErr } = await supabase.storage
        .from('meal-photos')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
      if (uploadErr) throw uploadErr

      const { error: updateErr } = await supabase
        .from('meals')
        .update({ photo_url: storagePath })
        .eq('id', meal.id)
      if (updateErr) throw updateErr

      console.log('OK')
      succeeded++
    } catch (err) {
      console.log(`FAIL (${err.message})`)
      failed++
    }

    // Pollinations rate limit — be polite
    await sleep(2500)
  }

  console.log(`\nDone: ${succeeded} generated, ${failed} failed.`)
}

main().catch(console.error)
