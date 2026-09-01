-- 1. Keep training block / workout exercise names in sync automatically when
--    the linked library exercise is renamed, instead of only updating at
--    link time.
-- 2. Let clients read the exercise (and its variations) their assigned
--    training block exercises are linked to, so the client app can show a
--    detail card — description, video, muscles, other variations — when
--    they tap an exercise.
-- Run once in Supabase SQL Editor.

create or replace function sync_exercise_name_to_plans()
returns trigger as $$
begin
  if new.name is distinct from old.name then
    update session_exercises set name = new.name where exercise_id = new.id;
    update workout_exercises set name = new.name where exercise_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_exercise_name on exercises;
create trigger trg_sync_exercise_name
  after update on exercises
  for each row execute function sync_exercise_name_to_plans();

-- ── Client read access ────────────────────────────────────────────────────

drop policy if exists "exercises_client_read" on exercises;
create policy "exercises_client_read" on exercises
  for select
  using (
    id in (
      select se.exercise_id
      from session_exercises se
      join training_sessions ts on ts.id = se.session_id
      where se.exercise_id is not null
        and ts.program_id in (
          select program_id from client_training_assignments
          where active = true
            and client_id in (select id from clients where profile_id = auth.uid())
        )
    )
  );

drop policy if exists "exercise_variations_client_read" on exercise_variations;
create policy "exercise_variations_client_read" on exercise_variations
  for select
  using (
    exercise_id in (
      select se.exercise_id
      from session_exercises se
      join training_sessions ts on ts.id = se.session_id
      where se.exercise_id is not null
        and ts.program_id in (
          select program_id from client_training_assignments
          where active = true
            and client_id in (select id from clients where profile_id = auth.uid())
        )
    )
  );
