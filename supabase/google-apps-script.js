// ─── Google Apps Script — paste this into your Google Sheet's Script Editor ───
// Tools → Script editor → replace everything with this code → Save → set up trigger

// ── Configuration — fill these in ────────────────────────────────────────────
const WEBHOOK_URL = 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/intake-form-webhook'
const WEBHOOK_TOKEN = 'REPLACE_WITH_YOUR_INTAKE_WEBHOOK_SECRET'
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a value from the form submission by matching a keyword against the header row.
 * Uses partial, case-insensitive matching so minor header wording changes don't break it.
 */
function getField(headers, values, keyword) {
  const idx = headers.findIndex(h =>
    h.toString().toLowerCase().includes(keyword.toLowerCase())
  )
  return idx >= 0 ? (values[idx] || '').toString().trim() : ''
}

/**
 * Runs automatically when a form is submitted.
 * Set this as the trigger: Edit → Current project's triggers → onFormSubmit
 */
function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const values = e.values // array of cell values for this submission

  const payload = {
    email:               getField(headers, values, 'email'),
    full_name:           getField(headers, values, 'full name'),
    phone:               getField(headers, values, 'phone'),
    date_of_birth:       formatDate(getField(headers, values, 'date of birth')),
    height_cm:           getField(headers, values, 'height'),
    weight_kg:           getField(headers, values, 'body weight'),
    goal:                getField(headers, values, 'main goals'),
    motivators:          getField(headers, values, 'motivators'),
    barriers:            getField(headers, values, 'barriers'),
    health_history:      getField(headers, values, 'health history'),
    plan_interest:       getField(headers, values, 'most interested'),
    current_diet:        getField(headers, values, 'current diet'),
    current_training:    getField(headers, values, 'current training'),
    cardio_preferences:  getField(headers, values, 'cardio'),
    food_preferences:    getField(headers, values, 'food preferences'),
    dislikes:            getField(headers, values, 'food dislikes'),
    meal_preference:     getField(headers, values, 'specific meals'),
    other_info:          getField(headers, values, 'other information'),
  }

  // Validate email is present before sending
  if (!payload.email) {
    Logger.log('ERROR: No email found in form submission. Add an Email Address question to the form.')
    return
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { 'x-webhook-token': WEBHOOK_TOKEN },
    muteHttpExceptions: true,
  }

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options)
    const code = response.getResponseCode()
    const body = response.getContentText()
    Logger.log('Response ' + code + ': ' + body)
    if (code !== 200) {
      Logger.log('WARNING: Webhook returned non-200 status for ' + payload.email)
    }
  } catch (err) {
    Logger.log('ERROR calling webhook: ' + err.toString())
  }
}

/**
 * Convert Google's date string (e.g. "21/07/2026" or "2026-07-21") to ISO format "YYYY-MM-DD"
 * so Postgres can parse it as a date.
 */
function formatDate(raw) {
  if (!raw) return ''
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // DD/MM/YYYY
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return raw
}
