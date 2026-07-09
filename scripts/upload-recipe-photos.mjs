/**
 * Recipe photo upload script.
 * Signs in with your coach email/password, uploads recipe photos to
 * Supabase storage, then updates each meal's photo_url.
 *
 * Usage (run from the project root on your Mac):
 *
 *   COACH_EMAIL=you@example.com \
 *   COACH_PASSWORD=yourpassword \
 *   IMAGES_DIR=/path/to/extracted/recipe-images \
 *   node scripts/upload-recipe-photos.mjs
 *
 * IMAGES_DIR should be the folder containing:
 *   "Overnight Oats.jpg", "Overnight Weetabix.jpg",
 *   "Yogurt Bowl (2).jpg", "5.jpg" … "50.jpg"
 * (just extract the Low_Calorie_Recipe_Book zip anywhere)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://rjaduiqakoudnmkjwwdw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqYWR1aXFha291ZG5ta2p3d2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDg2MDgsImV4cCI6MjA5NzEyNDYwOH0.InJt5LSdg3rYrV6akYxsbCuPmC6jEUHs8HCHMasBUmU'

const EMAIL    = process.env.COACH_EMAIL
const PASSWORD = process.env.COACH_PASSWORD
const IMAGES_DIR = process.env.IMAGES_DIR || '.'

if (!EMAIL || !PASSWORD) {
  console.error('Set COACH_EMAIL and COACH_PASSWORD environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Exact meal names as stored in the database → image filename
const RECIPES = [
  // ── BREAKFAST ───────────────────────────────────────────────────────────
  // New high-quality images (from Food Images folder)
  { name: 'Raspberry Overnight Weetabix',           file: 'Raspberry Overnight Weetabix.jpg' },
  { name: 'Overnight Weetabix',                     file: 'Raspberry Overnight Weetabix.jpg' },
  { name: 'Raspberry Overnight Oats',               file: 'lucid-origin_overnight_oats_in_a_delicate_glass_jar_topped_with_a_vibrant_raspberry_compote_g-0.jpg' },
  { name: 'Overnight Oats',                         file: 'lucid-origin_overnight_oats_in_a_delicate_glass_jar_topped_with_a_vibrant_raspberry_compote_g-0.jpg' },
  { name: 'Biscoff Overnight Oats',                 file: 'lucid-origin_overnight_oats_in_a_delicate_glass_jar_topped_with_a_vibrant_raspberry_compote_g-0.jpg' },
  { name: 'Strawberry Cheesecake Overnight Oats',   file: 'lucid-origin_overnight_oats_in_a_delicate_glass_jar_topped_with_a_vibrant_raspberry_compote_g-0.jpg' },
  { name: 'Chia Pudding',                           file: '5.jpg' },
  { name: 'Porridge',                               file: '6.jpg' },
  { name: 'Porridge and Honey',                     file: '6.jpg' },
  { name: 'Protein Pancakes',                       file: '7.jpg' },
  { name: 'Breafkast Wrap',                         file: '8.jpg' },
  { name: 'Breakfast Bagel',                        file: '9.jpg' },
  { name: 'Chicken Sausage Bagel',                  file: '10.jpg' },
  { name: 'Scrambled Egg Bagel',                    file: '11.jpg' },
  { name: 'Avacado Bagel',                          file: '13.jpg' },
  { name: 'PB&J Bagel',                             file: '14.jpg' },
  { name: 'Yogurt',                                 file: 'Yogurt Bowl (2).jpg' },
  { name: 'Yogurt Bowl',                            file: 'Yogurt Bowl (2).jpg' },

  // ── LUNCH ───────────────────────────────────────────────────────────────
  { name: 'Avacado and Egg on Sourdough',           file: '16.jpg' },
  { name: 'Sweet Chilli Chicken Wrap',              file: '17.jpg' },
  { name: 'BBQ Chicken Wrap',                       file: '18.jpg' },
  { name: 'Jerk Chicken Cheese Burger',             file: '19.jpg' },
  { name: 'Tuna and Cheese Bagel',                  file: '20.jpg' },
  { name: 'Club Sandwich',                          file: '21.jpg' },
  { name: 'Beans on Toast',                         file: '22.jpg' },
  { name: 'Cheesy Chicken and Chorizo Wrap',        file: '23.jpg' },
  { name: 'Cheese Burger Wrap',                     file: '24.jpg' },
  { name: 'Tuna Bun',                               file: '25.jpg' },
  { name: 'Chicken Salad',                          file: '26.jpg' },
  { name: 'Tuna Pasta',                             file: '27.jpg' },
  { name: 'Chicken and Rice',                       file: '28.jpg' },
  { name: 'Chicken and Egg Fried Rice',             file: '29.jpg' },
  { name: 'Roasted Tomato Pepper and Feta Soup',    file: '30.jpg' },

  // ── PRE-WORKOUT ─────────────────────────────────────────────────────────
  { name: 'Rice Cakes',                             file: '32.jpg' },
  { name: 'Cereal',                                 file: '33.jpg' },
  { name: 'Oats',                                   file: '34.jpg' },
  { name: 'Protein Oats',                           file: '34.jpg' },

  // ── DINNER ──────────────────────────────────────────────────────────────
  { name: 'Sweet Chilli Chicken Egg Fried Rice',    file: '36.jpg' },
  { name: 'Sticky Honey Chicken and Rice',          file: '37.jpg' },
  { name: 'Chicken and Chorizo Rice',               file: '38.jpg' },
  { name: 'Stir Fry',                               file: '39.jpg' },
  { name: 'Cheesy Beef Pasta',                      file: '40.jpg' },
  { name: 'Creamy Chicken Pasta',                   file: '41.jpg' },
  { name: 'Chicken, Hallouimi and Chorizo Pasta',   file: '42.jpg' },
  { name: 'Creamy Cajun Chicken Pasta',             file: '43.jpg' },
  { name: 'Creamy Nandos Chicken Pasta',            file: '44.jpg' },
  { name: 'Chicken Sausage and Mascarpone',         file: '45.jpg' },
  { name: 'Reduced Lasange',                        file: '46.jpg' },
  { name: 'Spaghetti Bolognase',                    file: '47.jpg' },
  { name: 'Nandos Orzo',                            file: '48.jpg' },
  { name: 'Steak and Poatoes',                      file: '49.jpg' },
  { name: 'Salmon and Potatoes',                    file: '50.jpg' },
]

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function uploadWithRetry(storagePath, buffer, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { error } = await supabase.storage
        .from('meal-photos')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
      if (!error) return null
      // Non-network Supabase error — don't retry
      return error
    } catch (err) {
      if (attempt === retries - 1) throw err
      const delay = 2000 * Math.pow(2, attempt)
      console.log(`    retry ${attempt + 1} in ${delay / 1000}s...`)
      await sleep(delay)
    }
  }
}

async function main() {
  // Sign in
  console.log(`Signing in as ${EMAIL}...`)
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (authErr) { console.error('Sign-in failed:', authErr.message); process.exit(1) }
  const coachId = auth.user.id
  console.log(`Signed in. Coach ID: ${coachId}\n`)

  let succeeded = 0, skipped = 0, failed = 0

  for (const recipe of RECIPES) {
    const imagePath = join(IMAGES_DIR, recipe.file)

    if (!existsSync(imagePath)) {
      console.log(`  SKIP (file not found): ${recipe.file}`)
      skipped++
      continue
    }

    // Find meal by exact name
    const { data: meals, error: queryErr } = await supabase
      .from('meals')
      .select('id, name')
      .eq('coach_id', coachId)
      .eq('name', recipe.name)
      .limit(1)
    if (queryErr) { console.error(`  ERROR querying "${recipe.name}":`, queryErr.message); failed++; continue }
    if (!meals || meals.length === 0) {
      console.log(`  SKIP (no DB match): "${recipe.name}"`)
      skipped++
      continue
    }

    const meal = meals[0]
    const storagePath = `${coachId}/${meal.id}-recipe.jpg`

    try {
      const buffer = readFileSync(imagePath)
      const uploadErr = await uploadWithRetry(storagePath, buffer)
      if (uploadErr) throw uploadErr

      const { error: updateErr } = await supabase
        .from('meals')
        .update({ photo_url: storagePath })
        .eq('id', meal.id)
      if (updateErr) throw updateErr

      console.log(`  OK: "${meal.name}"`)
      succeeded++
    } catch (err) {
      console.error(`  FAIL: "${meal.name}": ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${succeeded} uploaded, ${skipped} skipped, ${failed} failed.`)

  // Show all meals still missing a photo so renamed meals can be identified
  console.log('\nFetching meals still without a photo...')
  const { data: missing } = await supabase
    .from('meals')
    .select('name, category')
    .eq('coach_id', coachId)
    .or('photo_url.is.null,photo_url.eq.')
    .order('category')
  if (missing && missing.length > 0) {
    console.log('\nMeals with no photo yet (check for renamed ones):')
    for (const m of missing) {
      console.log(`  [${m.category}] "${m.name}"`)
    }
  } else {
    console.log('All meals have photos!')
  }
}

main().catch(console.error)
