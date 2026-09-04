-- Adds per-equipment "variations" to the Exercise Library, so one exercise
-- (e.g. "Shoulder Press") can have a full separate tab per equipment
-- (Barbell / Dumbbell / Machine), each with its own video, tempo,
-- instructions and coaching cues — instead of one flat equipment field.
-- Run once in Supabase SQL Editor.

create table if not exists exercise_variations (
  id                   uuid        primary key default gen_random_uuid(),
  exercise_id          uuid        not null references exercises(id) on delete cascade,
  equipment            text,
  video_url            text,
  instructions         text,
  coaching_cues        text,
  tempo                text,
  default_rest_seconds int,
  order_index          int         not null default 0,
  created_at           timestamptz not null default now()
);

alter table exercise_variations enable row level security;

create policy "exercise_variations_coach" on exercise_variations
  for all
  using (exercise_id in (select id from exercises where coach_id = auth.uid()))
  with check (exercise_id in (select id from exercises where coach_id = auth.uid()));

-- ── Generic backfill: one variation per exercise from its existing flat fields ──
-- (skips the six merged exercises below, which get their original per-equipment
-- detail restored explicitly instead of a single blank-equipment row)
insert into exercise_variations (exercise_id, equipment, video_url, instructions, coaching_cues, tempo, default_rest_seconds, order_index)
select id, equipment, video_url, instructions, coaching_cues, tempo, default_rest_seconds, 0
from exercises
where name not in ('Shoulder Press', 'Lateral Raise', 'Rear Delt Fly', 'Hip Thrust', 'Barbell Curl', 'Overhead Tricep Extension')
  and not exists (select 1 from exercise_variations where exercise_variations.exercise_id = exercises.id);

-- ── Shoulder Press ────────────────────────────────────────────────────────
insert into exercise_variations (exercise_id, equipment, coaching_cues, default_rest_seconds, order_index)
select id, 'Barbell', 'Grip slightly wider than shoulder-width. Bar rests on the front of your shoulders. Tighten your core and press straight up to full extension. Lower under control.', 150, 0 from exercises where name = 'Shoulder Press'
union all
select id, 'Dumbbell', 'Dumbbells at ear height with elbows at 90°. Press up close to full extension. Control the return back to ear height.', 120, 1 from exercises where name = 'Shoulder Press'
union all
select id, 'Machine', 'Adjust the seat so the handles are at shoulder height. Press to full extension and control the return. Great for pressing to failure safely without needing a spotter.', 90, 2 from exercises where name = 'Shoulder Press';

-- ── Lateral Raise ─────────────────────────────────────────────────────────
insert into exercise_variations (exercise_id, equipment, coaching_cues, default_rest_seconds, order_index)
select id, 'Dumbbell', 'Slight lean forward. Lead with your pinky side and elbow (not your hand). Raise arms to shoulder height. Lower slowly over about 4 seconds. Don''t swing or use momentum.', 60, 0 from exercises where name = 'Lateral Raise'
union all
select id, 'Cable', 'Cable at hip height from the side. Pull your arm up to parallel with a slight lean forward. Control the return. Keeps tension on the shoulder better than dumbbells.', 60, 1 from exercises where name = 'Lateral Raise';

-- ── Rear Delt Fly ─────────────────────────────────────────────────────────
insert into exercise_variations (exercise_id, equipment, coaching_cues, default_rest_seconds, order_index)
select id, 'Dumbbell', 'Bent over or lying down. Arms slightly bent. Drive your elbows up and out, squeezing the back of your shoulders at the top. Don''t turn it into a row by bending the elbows too much.', 60, 0 from exercises where name = 'Rear Delt Fly'
union all
select id, 'Cable', 'Cables crossed at face height. Pull your arms apart and back with a slight bend in the elbows. Squeeze the back of your shoulders at the end.', 60, 1 from exercises where name = 'Rear Delt Fly';

-- ── Hip Thrust ────────────────────────────────────────────────────────────
insert into exercise_variations (exercise_id, equipment, coaching_cues, default_rest_seconds, order_index)
select id, 'Barbell', 'Push through your heels and squeeze your glutes hard at the top. Keep your chin tucked and your back flat — don''t arch your lower back.', 120, 0 from exercises where name = 'Hip Thrust'
union all
select id, 'Smith Machine', 'Put the bar pad across your hips, keep your feet flat and rest your shoulders on the bench. Push through your heels and squeeze your glutes at the top.', 90, 1 from exercises where name = 'Hip Thrust'
union all
select id, 'Resistance Band', 'Push your knees outward against the band throughout every rep. Squeeze your glutes hard at the top.', 60, 2 from exercises where name = 'Hip Thrust';

-- ── Barbell Curl ──────────────────────────────────────────────────────────
insert into exercise_variations (exercise_id, equipment, coaching_cues, default_rest_seconds, order_index)
select id, 'Barbell', 'Keep your elbows at your sides. Curl up to a full squeeze at the top and lower slowly over 3 seconds. Don''t swing or use your back.', 60, 0 from exercises where name = 'Barbell Curl'
union all
select id, 'EZ Bar', 'Same as a barbell curl but the angled grip is easier on the wrists. Elbows at your sides, full squeeze at the top, slow lowering.', 60, 1 from exercises where name = 'Barbell Curl';

-- ── Overhead Tricep Extension ─────────────────────────────────────────────
insert into exercise_variations (exercise_id, equipment, coaching_cues, default_rest_seconds, order_index)
select id, 'Cable', 'Face away from the cable or use a high pulley. Lean slightly forward and extend your arms from behind your head to full lockout. The overhead position gives a better stretch on the tricep.', 60, 0 from exercises where name = 'Overhead Tricep Extension'
union all
select id, 'Dumbbell', 'Hold one dumbbell with both hands overhead. Elbow pointed at the ceiling. Lower behind your head then extend fully. The overhead position gives the tricep a good stretch.', 60, 1 from exercises where name = 'Overhead Tricep Extension';

-- ── Workout Library: let a picked variation's video travel with the workout exercise ──
alter table workout_exercises
  add column if not exists video_url text;

-- workout_exercises never actually had an equipment column, even though the Workout Editor's
-- save() has always tried to write one — every save of a standalone workout has been failing
-- with "Could not find the 'equipment' column of 'workout_exercises' in the schema cache".
alter table workout_exercises
  add column if not exists equipment text;
