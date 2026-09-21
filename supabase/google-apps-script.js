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
    email:                 email,
    full_name:             get('full name'),
    phone:                 get('phone'),
    date_of_birth:         formatDate(get('date of birth')),
    height_cm:             get('height'),
    weight_kg:             get('body weight'),
    goal:                  get('main goals'),
    gender:                get('gender'),
    sex:                   get('sex'),
    motivators:            get('motivators'),
    // "What a has prevented you from achieving these goals until now?" — doesn't contain the
    // word "barriers", so match on "prevented" instead.
    barriers:              get('prevented'),
    health_history:        get('health history'),
    plan_interest:         get('most interested'),
    current_diet:          get('current diet'),
    current_training:      get('current training'),
    cardio_preferences:    get('cardio'),
    food_preferences:      get('food preferences'),
    dislikes:              get('food dislikes'),
    allergies:             get('allerg'),
    dietary_requirements:  get('dietary'),
    meal_preference:       get('specific meals'),
    other_info:            get('other information'),
    // There's no separate "target date"/"target event" question — "Do you have a specific
    // timescale for wanting to see changes?" is the one that covers both: if the answer parses
    // as a date, formatDate() picks it up for target_date; the raw text always goes into
    // target_event_name too, since that field has no format constraint.
    target_date:           formatDate(get('timescale')),
    target_event_name:     get('timescale'),
    // "How many days will you realistically be able to train per week?" (2/3/4/5 days)
    training_days:         get('per week'),
    // The cut/bulk/maintain question is actually titled "What are you interested in doing?"
    // (Bulking/Cutting/Maintaining/Other) — there's no question containing the word "phase".
    goal_phase:            get('interested in doing')
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
