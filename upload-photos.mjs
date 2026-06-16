// Bulk meal photo uploader
// Usage: node upload-photos.mjs /path/to/photos/folder
// The script matches image filenames to meal names and uploads them to Supabase.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, basename, extname } from 'path'
import { createInterface } from 'readline'

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

function findBestMatch(filename, meals) {
  const target = normalize(basename(filename, extname(filename)))
  let best = null, bestScore = 0

  for (const meal of meals) {
    const n = normalize(meal.name)
    if (n === target) return { meal, score: 1 }

    // Check if one contains the other
    if (n.includes(target) || target.includes(n)) {
      const score = Math.min(n.length, target.length) / Math.max(n.length, target.length)
      if (score > bestScore) { bestScore = score; best = meal }
    }

    // Word overlap score
    const targetWords = target.split(' ')
    const nWords = n.split(' ')
    const overlap = targetWords.filter(w => nWords.includes(w)).length
    const wordScore = overlap / Math.max(targetWords.length, nWords.length)
    if (wordScore > bestScore && wordScore >= 0.5) { bestScore = wordScore; best = meal }
  }

  return best && bestScore >= 0.5 ? { meal: best, score: bestScore } : null
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function main() {
  const photosDir = process.argv[2]
  if (!photosDir) {
    console.error('Usage: node upload-photos.mjs /path/to/photos/folder')
    process.exit(1)
  }
  if (!existsSync(photosDir)) {
    console.error('Folder not found:', photosDir)
    process.exit(1)
  }

  const env = readEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const email = await ask(rl, 'Coach email: ')
  const password = await ask(rl, 'Coach password: ')
  rl.close()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) { console.error('Login failed:', authError.message); process.exit(1) }

  const coachId = authData.user.id
  console.log('✓ Logged in')

  const { data: meals } = await supabase.from('meals').select('id, name, photo_url').eq('coach_id', coachId)
  console.log(`✓ Found ${meals.length} meals in database`)

  const imageExts = ['.jpg', '.jpeg', '.png', '.webp']
  const files = readdirSync(photosDir).filter(f => imageExts.includes(extname(f).toLowerCase()))
  console.log(`✓ Found ${files.length} image files\n`)

  let uploaded = 0, failed = 0, noMatch = 0

  for (const file of files) {
    const match = findBestMatch(file, meals)
    if (!match) {
      console.log(`  ✗  No meal match for: ${file}`)
      noMatch++
      continue
    }

    const { meal } = match
    const filePath = join(photosDir, file)
    const ext = extname(file).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    const storagePath = `${coachId}/${Date.now()}-${file.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')}`

    const fileBuffer = readFileSync(filePath)
    const { error: uploadErr } = await supabase.storage
      .from('meal-photos')
      .upload(storagePath, fileBuffer, { contentType: mimeType })

    if (uploadErr) {
      console.log(`  ✗  Upload failed for "${file}": ${uploadErr.message}`)
      failed++
      continue
    }

    await supabase.from('meals').update({ photo_url: storagePath }).eq('id', meal.id)
    console.log(`  ✓  "${file}" → "${meal.name}" (${Math.round(match.score * 100)}% match)`)
    uploaded++
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed, ${noMatch} unmatched.`)
  if (noMatch > 0) console.log('Tip: rename unmatched files to match the meal name exactly.')
}

main().catch(console.error)
