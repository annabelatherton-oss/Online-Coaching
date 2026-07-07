do $$
declare
  v_coach_id   uuid;
  v_client_id  uuid;
begin
  -- Get coach
  select id into v_coach_id from profiles where email = 'annabelatherton@gmail.com' limit 1;
  if v_coach_id is null then raise exception 'Coach not found'; end if;

  -- Get Annabel's client record (first client whose name contains "Annabel")
  select c.id into v_client_id
    from clients c
    join profiles p on p.id = c.profile_id
    where c.coach_id = v_coach_id
      and lower(p.full_name) like '%annabel%'
    limit 1;

  -- If not found by name, fall back to the first client of this coach
  if v_client_id is null then
    select id into v_client_id from clients where coach_id = v_coach_id order by created_at limit 1;
  end if;

  if v_client_id is null then raise exception 'No client found for this coach'; end if;

  -- Remove any existing test check-ins so re-running is safe
  delete from client_checkins where client_id = v_client_id;

  -- Week 1 — starting point
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 1, 76.2, 3, 3, 4,
    'First week done! Feeling good about getting started. Diet was mostly on track.',
    '[{"name":"Hip Thrust","weight_kg":"60","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"50","reps":"8"},{"name":"Lat Pull Down","weight_kg":"40","reps":"10"}]',
    now() - interval '7 weeks', now() - interval '7 weeks');

  -- Week 2
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 2, 75.6, 4, 4, 5,
    'Weight dropped nicely. Energy is better this week. Nailed all my sessions.',
    '[{"name":"Hip Thrust","weight_kg":"65","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"50","reps":"10"},{"name":"Lat Pull Down","weight_kg":"42.5","reps":"10"}]',
    now() - interval '6 weeks', now() - interval '6 weeks');

  -- Week 3
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 3, 75.1, 4, 3, 4,
    'Sleep not great this week — busy at work. Still got all sessions in.',
    '[{"name":"Hip Thrust","weight_kg":"65","reps":"10"},{"name":"Romanian Deadlift","weight_kg":"55","reps":"8"},{"name":"Lat Pull Down","weight_kg":"42.5","reps":"12"}]',
    now() - interval '5 weeks', now() - interval '5 weeks');

  -- Week 4 — slight stall
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 4, 75.3, 3, 3, 3,
    'Had a social weekend so diet went off track a bit. Weight went up slightly. Lifts felt hard.',
    '[{"name":"Hip Thrust","weight_kg":"65","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"55","reps":"8"},{"name":"Lat Pull Down","weight_kg":"42.5","reps":"10"}]',
    now() - interval '4 weeks', now() - interval '4 weeks');

  -- Week 5 — back on track
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 5, 74.8, 4, 4, 5,
    'Back on it this week. Really happy with my hip thrust progress.',
    '[{"name":"Hip Thrust","weight_kg":"70","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"55","reps":"10"},{"name":"Lat Pull Down","weight_kg":"45","reps":"10"}]',
    now() - interval '3 weeks', now() - interval '3 weeks');

  -- Week 6
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 6, 74.3, 5, 4, 5,
    'Best week yet! Feeling really strong. Hit a new personal best on hip thrust.',
    '[{"name":"Hip Thrust","weight_kg":"70","reps":"10"},{"name":"Romanian Deadlift","weight_kg":"60","reps":"8"},{"name":"Lat Pull Down","weight_kg":"45","reps":"12"}]',
    now() - interval '2 weeks', now() - interval '2 weeks');

  -- Week 7 — mini stall
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 7, 74.4, 3, 4, 4,
    'Weight barely moved this week. Feeling a bit frustrated but sticking with it.',
    '[{"name":"Hip Thrust","weight_kg":"70","reps":"10"},{"name":"Romanian Deadlift","weight_kg":"60","reps":"8"},{"name":"Lat Pull Down","weight_kg":"45","reps":"12"}]',
    now() - interval '1 week', now() - interval '1 week');

  -- Week 8 — most recent, no coach response yet
  insert into client_checkins (client_id, coach_id, week_number, weight_kg, energy_level, sleep_quality, adherence, notes, lift_results, submitted_at, updated_at)
  values (v_client_id, v_coach_id, 8, 73.9, 4, 5, 5,
    'Down again! Sleep has been really good. Managed to add weight to RDL for the first time in a while.',
    '[{"name":"Hip Thrust","weight_kg":"75","reps":"8"},{"name":"Romanian Deadlift","weight_kg":"62.5","reps":"8"},{"name":"Lat Pull Down","weight_kg":"47.5","reps":"10"}]',
    now(), now());

  raise notice 'Inserted 8 fake check-ins for client %', v_client_id;
end $$;
