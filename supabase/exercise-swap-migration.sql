-- Lets a client swap a planned exercise for something else if equipment is
-- taken: first offer is the exercise's own equipment variations (same
-- movement, different equipment — already authored on the card), and a
-- second, coach-curated fallback list of genuinely different alternative
-- exercises for when there's no variation to fall back on.
-- Run once in Supabase SQL Editor.

-- Widen client read access on exercises/variations from "only exercises
-- linked to my own assigned session" to "belongs to my coach" — the same
-- simplification already applied to training_programs, and needed here so a
-- client can browse alternative exercises that aren't in their own plan.
DROP POLICY IF EXISTS "exercises_client_read" ON exercises;
CREATE POLICY "exercises_client_read" ON exercises
  FOR SELECT USING (
    coach_id IN (SELECT coach_id FROM clients WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercise_variations_client_read" ON exercise_variations;
CREATE POLICY "exercise_variations_client_read" ON exercise_variations
  FOR SELECT USING (
    exercise_id IN (
      SELECT id FROM exercises WHERE coach_id IN (
        SELECT coach_id FROM clients WHERE profile_id = auth.uid()
      )
    )
  );

-- Coach-curated alternative exercises: a manual fallback list per exercise,
-- distinct from equipment variations (an alternative can be a completely
-- different movement, e.g. Goblet Squat as an alternative to Leg Press).
CREATE TABLE IF NOT EXISTS exercise_alternatives (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id             uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  alternative_exercise_id uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index             int         NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, alternative_exercise_id)
);
ALTER TABLE exercise_alternatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercise_alternatives_coach" ON exercise_alternatives;
CREATE POLICY "exercise_alternatives_coach" ON exercise_alternatives
  FOR ALL USING (
    exercise_id IN (SELECT id FROM exercises WHERE coach_id = auth.uid())
  ) WITH CHECK (
    exercise_id IN (SELECT id FROM exercises WHERE coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercise_alternatives_client_read" ON exercise_alternatives;
CREATE POLICY "exercise_alternatives_client_read" ON exercise_alternatives
  FOR SELECT USING (
    exercise_id IN (
      SELECT id FROM exercises WHERE coach_id IN (
        SELECT coach_id FROM clients WHERE profile_id = auth.uid()
      )
    )
  );

-- Per-client record of a swapped-in exercise/equipment for one planned slot
-- (a session_exercises row). Doesn't touch the shared training block —
-- only affects what this one client sees for that slot.
CREATE TABLE IF NOT EXISTS client_exercise_swaps (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_exercise_id uuid        NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  swapped_exercise_id uuid        REFERENCES exercises(id) ON DELETE CASCADE,
  equipment           text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, session_exercise_id)
);
ALTER TABLE client_exercise_swaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_exercise_swaps_client" ON client_exercise_swaps;
CREATE POLICY "client_exercise_swaps_client" ON client_exercise_swaps
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  ) WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "client_exercise_swaps_coach_read" ON client_exercise_swaps;
CREATE POLICY "client_exercise_swaps_coach_read" ON client_exercise_swaps
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );
