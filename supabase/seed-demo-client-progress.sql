-- Seeds 8 weeks of realistic-looking check-in history for the demo/filming account
-- (annabelatherton+client@gmail.com) — weight declining 68.3kg -> 62.5kg, three lifts
-- progressing, ratings trending up. Built specifically so the Progress charts, check-in
-- history and "This week's lifts" all look good on camera for the promo video.
--
-- Dates are anchored to real Fridays (the app's own check-in-window convention) ending on the
-- most recent Friday on/before today, 7 days apart, so every week's calendar-computed label
-- (Week 1..8) lines up correctly everywhere the app shows it. client.start_date is set to
-- match Week 1's date for the same reason — this OVERWRITES whatever start_date is currently
-- set on this account. Safe to re-run: every insert upserts on (client_id, week_number).

do $$
declare
  v_coach_id   uuid;
  v_client_id  uuid;
  v_last_friday date;
  v_week1 date;
  v_weights numeric[] := array[68.3, 67.5, 66.8, 66.0, 65.3, 64.5, 63.6, 62.5];
  v_bench   numeric[] := array[40, 42.5, 42.5, 45, 45, 47.5, 50, 52.5];
  v_squat   numeric[] := array[60, 62.5, 65, 67.5, 70, 72.5, 77.5, 80];
  v_deadlift numeric[] := array[70, 75, 77.5, 80, 82.5, 85, 90, 92.5];
  v_energy  int[] := array[3,4,4,4,5,4,5,5];
  v_sleep   int[] := array[4,4,4,5,4,5,5,5];
  v_food    int[] := array[4,4,4,4,5,5,5,5];
  v_gym     int[] := array[4,4,5,5,5,5,5,5];
  v_notes   text[] := array[
    'Excited to get started!', null, null,
    'Feeling so much stronger already, loving the new meal plan.',
    null, null, null,
    'Can''t believe how far I''ve come in 8 weeks, thank you!'
  ];
  v_date date;
  v_lift_results jsonb;
begin
  select id into v_coach_id from profiles where email = 'annabelatherton@gmail.com' limit 1;
  if v_coach_id is null then raise exception 'Coach not found'; end if;

  select c.id into v_client_id
  from clients c join profiles p on p.id = c.profile_id
  where p.email = 'annabelatherton+client@gmail.com' and c.coach_id = v_coach_id
  limit 1;
  if v_client_id is null then raise exception 'Demo client (annabelatherton+client@gmail.com) not found under this coach'; end if;

  -- Most recent Friday on/before today (same "check-in window" convention the app itself uses).
  v_last_friday := current_date - (((extract(dow from current_date)::int - 5 + 7) % 7));
  v_week1 := v_last_friday - 49; -- 7 weeks before the last Friday = Week 1's date

  -- Lines the client's calendar-computed "Week N" labels up with these 8 checkins exactly.
  update clients set start_date = v_week1 where id = v_client_id;

  -- These 3 lifts are what the "This week's lifts" section and progress charts key off —
  -- overwrites whatever's currently configured so the lift_results below actually show up.
  update clients set top_lifts = '[{"name":"Bench Press"},{"name":"Squat"},{"name":"Deadlift"}]'::jsonb
  where id = v_client_id;

  for i in 1..8 loop
    v_date := v_week1 + ((i - 1) * 7);
    v_lift_results := jsonb_build_array(
      jsonb_build_object('name', 'Bench Press', 'weight_kg', v_bench[i], 'reps', 8),
      jsonb_build_object('name', 'Squat',       'weight_kg', v_squat[i], 'reps', 6),
      jsonb_build_object('name', 'Deadlift',     'weight_kg', v_deadlift[i], 'reps', 5)
    );

    insert into client_checkins (
      client_id, coach_id, week_number, submitted_at, updated_at,
      weight_kg, energy_level, sleep_quality, food_adherence, gym_adherence,
      lift_results, notes
    ) values (
      v_client_id, v_coach_id, i, v_date + time '09:00', v_date + time '09:00',
      v_weights[i], v_energy[i], v_sleep[i], v_food[i], v_gym[i],
      v_lift_results, v_notes[i]
    )
    on conflict (client_id, week_number) do update set
      submitted_at = excluded.submitted_at, updated_at = excluded.updated_at,
      weight_kg = excluded.weight_kg, energy_level = excluded.energy_level,
      sleep_quality = excluded.sleep_quality, food_adherence = excluded.food_adherence,
      gym_adherence = excluded.gym_adherence, lift_results = excluded.lift_results,
      notes = excluded.notes;

    -- Mirrors into weight_entries the same way a real check-in submission does.
    insert into weight_entries (client_id, weight_kg, week_number, recorded_at, from_checkin)
    select v_client_id, v_weights[i], i, v_date, true
    where not exists (
      select 1 from weight_entries we where we.client_id = v_client_id and we.week_number = i and we.from_checkin = true
    );
  end loop;
end $$;

-- Preview the result
select week_number, weight_kg, lift_results, submitted_at::date as date
from client_checkins
where client_id = (select c.id from clients c join profiles p on p.id = c.profile_id where p.email = 'annabelatherton+client@gmail.com')
order by week_number;
