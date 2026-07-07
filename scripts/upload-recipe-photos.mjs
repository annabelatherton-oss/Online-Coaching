/**
 * Recipe photo upload script.
 * Uploads photos from the extracted recipe book images to Supabase storage,
 * then updates each meal's photo_url in the database.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=your-service-role-key \
 *   COACH_ID=your-coach-uuid \
 *   IMAGES_DIR=/path/to/extracted/recipe-images \
 *   node scripts/upload-recipe-photos.mjs
 *
 * SUPABASE_URL      – your project URL (VITE_SUPABASE_URL from .env)
 * SUPABASE_SERVICE_KEY – service_role key from Supabase Dashboard →
 *                        Settings → API → Project API keys
 * COACH_ID          – your user UUID from Supabase Dashboard →
 *                        Authentication → Users → your email
 * IMAGES_DIR        – folder containing the extracted recipe JPEGs
 *                     (extract the Low_Calorie_Recipe_Book zip here)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const COACH_ID = process.env.COACH_ID
const IMAGES_DIR = process.env.IMAGES_DIR || '.'

if (!SUPABASE_URL || !SUPABASE_KEY || !COACH_ID) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, COACH_ID')
  console.error('Also set IMAGES_DIR to the folder containing the extracted recipe JPEGs.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Map of meal name patterns (ILIKE) to image file paths
const RECIPES = [
  // ── BREAKFAST ─────────────────────────────────────────────────────────────
  { namePattern: 'overnight oats',                   file: 'Overnight Oats.jpg' },
  { namePattern: '%weetabix%',                       file: 'Overnight Weetabix.jpg' },
  { namePattern: '%chia pudding%',                   file: '5.jpg' },
  { namePattern: 'porridge',                         file: '6.jpg' },
  { namePattern: '%protein pancake%',                file: '7.jpg' },
  { namePattern: 'breakfast wrap',                   file: '8.jpg' },
  { namePattern: 'breakfast bagel',                  file: '9.jpg' },
  { namePattern: 'chicken sausage bagel',            file: '10.jpg' },
  { namePattern: 'scrambled egg bagel',              file: '11.jpg' },
  { namePattern: 'jam%egg bagel',                    file: '12.jpg' },
  { namePattern: 'avocado bagel',                    file: '13.jpg' },
  { namePattern: 'pb%j bagel',                       file: '14.jpg' },
  { namePattern: 'yogurt bowl',                      file: 'Yogurt Bowl (2).jpg' },

  // ── LUNCH ─────────────────────────────────────────────────────────────────
  { namePattern: 'avocado%egg%sourdough',            file: '16.jpg' },
  { namePattern: 'sweet chilli chicken wrap',        file: '17.jpg' },
  { namePattern: 'bbq chicken wrap',                 file: '18.jpg' },
  { namePattern: 'jerk chicken%burger',              file: '19.jpg' },
  { namePattern: 'tuna%cheese bagel',                file: '20.jpg' },
  { namePattern: 'club sandwich',                    file: '21.jpg' },
  { namePattern: 'beans%cheese%toast',               file: '22.jpg' },
  { namePattern: 'cheesy chicken%chorizo wrap',      file: '23.jpg' },
  { namePattern: 'cheeseburger wrap',                file: '24.jpg' },
  { namePattern: 'tuna bun%rice cake%',              file: '25.jpg' },
  { namePattern: 'chicken pasta salad',              file: '26.jpg' },
  { namePattern: 'tuna pasta',                       file: '27.jpg' },
  { namePattern: 'chicken%rice%broccoli',            file: '28.jpg' },
  { namePattern: 'chicken%egg fried rice',           file: '29.jpg' },
  { namePattern: '%tomato%feta%soup%',               file: '30.jpg' },

  // ── PRE-WORKOUT ───────────────────────────────────────────────────────────
  { namePattern: 'rice cakes%banana',                file: '32.jpg' },
  { namePattern: 'cereal%protein%',                  file: '33.jpg' },
  { namePattern: 'protein oats',                     file: '34.jpg' },

  // ── DINNER ────────────────────────────────────────────────────────────────
  { namePattern: 'sweet chilli%chicken%fried rice',  file: '36.jpg' },
  { namePattern: 'sticky honey chicken%rice',        file: '37.jpg' },
  { namePattern: 'chicken%chorizo rice',             file: '38.jpg' },
  { namePattern: 'chicken stir%fry',                 file: '39.jpg' },
  { namePattern: 'cheesy beef pasta',                file: '40.jpg' },
  { namePattern: 'creamy chicken pasta',             file: '41.jpg' },
  { namePattern: 'chicken%halloumi%chorizo pasta',   file: '42.jpg' },
  { namePattern: 'creamy cajun chicken pasta',       file: '43.jpg' },
  { namePattern: 'nandos%chicken pasta',             file: '44.jpg' },
  { namePattern: 'chicken sausage%mascarpone pasta', file: '45.jpg' },
  { namePattern: 'lasagne',                          file: '46.jpg' },
  { namePattern: 'spaghetti bol%',                   file: '47.jpg' },
  { namePattern: '%peri%orzo%',                      file: '48.jpg' },
  { namePattern: 'steak%potat%',                     file: '49.jpg' },
  { namePattern: 'salmon%potat%',                    file: '50.jpg' },
]

async function uploadPhoto(filePath, storagePath) {
  const buffer = readFileSync(filePath)
  const { error } = await supabase.storage
    .from('meal-photos')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return storagePath
}

async function findMeal(pattern) {
  const { data, error } = await supabase
    .from('meals')
    .select('id, name, photo_url')
    .eq('coach_id', COACH_ID)
    .ilike('name', pattern)
    .limit(5)
  if (error) throw error
  return data || []
}

async function updateMealPhoto(mealId, storagePath) {
  const { error } = await supabase
    .from('meals')
    .update({ photo_url: storagePath })
    .eq('id', mealId)
  if (error) throw error
}

async function main() {
  console.log(`Uploading ${RECIPES.length} recipe photos for coach ${COACH_ID}...\n`)
  let succeeded = 0, skipped = 0, failed = 0

  for (const recipe of RECIPES) {
    const imagePath = join(IMAGES_DIR, recipe.file)

    // Find matching meals
    const meals = await findMeal(recipe.namePattern)
    if (meals.length === 0) {
      console.log(`  SKIP (no match): pattern="${recipe.namePattern}"`)
      skipped++
      continue
    }
    if (meals.length > 1) {
      console.log(`  WARN: ${meals.length} matches for "${recipe.namePattern}": ${meals.map(m => m.name).join(', ')}`)
    }

    const meal = meals[0]
    const storagePath = `${COACH_ID}/recipe-${meal.id.slice(0, 8)}.jpg`

    try {
      await uploadPhoto(imagePath, storagePath)
      await updateMealPhoto(meal.id, storagePath)
      console.log(`  OK: "${meal.name}" → ${storagePath}`)
      succeeded++
    } catch (err) {
      console.error(`  FAIL: "${meal.name}": ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${succeeded} uploaded, ${skipped} skipped, ${failed} failed.`)
}

main().catch(console.error)
