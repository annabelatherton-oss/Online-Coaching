-- Seed fake past meal plan assignments for testing the plan history UI.
-- Run in Supabase SQL Editor.
-- Resolves coach, clients, and plan group IDs dynamically from live data.

DO $$
DECLARE
  v_coach_id   uuid;
  v_plan_id    uuid;
  v_plan_name  text;
  r            record;
BEGIN
  -- Find the coach
  SELECT id INTO v_coach_id FROM profiles WHERE email = 'annabelatherton@gmail.com' LIMIT 1;
  IF v_coach_id IS NULL THEN RAISE EXCEPTION 'Coach not found'; END IF;

  -- Find the first available plan group (use whatever exists)
  SELECT id, name INTO v_plan_id, v_plan_name
  FROM plan_groups WHERE coach_id = v_coach_id ORDER BY created_at LIMIT 1;
  IF v_plan_id IS NULL THEN RAISE EXCEPTION 'No plan groups found — create a plan template first'; END IF;

  -- For each active client, insert 3 historical (inactive) assignments
  FOR r IN
    SELECT c.id AS client_id
    FROM clients c
    WHERE c.coach_id = v_coach_id
      AND c.is_active = true
  LOOP
    -- Skip if this client already has inactive assignments (don't double-seed)
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM client_plan_assignments
      WHERE client_id = r.client_id AND active = false
    );

    -- Phase 1: earliest plan (roughly 6 months ago)
    INSERT INTO client_plan_assignments
      (client_id, coach_id, plan_group_id, plan_group_name, calorie_target,
       start_date, active, created_at, ended_at)
    VALUES
      (r.client_id, v_coach_id, v_plan_id, v_plan_name, 1600,
       NOW() - INTERVAL '26 weeks', false,
       NOW() - INTERVAL '26 weeks',
       NOW() - INTERVAL '18 weeks');

    -- Phase 2: mid plan
    INSERT INTO client_plan_assignments
      (client_id, coach_id, plan_group_id, plan_group_name, calorie_target,
       start_date, active, created_at, ended_at)
    VALUES
      (r.client_id, v_coach_id, v_plan_id, v_plan_name, 1800,
       NOW() - INTERVAL '18 weeks', false,
       NOW() - INTERVAL '18 weeks',
       NOW() - INTERVAL '8 weeks');

    -- Phase 3: most recent past plan
    INSERT INTO client_plan_assignments
      (client_id, coach_id, plan_group_id, plan_group_name, calorie_target,
       start_date, active, created_at, ended_at)
    VALUES
      (r.client_id, v_coach_id, v_plan_id, v_plan_name, 2000,
       NOW() - INTERVAL '8 weeks', false,
       NOW() - INTERVAL '8 weeks',
       NOW() - INTERVAL '1 week');

  END LOOP;

  RAISE NOTICE 'Done — seeded plan history for coach %', v_coach_id;
END $$;
