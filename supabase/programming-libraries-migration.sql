-- ============================================================
-- Programming Libraries Migration
-- Additive only — no changes to existing tables
-- New: exercises, workouts, workout_exercises,
--      cardio_sessions, hiit_circuits, hiit_exercises
-- Optional FK: training_sessions.workout_id
-- ============================================================

-- Exercise Library
create table if not exists exercises (
  id                   uuid        primary key default gen_random_uuid(),
  coach_id             uuid        not null,
  name                 text        not null,
  primary_muscle       text,
  secondary_muscles    text[]      not null default '{}',
  equipment            text,
  video_url            text,
  coaching_cues        text,
  instructions         text,
  tempo                text,
  default_rest_seconds int,
  tags                 text[]      not null default '{}',
  difficulty           text,
  exercise_type        text,
  notes                text,
  is_archived          boolean     not null default false,
  created_at           timestamptz not null default now()
);

alter table exercises enable row level security;

create policy "exercises_coach" on exercises
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());


-- Workout Library
create table if not exists workouts (
  id          uuid        primary key default gen_random_uuid(),
  coach_id    uuid        not null,
  name        text        not null,
  description text,
  warmup      text,
  cooldown    text,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table workouts enable row level security;

create policy "workouts_coach" on workouts
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());


-- Exercises within a workout
create table if not exists workout_exercises (
  id          uuid        primary key default gen_random_uuid(),
  workout_id  uuid        not null references workouts(id) on delete cascade,
  exercise_id uuid        references exercises(id) on delete set null,
  order_index int         not null default 0,
  name        text        not null,
  sets        int,
  reps        text,
  tempo       text,
  rest_seconds int,
  rpe         text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table workout_exercises enable row level security;

create policy "workout_exercises_coach" on workout_exercises
  for all
  using  (workout_id in (select id from workouts where coach_id = auth.uid()))
  with check (workout_id in (select id from workouts where coach_id = auth.uid()));


-- Cardio Session Library
create table if not exists cardio_sessions (
  id               uuid        primary key default gen_random_uuid(),
  coach_id         uuid        not null,
  name             text        not null,
  cardio_type      text,
  duration_minutes int,
  distance_km      numeric,
  heart_rate_zone  text,
  intensity        text,
  pace             text,
  incline          numeric,
  speed            numeric,
  notes            text,
  progression      text,
  is_archived      boolean     not null default false,
  created_at       timestamptz not null default now()
);

alter table cardio_sessions enable row level security;

create policy "cardio_sessions_coach" on cardio_sessions
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());


-- HIIT Circuit Library
create table if not exists hiit_circuits (
  id                      uuid        primary key default gen_random_uuid(),
  coach_id                uuid        not null,
  name                    text        not null,
  circuit_type            text        not null default 'custom',
  rounds                  int,
  rest_between_rounds_sec int,
  notes                   text,
  is_archived             boolean     not null default false,
  created_at              timestamptz not null default now()
);

alter table hiit_circuits enable row level security;

create policy "hiit_circuits_coach" on hiit_circuits
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());


-- Exercises within a HIIT circuit
create table if not exists hiit_exercises (
  id           uuid primary key default gen_random_uuid(),
  circuit_id   uuid not null references hiit_circuits(id) on delete cascade,
  exercise_id  uuid references exercises(id) on delete set null,
  order_index  int  not null default 0,
  name         text not null,
  work_seconds int,
  rest_seconds int,
  notes        text
);

alter table hiit_exercises enable row level security;

create policy "hiit_exercises_coach" on hiit_exercises
  for all
  using  (circuit_id in (select id from hiit_circuits where coach_id = auth.uid()))
  with check (circuit_id in (select id from hiit_circuits where coach_id = auth.uid()));


-- Link training_sessions to a library workout (nullable — preserves all existing data)
alter table training_sessions
  add column if not exists workout_id uuid references workouts(id) on delete set null;
