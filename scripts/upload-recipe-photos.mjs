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

// Exact meal names as they exist in the database
const RECIPES = [
  // ── BREAKFAST ─────────────────────────────────────────────────────────────
  { name: 'Overnight Oats',                          file: 'Overnight Oats.jpg' },
  { name: 'Overnight Weetabix',                      file: 'Overnight Weetabix.jpg' },
  { name: 'Chia Pudding',                            file: '5.jpg' },
  { name: 'Porridge',                                file: '6.jpg' },
  { name: 'Protein Pancakes',                        file: '7.jpg' },
  { name: 'Breafkast Wrap',                          file: '8.jpg' },
  { name: 'Breakfast Bagel',                         file: '9.jpg' },
  { name: 'Chicken Sausage Bagel',                   file: '10.jpg' },
  { name: 'Scrambled Egg Bagel',                     file: '11.jpg' },
  { name: 'Avacado Bagel',                           file: '13.jpg' },
  { name: 'PB&J Bagel',                              file: '14.jpg' },
  { name: 'Yogurt',                                  file: 'Yogurt Bowl (2).jpg' },

  // ── LUNCH ─────────────────────────────────────────────────────────────────
  { name: 'Avacado and Egg on Sourdough',            file: '16.jpg' },
  { name: 'Sweet Chilli Chicken Wrap',               file: '17.jpg' },
  { name: 'BBQ Chicken Wrap',                        file: '18.jpg' },
  { name: 'Jerk Chicken Cheese Burger',              file: '19.jpg' },
  { name: 'Tuna and Cheese Bagel',                   file: '20.jpg' },
  { name: 'Club Sandwich',                           file: '21.jpg' },
  { name: 'Beans on Toast',                          file: '22.jpg' },
  { name: 'Cheesy Chicken and Chorizo Wrap',         file: '23.jpg' },
  { name: 'Cheese Burger Wrap',                      file: '24.jpg' },
  { name: 'Tuna Bun',                                file: '25.jpg' },
  { name: 'Chicken Salad',                           file: '26.jpg' },
  { name: 'Tuna Pasta',                              file: '27.jpg' },
  { name: 'Chicken and Rice',                        file: '28.jpg' },
  { name: 'Chicken and Egg Fried Rice',              file: '29.jpg' },
  { name: 'Roasted Tomato Pepper and Feta Soup',     file: '30.jpg' },

  // ── PRE-WORKOUT ───────────────────────────────────────────────────────────
  { name: 'Rice Cakes',                              file: '32.jpg' },
  { name: 'Cereal',                                  file: '33.jpg' },
  { name: 'Oats',                                    file: '34.jpg' },

  // ── DINNER ────────────────────────────────────────────────────────────────
  { name: 'Sweet Chilli Chicken Egg Fried Rice',     file: '36.jpg' },
  { name: 'Sticky Honey Chicken and Rice',           file: '37.jpg' },
  { name: 'Chicken and Chorizo Rice',                file: '38.jpg' },
  { name: 'Stir Fry',                                file: '39.jpg' },
  { name: 'Cheesy Beef Pasta',                       file: '40.jpg' },
  { name: 'Creamy Chicken Pasta',                    file: '41.jpg' },
  { name: 'Chicken, Hallouimi and Chorizo Pasta',    file: '42.jpg' },
  { name: 'Creamy Cajun Chicken Pasta',              file: '43.jpg' },
  { name: 'Creamy Nandos Chicken Pasta',             file: '44.jpg' },
  { name: 'Chicken Sausage and Mascarpone',          file: '45.jpg' },
  { name: 'Reduced Lasange',                         file: '46.jpg' },
  { name: 'Spaghetti Bolognase',                     file: '47.jpg' },
  { name: 'Nandos Orzo',                             file: '48.jpg' },
  { name: 'Steak and Poatoes',                       file: '49.jpg' },
  { name: 'Salmon and Potatoes',                     file: '50.jpg' },
]

async function uploadPhoto(filePath, storagePath) {
  const buffer = readFileSync(filePath)
  const { error } = await supabase.storage
    .from('meal-photos')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return storagePath
}

async function findMeal(exactName) {
  const { data, error } = await supabase
    .from('meals')
    .select('id, name, photo_url')
    .eq('coach_id', COACH_ID)
    .eq('name', exactName)
    .limit(2)
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
    const meals = await findMeal(recipe.name)
    if (meals.length === 0) {
      console.log(`  SKIP (no match): "${recipe.name}"`)
      skipped++
      continue
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
