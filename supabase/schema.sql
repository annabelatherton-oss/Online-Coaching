-- ============================================================
-- CoachHub — Full Database Schema (Phases 1–8)
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
create type user_role as enum ('coach', 'client');
create type meal_category as enum ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'evening_snack');
create type meal_slot_type as enum ('breakfast1', 'breakfast2', 'lunch1', 'lunch2', 'dinner1', 'dinner2', 'preworkout', 'evening_snack');

-- ─────────────────────────────────────────────────────────────
-- PROFILES (mirrors auth.users)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'client',
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────────────────────
create table clients (
  id                 uuid primary key default gen_random_uuid(),
  coach_id           uuid not null references profiles(id) on delete cascade,
  profile_id         uuid not null references profiles(id) on delete cascade,
  goal               text,
  current_calories   int,
  start_date         date not null default current_date,
  access_weeks       int not null default 4,
  access_expires_at  timestamptz,
  is_active          boolean not null default true,
  is_paused          boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Auto-calculate access_expires_at from start_date + access_weeks
create or replace function set_access_expires()
returns trigger language plpgsql as $$
begin
  new.access_expires_at := new.start_date::timestamptz + (new.access_weeks * interval '7 days');
  new.updated_at := now();
  return new;
end;
$$;

create trigger clients_set_expires
  before insert or update of start_date, access_weeks
  on clients
  for each row execute function set_access_expires();

create unique index clients_profile_id_unique on clients(profile_id);

-- ─────────────────────────────────────────────────────────────
-- WEIGHT ENTRIES  (Phase 2)
-- ─────────────────────────────────────────────────────────────
create table weight_entries (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  weight_kg    numeric(5,2) not null,
  recorded_at  date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- MEASUREMENTS  (Phase 2)
-- ─────────────────────────────────────────────────────────────
create table measurements (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  chest_cm     numeric(5,1),
  waist_cm     numeric(5,1),
  hips_cm      numeric(5,1),
  thighs_cm    numeric(5,1),
  arms_cm      numeric(5,1),
  recorded_at  date not null default current_date,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- PROGRESS PHOTOS  (Phase 2)
-- ─────────────────────────────────────────────────────────────
create table progress_photos (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  photo_url    text not null,
  caption      text,
  recorded_at  date not null default current_date,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- MEALS  (Phase 3)
-- ─────────────────────────────────────────────────────────────
create table meals (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references profiles(id) on delete cascade,
  name         text not null,
  category     meal_category not null,
  instructions text,
  photo_url    text,
  created_at   timestamptz not null default now()
);

create table meal_ingredients (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid not null references meals(id) on delete cascade,
  name        text not null,
  quantity_g  numeric(8,2) not null default 0,
  calories    numeric(8,2) not null default 0,
  protein_g   numeric(8,2) not null default 0,
  carbs_g     numeric(8,2) not null default 0,
  fat_g       numeric(8,2) not null default 0
);

-- ─────────────────────────────────────────────────────────────
-- MEAL SCALED VERSIONS  (Phase 3 — Scaling System)
-- ─────────────────────────────────────────────────────────────
create table meal_scaled_versions (
  id              uuid primary key default gen_random_uuid(),
  meal_id         uuid not null references meals(id) on delete cascade,
  calorie_target  int not null,
  scaling_factor  numeric(6,4) not null default 1.0,
  created_at      timestamptz not null default now()
);

create table meal_scaled_ingredients (
  id                    uuid primary key default gen_random_uuid(),
  scaled_version_id     uuid not null references meal_scaled_versions(id) on delete cascade,
  ingredient_id         uuid not null references meal_ingredients(id) on delete cascade,
  quantity_g            numeric(8,2) not null,
  calories              numeric(8,2) not null,
  protein_g             numeric(8,2) not null,
  carbs_g               numeric(8,2) not null,
  fat_g                 numeric(8,2) not null,
  is_manually_overridden boolean not null default false
);

-- ─────────────────────────────────────────────────────────────
-- TRAINING PROGRAMMES  (Phase 5)
-- ─────────────────────────────────────────────────────────────
create table training_programmes (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  name        text not null,
  category    text,   -- e.g. Fat loss, Beginner, Glute focused, etc.
  description text,
  created_at  timestamptz not null default now()
);

create table programme_exercises (
  id            uuid primary key default gen_random_uuid(),
  programme_id  uuid not null references training_programmes(id) on delete cascade,
  exercise_name text not null,
  sets          int,
  reps          text,     -- text to allow "8-12" ranges
  rir           text,     -- Reps In Reserve
  rest_seconds  int,
  video_url     text,
  notes         text,
  order_index   int not null default 0
);

-- ─────────────────────────────────────────────────────────────
-- WEEKLY MEAL TEMPLATES  (Phase 4)
-- ─────────────────────────────────────────────────────────────
create table weekly_templates (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references profiles(id) on delete cascade,
  name            text not null,
  week_number     int,
  calorie_target  int,
  created_at      timestamptz not null default now()
);

create table template_meal_slots (
  id                 uuid primary key default gen_random_uuid(),
  template_id        uuid not null references weekly_templates(id) on delete cascade,
  slot_type          meal_slot_type not null,
  meal_id            uuid references meals(id) on delete set null,
  scaled_version_id  uuid references meal_scaled_versions(id) on delete set null
);

-- ─────────────────────────────────────────────────────────────
-- CLIENT ASSIGNMENTS  (Phase 4–5)
-- ─────────────────────────────────────────────────────────────
create table client_meal_plans (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  template_id  uuid not null references weekly_templates(id) on delete cascade,
  week_start   date not null,
  created_at   timestamptz not null default now()
);

create table client_programme_assignments (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  programme_id  uuid not null references training_programmes(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  week_start    date
);

-- ─────────────────────────────────────────────────────────────
-- CHECK-INS  (Phase 6)
-- ─────────────────────────────────────────────────────────────
create table checkin_questions (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references profiles(id) on delete cascade,
  question_text  text not null,
  order_index    int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table checkins (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id) on delete cascade,
  week_start          date not null,
  body_weight_kg      numeric(5,2),
  avg_steps           int,
  training_adherence  int check (training_adherence between 1 and 10),
  diet_adherence      int check (diet_adherence between 1 and 10),
  hunger_score        int check (hunger_score between 1 and 10),
  energy_score        int check (energy_score between 1 and 10),
  sleep_quality       int check (sleep_quality between 1 and 10),
  menstrual_info      text,
  digestion           text,
  wins                text,
  struggles           text,
  questions_for_coach text,
  submitted_at        timestamptz,
  reviewed_by_coach   boolean not null default false,
  created_at          timestamptz not null default now()
);

create table checkin_photos (
  id          uuid primary key default gen_random_uuid(),
  checkin_id  uuid not null references checkins(id) on delete cascade,
  photo_url   text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table clients enable row level security;
alter table weight_entries enable row level security;
alter table measurements enable row level security;
alter table progress_photos enable row level security;
alter table meals enable row level security;
alter table meal_ingredients enable row level security;
alter table meal_scaled_versions enable row level security;
alter table meal_scaled_ingredients enable row level security;
alter table training_programmes enable row level security;
alter table programme_exercises enable row level security;
alter table weekly_templates enable row level security;
alter table template_meal_slots enable row level security;
alter table client_meal_plans enable row level security;
alter table client_programme_assignments enable row level security;
alter table checkin_questions enable row level security;
alter table checkins enable row level security;
alter table checkin_photos enable row level security;

-- Helper: get current user's role
create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper: get coach_id for current client
create or replace function current_client_coach_id()
returns uuid language sql security definer stable as $$
  select coach_id from clients where profile_id = auth.uid() limit 1;
$$;

-- ── profiles ──────────────────────────────────────────────────
create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());

create policy "Coach can read client profiles"
  on profiles for select
  using (
    current_user_role() = 'coach'
    and exists (
      select 1 from clients c
      where c.profile_id = profiles.id and c.coach_id = auth.uid()
    )
  );

create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

create policy "Coach can insert profiles for clients"
  on profiles for insert
  with check (current_user_role() = 'coach' or id = auth.uid());

-- ── clients ───────────────────────────────────────────────────
create policy "Coach can manage their clients"
  on clients for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Client can read own client row"
  on clients for select
  using (profile_id = auth.uid());

-- ── weight_entries ────────────────────────────────────────────
create policy "Coach can manage client weight entries"
  on weight_entries for all
  using (exists (select 1 from clients c where c.id = weight_entries.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = weight_entries.client_id and c.coach_id = auth.uid()));

create policy "Client can manage own weight entries"
  on weight_entries for all
  using (exists (select 1 from clients c where c.id = weight_entries.client_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = weight_entries.client_id and c.profile_id = auth.uid()));

-- ── measurements ──────────────────────────────────────────────
create policy "Coach can manage client measurements"
  on measurements for all
  using (exists (select 1 from clients c where c.id = measurements.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = measurements.client_id and c.coach_id = auth.uid()));

create policy "Client can read own measurements"
  on measurements for select
  using (exists (select 1 from clients c where c.id = measurements.client_id and c.profile_id = auth.uid()));

-- ── progress_photos ───────────────────────────────────────────
create policy "Coach can manage client photos"
  on progress_photos for all
  using (exists (select 1 from clients c where c.id = progress_photos.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = progress_photos.client_id and c.coach_id = auth.uid()));

create policy "Client can manage own photos"
  on progress_photos for all
  using (exists (select 1 from clients c where c.id = progress_photos.client_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = progress_photos.client_id and c.profile_id = auth.uid()));

-- ── meals + ingredients ───────────────────────────────────────
create policy "Coach can manage own meals"
  on meals for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Client can read coach meals"
  on meals for select
  using (coach_id = current_client_coach_id());

create policy "Coach can manage meal ingredients"
  on meal_ingredients for all
  using (exists (select 1 from meals m where m.id = meal_ingredients.meal_id and m.coach_id = auth.uid()))
  with check (exists (select 1 from meals m where m.id = meal_ingredients.meal_id and m.coach_id = auth.uid()));

create policy "Client can read meal ingredients"
  on meal_ingredients for select
  using (exists (select 1 from meals m where m.id = meal_ingredients.meal_id and m.coach_id = current_client_coach_id()));

-- ── meal scaled versions ──────────────────────────────────────
create policy "Coach can manage scaled versions"
  on meal_scaled_versions for all
  using (exists (select 1 from meals m where m.id = meal_scaled_versions.meal_id and m.coach_id = auth.uid()))
  with check (exists (select 1 from meals m where m.id = meal_scaled_versions.meal_id and m.coach_id = auth.uid()));

create policy "Client can read scaled versions"
  on meal_scaled_versions for select
  using (exists (select 1 from meals m where m.id = meal_scaled_versions.meal_id and m.coach_id = current_client_coach_id()));

create policy "Coach can manage scaled ingredients"
  on meal_scaled_ingredients for all
  using (exists (
    select 1 from meal_scaled_versions sv
    join meals m on m.id = sv.meal_id
    where sv.id = meal_scaled_ingredients.scaled_version_id and m.coach_id = auth.uid()
  ))
  with check (exists (
    select 1 from meal_scaled_versions sv
    join meals m on m.id = sv.meal_id
    where sv.id = meal_scaled_ingredients.scaled_version_id and m.coach_id = auth.uid()
  ));

create policy "Client can read scaled ingredients"
  on meal_scaled_ingredients for select
  using (exists (
    select 1 from meal_scaled_versions sv
    join meals m on m.id = sv.meal_id
    where sv.id = meal_scaled_ingredients.scaled_version_id and m.coach_id = current_client_coach_id()
  ));

-- ── training programmes ───────────────────────────────────────
create policy "Coach can manage programmes"
  on training_programmes for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Client can read assigned programmes"
  on training_programmes for select
  using (
    coach_id = current_client_coach_id()
    or exists (
      select 1 from client_programme_assignments cpa
      join clients c on c.id = cpa.client_id
      where cpa.programme_id = training_programmes.id and c.profile_id = auth.uid()
    )
  );

create policy "Coach can manage exercises"
  on programme_exercises for all
  using (exists (select 1 from training_programmes p where p.id = programme_exercises.programme_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from training_programmes p where p.id = programme_exercises.programme_id and p.coach_id = auth.uid()));

create policy "Client can read exercises"
  on programme_exercises for select
  using (exists (
    select 1 from training_programmes p
    where p.id = programme_exercises.programme_id and p.coach_id = current_client_coach_id()
  ));

-- ── weekly templates ──────────────────────────────────────────
create policy "Coach can manage templates"
  on weekly_templates for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Client can read their templates"
  on weekly_templates for select
  using (
    exists (
      select 1 from client_meal_plans cmp
      join clients c on c.id = cmp.client_id
      where cmp.template_id = weekly_templates.id and c.profile_id = auth.uid()
    )
  );

create policy "Coach can manage template slots"
  on template_meal_slots for all
  using (exists (select 1 from weekly_templates t where t.id = template_meal_slots.template_id and t.coach_id = auth.uid()))
  with check (exists (select 1 from weekly_templates t where t.id = template_meal_slots.template_id and t.coach_id = auth.uid()));

create policy "Client can read template slots"
  on template_meal_slots for select
  using (exists (
    select 1 from weekly_templates t
    join client_meal_plans cmp on cmp.template_id = t.id
    join clients c on c.id = cmp.client_id
    where t.id = template_meal_slots.template_id and c.profile_id = auth.uid()
  ));

-- ── client meal plans ─────────────────────────────────────────
create policy "Coach can manage client meal plans"
  on client_meal_plans for all
  using (exists (select 1 from clients c where c.id = client_meal_plans.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = client_meal_plans.client_id and c.coach_id = auth.uid()));

create policy "Client can read own meal plans"
  on client_meal_plans for select
  using (exists (select 1 from clients c where c.id = client_meal_plans.client_id and c.profile_id = auth.uid()));

-- ── client programme assignments ──────────────────────────────
create policy "Coach can manage programme assignments"
  on client_programme_assignments for all
  using (exists (select 1 from clients c where c.id = client_programme_assignments.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = client_programme_assignments.client_id and c.coach_id = auth.uid()));

create policy "Client can read own assignments"
  on client_programme_assignments for select
  using (exists (select 1 from clients c where c.id = client_programme_assignments.client_id and c.profile_id = auth.uid()));

-- ── checkin questions ─────────────────────────────────────────
create policy "Coach can manage checkin questions"
  on checkin_questions for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Client can read coach checkin questions"
  on checkin_questions for select
  using (coach_id = current_client_coach_id());

-- ── checkins ──────────────────────────────────────────────────
create policy "Coach can manage client checkins"
  on checkins for all
  using (exists (select 1 from clients c where c.id = checkins.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = checkins.client_id and c.coach_id = auth.uid()));

create policy "Client can manage own checkins"
  on checkins for all
  using (exists (select 1 from clients c where c.id = checkins.client_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = checkins.client_id and c.profile_id = auth.uid()));

-- ── checkin photos ────────────────────────────────────────────
create policy "Coach can manage checkin photos"
  on checkin_photos for all
  using (exists (
    select 1 from checkins ci join clients c on c.id = ci.client_id
    where ci.id = checkin_photos.checkin_id and c.coach_id = auth.uid()
  ))
  with check (exists (
    select 1 from checkins ci join clients c on c.id = ci.client_id
    where ci.id = checkin_photos.checkin_id and c.coach_id = auth.uid()
  ));

create policy "Client can manage own checkin photos"
  on checkin_photos for all
  using (exists (
    select 1 from checkins ci join clients c on c.id = ci.client_id
    where ci.id = checkin_photos.checkin_id and c.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from checkins ci join clients c on c.id = ci.client_id
    where ci.id = checkin_photos.checkin_id and c.profile_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run separately in Storage section or via API)
-- ─────────────────────────────────────────────────────────────
-- NOTE: Create these buckets in Supabase Dashboard > Storage:
--   - progress-photos  (private)
--   - meal-photos      (private)
--   - checkin-photos   (private)
--   - avatars          (public)
