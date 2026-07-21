var WEBHOOK_URL = 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/intake-form-webhook';
var WEBHOOK_TOKEN = 'xK9mP2qR7vLn4wJt';

function onFormSubmit(e) {
  var response = e.response;
  var itemResponses = response.getItemResponses();

  // Build a map of lowercase question title -> answer
  var answers = {};
  for (var i = 0; i < itemResponses.length; i++) {
    var item = itemResponses[i];
    var title = item.getItem().getTitle().toLowerCase();
    answers[title] = item.getResponse().toString().trim();
  }

  // Find an answer by partial keyword match
  function get(keyword) {
    for (var key in answers) {
      if (key.indexOf(keyword.toLowerCase()) >= 0) {
        return answers[key] || '';
      }
    }
    return '';
  }

  // Email: try the question first, then fall back to Google's automatic collection
  var email = get('email');
  if (!email) {
    try { email = response.getRespondentEmail() || ''; } catch (err) {}
  }

  if (!email) {
    Logger.log('ERROR: No email found in submission');
    return;
  }

  var payload = {
    email:              email,
    full_name:          get('full name'),
    phone:              get('phone'),
    date_of_birth:      formatDate(get('date of birth')),
    height_cm:          get('height'),
    weight_kg:          get('body weight'),
    goal:               get('main goals'),
    motivators:         get('motivators'),
    barriers:           get('barriers'),
    health_history:     get('health history'),
    plan_interest:      get('most interested'),
    current_diet:       get('current diet'),
    current_training:   get('current training'),
    cardio_preferences: get('cardio'),
    food_preferences:   get('food preferences'),
    dislikes:           get('food dislikes'),
    meal_preference:    get('specific meals'),
    other_info:         get('other information')
  };

  Logger.log('Sending for email: ' + email);

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { 'x-webhook-token': WEBHOOK_TOKEN },
    muteHttpExceptions: true
  };

  try {
    var result = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Status ' + result.getResponseCode() + ': ' + result.getContentText());
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
