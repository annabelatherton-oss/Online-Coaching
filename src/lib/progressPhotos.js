import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const BUCKET = 'progress-photos'
const SIGNED_URL_TTL = 60 * 60 // 1 hour
const CACHE = new Map() // path -> { url, expiresAt }

// Downscale + re-compress a photo before upload — client phone cameras
// routinely produce 4-12MB images, which is what was making uploads feel
// endless on mobile data. Capping the longest side and re-encoding as JPEG
// cuts that down to a few hundred KB with no visible quality loss for a
// progress photo.
export async function compressImage(file, maxDim = 1600, quality = 0.82) {
  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    return blob || file
  } catch {
    // Older browsers without createImageBitmap/toBlob support — fall back
    // to uploading the original file rather than blocking the upload.
    return file
  }
}

async function signPaths(paths) {
  const now = Date.now()
  const uncached = paths.filter(p => {
    const c = CACHE.get(p)
    return !c || c.expiresAt < now + 60_000
  })
  if (uncached.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(uncached, SIGNED_URL_TTL)
    ;(data || []).forEach(d => {
      if (d.signedUrl && !d.error) {
        CACHE.set(d.path, { url: d.signedUrl, expiresAt: now + (SIGNED_URL_TTL - 300) * 1000 })
      }
    })
  }
  const result = {}
  paths.forEach(p => { result[p] = CACHE.get(p)?.url || null })
  return result
}

export async function signProgressPhotoPath(path) {
  if (!path) return null
  const result = await signPaths([path])
  return result[path]
}

// Resolves a { front, back, left, right } path map (as stored in
// client_checkins.progress_photos) to an equivalent map of short-lived
// signed URLs, ready to drop straight into an <img src>.
export function useSignedProgressPhotos(progressPhotos) {
  const [urls, setUrls] = useState({})
  const key = JSON.stringify(progressPhotos || {})

  useEffect(() => {
    const entries = Object.entries(progressPhotos || {}).filter(([, v]) => v)
    if (!entries.length) { setUrls({}); return }
    let cancelled = false
    signPaths(entries.map(([, path]) => path)).then(pathToUrl => {
      if (cancelled) return
      const resolved = {}
      entries.forEach(([angle, path]) => { resolved[angle] = pathToUrl[path] })
      setUrls(resolved)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}

// Resolves a flat list of storage paths to a { [path]: signedUrl } map —
// for standalone photo galleries that aren't shaped like a check-in's
// { front, back, left, right } object.
export function useSignedUrls(paths) {
  const [urls, setUrls] = useState({})
  const key = JSON.stringify(paths || [])

  useEffect(() => {
    const list = (paths || []).filter(Boolean)
    if (!list.length) { setUrls({}); return }
    let cancelled = false
    signPaths(list).then(result => { if (!cancelled) setUrls(result) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}

// Same as useSignedProgressPhotos, but for a whole list of check-ins at
// once (e.g. a history list or a before/after comparison) — batches every
// path across every check-in into a single signing call and returns a map
// keyed by check-in id.
export function useSignedProgressPhotosForCheckins(checkins) {
  const [urlsById, setUrlsById] = useState({})
  const key = JSON.stringify((checkins || []).map(c => [c.id, c.progress_photos]))

  useEffect(() => {
    const withPhotos = (checkins || []).filter(c => c.progress_photos && Object.values(c.progress_photos).some(Boolean))
    if (!withPhotos.length) { setUrlsById({}); return }
    let cancelled = false
    const allPaths = withPhotos.flatMap(c => Object.values(c.progress_photos).filter(Boolean))
    signPaths(allPaths).then(pathToUrl => {
      if (cancelled) return
      const resolved = {}
      withPhotos.forEach(c => {
        const entry = {}
        Object.entries(c.progress_photos).forEach(([angle, path]) => {
          if (path) entry[angle] = pathToUrl[path]
        })
        resolved[c.id] = entry
      })
      setUrlsById(resolved)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urlsById
}
