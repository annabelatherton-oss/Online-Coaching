// deno-lint-ignore-file no-explicit-any
// Shared Web Push sender with real RFC 8291 payload encryption (aes128gcm) — unlike
// send-checkin-reminders/send-coach-checkin-reminder, which deliberately send no payload at all
// (every push there shows a fixed, hardcoded notification baked into the service worker; see the
// comment in send-checkin-reminders/index.ts). A coach clicking "Notify client" needs the actual
// message to reach the client's device, so this encrypts a real payload the service worker's
// existing event.data?.json() parsing already knows how to read (see public/sw.js) — that parsing
// was written for this from the start, it just never had anything to parse before now.

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '' // base64url raw private key (JWK d)
const VAPID_PUBLIC_KEY_X = Deno.env.get('VAPID_PUBLIC_KEY_X') ?? '' // base64url x from public key
const VAPID_PUBLIC_KEY_Y = Deno.env.get('VAPID_PUBLIC_KEY_Y') ?? '' // base64url y from public key
const VAPID_SUBJECT = 'mailto:annabelatherton@gmail.com'

export function vapidKeysConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY_X && VAPID_PUBLIC_KEY_Y)
}

// ─── base64url <-> bytes ────────────────────────────────────────────────────────

function b64urlToBytes(b64url: string): Uint8Array {
  const padding = '='.repeat((4 - (b64url.length % 4)) % 4)
  const b64 = (b64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

function bytesToB64url(buf: Uint8Array | ArrayBuffer): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) { out.set(p, offset); offset += p.length }
  return out
}

function uint32BE(n: number): Uint8Array {
  const buf = new Uint8Array(4)
  new DataView(buf.buffer).setUint32(0, n, false)
  return buf
}

// ─── VAPID JWT (identical scheme to send-checkin-reminders) ─────────────────────

async function createVapidJWT(audience: string): Promise<string> {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: VAPID_SUBJECT,
  })))
  const signingInput = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: VAPID_PRIVATE_KEY, x: VAPID_PUBLIC_KEY_X, y: VAPID_PUBLIC_KEY_Y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${bytesToB64url(sig)}`
}

// ─── RFC 8291 payload encryption (aes128gcm, single record) ─────────────────────

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, lengthBytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, lengthBytes * 8)
  return new Uint8Array(bits)
}

async function encryptPayload(payload: Uint8Array, p256dhB64url: string, authB64url: string) {
  const uaPublicBytes = b64urlToBytes(p256dhB64url) // client's 65-byte uncompressed P-256 public key
  const authSecret = b64urlToBytes(authB64url)      // client's 16-byte auth secret

  const uaPublicKey = await crypto.subtle.importKey('raw', uaPublicBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, [])

  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const asPublicBytes = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey))

  const ecdhSecretBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPublicKey }, serverKeyPair.privateKey, 256)
  const ecdhSecret = new Uint8Array(ecdhSecretBits)

  // IKM = HKDF(salt=auth_secret, ikm=ecdh_secret, info="WebPush: info\0"||ua_public||as_public, 32)
  const authInfo = concatBytes(new TextEncoder().encode('WebPush: info\0'), uaPublicBytes, asPublicBytes)
  const ikm = await hkdf(authSecret, ecdhSecret, authInfo, 32)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12)

  // Single record: append the 0x02 "last record" delimiter, no further padding needed for a
  // payload this small (well under the 4096-byte record size below).
  const padded = concatBytes(payload, new Uint8Array([2]))
  const cekKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded))

  const recordSize = 4096
  const header = concatBytes(salt, uint32BE(recordSize), new Uint8Array([asPublicBytes.length]), asPublicBytes)
  return concatBytes(header, ciphertext)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendPush(sub: any, payloadObj: Record<string, unknown>): Promise<{ status: number; ok: boolean }> {
  const endpoint: string = sub.endpoint
  const origin = new URL(endpoint)
  const audience = `${origin.protocol}//${origin.host}`
  const jwt = await createVapidJWT(audience)

  const plaintext = new TextEncoder().encode(JSON.stringify(payloadObj))
  const body = await encryptPayload(plaintext, sub.keys.p256dh, sub.keys.auth)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      TTL: '86400',
      Urgency: 'normal',
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Content-Length': String(body.length),
    },
    body,
  })

  return { status: res.status, ok: res.ok }
}
