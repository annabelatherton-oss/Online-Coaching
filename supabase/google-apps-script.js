var WEBHOOK_URL = 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/intake-form-webhook';
var WEBHOOK_TOKEN = 'xK9mP2qR7vLn4wJt';

function getField(headers, values, keyword) {
  var idx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase().indexOf(keyword.toLowerCase()) >= 0) {
      idx = i;
      break;
    }
  }
  return idx >= 0 ? (values[idx] || '').toString().trim() : '';
}

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = e.values;

  var payload = {
    email:              getField(headers, values, 'email'),
    full_name:          getField(headers, values, 'full name'),
    phone:              getField(headers, values, 'phone'),
    date_of_birth:      formatDate(getField(headers, values, 'date of birth')),
    height_cm:          getField(headers, values, 'height'),
    weight_kg:          getField(headers, values, 'body weight'),
    goal:               getField(headers, values, 'main goals'),
    motivators:         getField(headers, values, 'motivators'),
    barriers:           getField(headers, values, 'barriers'),
    health_history:     getField(headers, values, 'health history'),
    plan_interest:      getField(headers, values, 'most interested'),
    current_diet:       getField(headers, values, 'current diet'),
    current_training:   getField(headers, values, 'current training'),
    cardio_preferences: getField(headers, values, 'cardio'),
    food_preferences:   getField(headers, values, 'food preferences'),
    dislikes:           getField(headers, values, 'food dislikes'),
    meal_preference:    getField(headers, values, 'specific meals'),
    other_info:         getField(headers, values, 'other information')
  };

  if (!payload.email) {
    Logger.log('ERROR: No email in submission');
    return;
  }

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { 'x-webhook-token': WEBHOOK_TOKEN },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Status ' + response.getResponseCode() + ': ' + response.getContentText());
  } catch (err) {
    Logger.log('ERROR: ' + err.toString());
  }
}

function formatDate(raw) {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  var m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return raw;
}
