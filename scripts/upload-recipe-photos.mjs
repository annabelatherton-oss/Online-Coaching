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
  { name: 'Overnight Oats',                         file: 'Overnight Oats.jpg' },
  { name: 'Overnight Weetabix',                     file: 'Overnight Weetabix.jpg' },
  { name: 'Chia Pudding',                           file: '5.jpg' },
  { name: 'Porridge',                               file: '6.jpg' },
  { name: 'Protein Pancakes',                       file: '7.jpg' },
  { name: 'Breafkast Wrap',                         file: '8.jpg' },
  { name: 'Breakfast Bagel',                        file: '9.jpg' },
  { name: 'Chicken Sausage Bagel',                  file: '10.jpg' },
  { name: 'Scrambled Egg Bagel',                    file: '11.jpg' },
  { name: 'Avacado Bagel',                          file: '13.jpg' },
  { name: 'PB&J Bagel',                             file: '14.jpg' },
  { name: 'Yogurt',                                 file: 'Yogurt Bowl (2).jpg' },

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
      const { error: uploadErr } = await supabase.storage
        .from('meal-photos')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
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
}

main().catch(console.error)
