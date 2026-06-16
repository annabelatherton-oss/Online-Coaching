// Bulk meal photo uploader — interactive mode
// Usage: node upload-photos.mjs /path/to/photos/folder

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, basename, extname } from 'path'
import { createInterface } from 'readline'
import { execSync } from 'child_process'

function readEnv() {
  const content = readFileSync(new URL('./.env', import.meta.url), 'utf8')
  const env = {}
  content.split('\n').forEach(line => {
    const eqIdx = line.indexOf('=')
    if (eqIdx > 0) env[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim()
  })
  return env
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function findBestMatch(name, meals) {
  const target = normalize(name)
  let best = null, bestScore = 0
  for (const meal of meals) {
    const n = normalize(meal.name)
    if (n === target) return { meal, score: 1 }
    const targetWords = target.split(' ')
    const nWords = n.split(' ')
    const overlap = targetWords.filter(w => nWords.includes(w)).length
    const score = overlap / Math.max(targetWords.length, nWords.length)
    if (score > bestScore && score >= 0.5) { bestScore = score; best = meal }
  }
  return best && bestScore >= 0.5 ? { meal: best, score: bestScore } : null
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function uploadPhoto(supabase, coachId, filePath, file, mealId) {
  const ext = extname(file).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const storagePath = `${coachId}/${Date.now()}-${file.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')}`
  const fileBuffer = readFileSync(filePath)
  const { error: uploadErr } = await supabase.storage.from('meal-photos').upload(storagePath, fileBuffer, { contentType: mimeType })
  if (uploadErr) return { error: uploadErr.message }
  await supabase.from('meals').update({ photo_url: storagePath }).eq('id', mealId)
  return { path: storagePath }
}

async function main() {
  const photosDir = process.argv[2]
  if (!photosDir) {
    console.log('Usage: node upload-photos.mjs /path/to/photos/folder')
    process.exit(1)
  }
  if (!existsSync(photosDir)) {
    console.log('Folder not found:', photosDir)
    process.exit(1)
  }

  const env = readEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  console.log('\n── Meal Photo Uploader ────────────────────────\n')
  const email = await ask(rl, 'Coach email: ')
  const password = await ask(rl, 'Coach password: ')

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) { console.log('Login failed:', authError.message); rl.close(); process.exit(1) }
  const coachId = authData.user.id
  console.log('✓ Logged in\n')

  const { data: meals } = await supabase.from('meals').select('id, name').eq('coach_id', coachId).order('name')
  console.log(`✓ ${meals.length} meals found in your database\n`)

  const imageExts = ['.jpg', '.jpeg', '.png', '.webp']
  const files = readdirSync(photosDir)
    .filter(f => imageExts.includes(extname(f).toLowerCase()))
    .sort()

  console.log(`✓ ${files.length} images found in folder`)
  console.log('─────────────────────────────────────────────────')
  console.log('For each image: type the meal name (or part of it) and press Enter.')
  console.log('Press Enter with no text to skip.\n')

  let uploaded = 0, skipped = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filePath = join(photosDir, file)

    // Open image on screen
    try { execSync(`open "${filePath}"`) } catch {}

    console.log(`\n[${i + 1}/${files.length}] ${file}`)

    let mealMatch = null
    while (true) {
      const input = await ask(rl, 'Meal name (or Enter to skip): ')
      if (!input.trim()) { skipped++; break }

      mealMatch = findBestMatch(input.trim(), meals)
      if (mealMatch) {
        const confirm = await ask(rl, `  → Match: "${mealMatch.meal.name}" — correct? (y/n): `)
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes' || confirm === '') {
          break
        }
        mealMatch = null
      } else {
        console.log('  No match found. Try a shorter version of the name, e.g. "overnight oats"')
      }
    }

    if (mealMatch) {
      const result = await uploadPhoto(supabase, coachId, filePath, file, mealMatch.meal.id)
      if (result.error) {
        console.log(`  ✗ Upload failed: ${result.error}`)
      } else {
        console.log(`  ✓ Uploaded to "${mealMatch.meal.name}"`)
        uploaded++
      }
    }
  }

  rl.close()
  console.log(`\n─────────────────────────────────────────────────`)
  console.log(`Done! ${uploaded} uploaded, ${skipped} skipped.`)
}

main().catch(console.error)
