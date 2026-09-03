-- Seeds an 8-week fake check-in history for Bella Atherton
-- (id 89427494-645e-4819-8119-73745cb7c15c) so you can test the check-in
-- review flow end to end, including the struggle-tracking feature: an
-- ongoing issue with several weeks of comments, one resolved-and-acknowledged
-- issue, one resolved-but-NOT-yet-acknowledged issue (to test the green
-- "they're ok with it now" banner), and a freshly-flagged issue with just
-- one comment.
--
-- Safe to re-run — it deletes this client's existing check-ins and struggle
-- tracking rows first (including any real check-ins already on the account —
-- only use this on a client you're happy to overwrite with test data).
--
-- Run in Supabase SQL Editor.

do $$
declare
  v_coach_id   uuid;
  v_client_id  uuid := '89427494-645e-4819-8119-73745cb7c15c'; -- Bella Atherton
  v_w1 uuid; v_w2 uuid; v_w3 uuid; v_w4 uuid;
  v_w5 uuid; v_w6 uuid; v_w7 uuid; v_w8 uuid;
begin
  select id into v_coach_id from profiles where email = 'annabelatherton@gmail.com' limit 1;
  if v_coach_id is null then raise exception 'Coach not found'; end if;

  if not exists (select 1 from clients where id = v_client_id and coach_id = v_coach_id) then
    raise exception 'Client % not found under this coach', v_client_id;
  end if;

  -- Clean slate so this script is safe to re-run
  delete from client_struggle_tracking where client_id = v_client_id;
  delete from client_checkins where client_id = v_client_id;

  -- Week 1 — starting point, no struggles flagged yet
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 1, 76.2, 3, 3, 4, 4,
     'First week done! Feeling good about getting started. Diet was mostly on track.',
     '[{"name":"Hip Thrust","weight_kg":"60","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"50","reps":"8"},{"name":"Lat Pull Down","weight_kg":"40","reps":"10"}]',
     now() - interval '7 weeks', now() - interval '7 weeks')
  returning id into v_w1;

  -- Week 2 — flags "Snacking" and "Hitting my macros" for the first time (no comment needed yet)
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 2, 75.6, 4, 4, 3, 5,
     array['Snacking between meals','Hitting my macros'],
     'Struggling a bit with snacking and hitting my macros but otherwise a good week.',
     '[{"name":"Hip Thrust","weight_kg":"65","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"50","reps":"10"},{"name":"Lat Pull Down","weight_kg":"42.5","reps":"10"}]',
     now() - interval '6 weeks', now() - interval '6 weeks')
  returning id into v_w2;

  -- Week 3 — both still open, now with progress comments
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, struggle_comments, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 3, 75.1, 4, 3, 3, 4,
     array['Snacking between meals','Hitting my macros'],
     '{"Snacking between meals":"Still snacking at night but eating less than before.","Hitting my macros":"Hit protein most days, carbs still tricky."}'::jsonb,
     'Sleep not great this week — busy at work. Still got all sessions in.',
     '[{"name":"Hip Thrust","weight_kg":"65","reps":"10"},{"name":"Romanian Deadlift","weight_kg":"55","reps":"8"},{"name":"Lat Pull Down","weight_kg":"42.5","reps":"12"}]',
     now() - interval '5 weeks', now() - interval '5 weeks')
  returning id into v_w3;

  -- Week 4 — "Hitting my macros" resolved (dropped from selection); "Snacking" continues;
  -- "Too many social events" flagged for the first time
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, struggle_comments, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 4, 75.3, 3, 3, 2, 3,
     array['Snacking between meals','Too many social events'],
     '{"Snacking between meals":"Had a rough week, still snacking especially in the evenings."}'::jsonb,
     'Had a social weekend so diet went off track a bit. Weight went up slightly.',
     '[{"name":"Hip Thrust","weight_kg":"65","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"55","reps":"8"},{"name":"Lat Pull Down","weight_kg":"42.5","reps":"10"}]',
     now() - interval '4 weeks', now() - interval '4 weeks')
  returning id into v_w4;

  -- Week 5 — both still open, plus a free-text "other" struggle
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, struggles_other, struggle_comments, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 5, 74.8, 4, 4, 4, 5,
     array['Snacking between meals','Too many social events'],
     'Also finding it hard to fit in stretching after sessions.',
     '{"Snacking between meals":"Better this week, planned snacks in advance.","Too many social events":"Had two dinners out but made better choices."}'::jsonb,
     'Back on it this week. Really happy with my hip thrust progress.',
     '[{"name":"Hip Thrust","weight_kg":"70","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"55","reps":"10"},{"name":"Lat Pull Down","weight_kg":"45","reps":"10"}]',
     now() - interval '3 weeks', now() - interval '3 weeks')
  returning id into v_w5;

  -- Week 6 — "Too many social events" resolved this week; "Snacking" continues improving
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, struggle_comments, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 6, 74.3, 5, 4, 5, 5,
     array['Snacking between meals'],
     '{"Snacking between meals":"Really good week, barely snacked at all."}'::jsonb,
     'Best week yet! Feeling really strong. Hit a new personal best on hip thrust.',
     '[{"name":"Hip Thrust","weight_kg":"70","reps":"10"},{"name":"Romanian Deadlift","weight_kg":"60","reps":"8"},{"name":"Lat Pull Down","weight_kg":"45","reps":"12"}]',
     now() - interval '2 weeks', now() - interval '2 weeks')
  returning id into v_w6;

  -- Week 7 — "Snacking" continues; "Form/technique in the gym" flagged for the first time
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, struggle_comments, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 7, 74.4, 3, 4, 4, 4,
     array['Snacking between meals','Form/technique in the gym'],
     '{"Snacking between meals":"Slipped a bit again but overall improving."}'::jsonb,
     'Weight barely moved this week. Feeling a bit frustrated but sticking with it.',
     '[{"name":"Hip Thrust","weight_kg":"70","reps":"10"},{"name":"Romanian Deadlift","weight_kg":"60","reps":"8"},{"name":"Lat Pull Down","weight_kg":"45","reps":"12"}]',
     now() - interval '1 week', now() - interval '1 week')
  returning id into v_w7;

  -- Week 8 — most recent — both "Snacking" and "Form/technique" continue with comments
  insert into client_checkins
    (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
     struggles, struggle_comments, notes, lift_results, submitted_at, updated_at)
  values
    (v_client_id, v_coach_id, 8, 73.9, 4, 5, 5, 5,
     array['Snacking between meals','Form/technique in the gym'],
     '{"Snacking between meals":"Getting much better, hardly any snacking this week.","Form/technique in the gym":"Coach cues really helped, squats feel more stable now."}'::jsonb,
     'Down again! Sleep has been really good. Managed to add weight to RDL for the first time in a while.',
     '[{"name":"Hip Thrust","weight_kg":"75","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"62.5","reps":"8"},{"name":"Lat Pull Down","weight_kg":"47.5","reps":"10"}]',
     now(), now())
  returning id into v_w8;

  -- Struggle tracking rows reflecting the story above:
  --   "Snacking between meals"        → still open, 4 weeks of comments (weeks 3,5,6,7,8)
  --   "Hitting my macros"             → resolved, already acknowledged (quiet, no banner)
  --   "Too many social events"        → resolved, NOT yet acknowledged (shows the green banner)
  --   "Form/technique in the gym"     → still open, just flagged (one comment so far)
  insert into client_struggle_tracking
    (client_id, coach_id, label, status, first_checkin_id, resolved_at, coach_seen_resolved, created_at)
  values
    (v_client_id, v_coach_id, 'Snacking between meals',    'open',     v_w2, null,                       false, now() - interval '6 weeks'),
    (v_client_id, v_coach_id, 'Hitting my macros',         'resolved', v_w2, now() - interval '4 weeks',  true,  now() - interval '6 weeks'),
    (v_client_id, v_coach_id, 'Too many social events',    'resolved', v_w4, now() - interval '2 weeks',  false, now() - interval '4 weeks'),
    (v_client_id, v_coach_id, 'Form/technique in the gym', 'open',     v_w7, null,                       false, now() - interval '1 week');

  raise notice 'Inserted 8 fake check-ins + 4 struggle-tracking rows for client %', v_client_id;
end $$;
