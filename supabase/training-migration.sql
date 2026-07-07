-- Training programmes
create table if not exists training_programs (
  id           uuid        primary key default gen_random_uuid(),
  coach_id     uuid        not null,
  name         text        not null,
  weeks_total  int         not null default 12,
  current_week int         not null default 1,
  created_at   timestamptz default now() not null
);

alter table training_programs enable row level security;

create policy "training_programs_coach" on training_programs
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());


-- Sessions within a week (e.g. "Upper Body A", "Lower Body B")
create table if not exists training_sessions (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references training_programs(id) on delete cascade,
  week_number int  not null,
  order_index int  not null default 0,
  name        text not null
);

alter table training_sessions enable row level security;

create policy "training_sessions_coach" on training_sessions
  for all
  using  (program_id in (select id from training_programs where coach_id = auth.uid()))
  with check (program_id in (select id from training_programs where coach_id = auth.uid()));

create policy "training_sessions_client_read" on training_sessions
  for select
  using (program_id in (
    select program_id from client_training_assignments
    where active = true
      and client_id in (select id from clients where profile_id = auth.uid())
  ));


-- Exercises within a session
create table if not exists session_exercises (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references training_sessions(id) on delete cascade,
  order_index  int  not null default 0,
  name         text not null,
  sets         int,
  reps         text,
  rpe          text,
  rest_seconds int,
  notes        text
);

alter table session_exercises enable row level security;

create policy "session_exercises_coach" on session_exercises
  for all
  using (session_id in (
    select ts.id from training_sessions ts
    join training_programs tp on tp.id = ts.program_id
    where tp.coach_id = auth.uid()
  ))
  with check (session_id in (
    select ts.id from training_sessions ts
    join training_programs tp on tp.id = ts.program_id
    where tp.coach_id = auth.uid()
  ));

create policy "session_exercises_client_read" on session_exercises
  for select
  using (session_id in (
    select ts.id from training_sessions ts
    where ts.program_id in (
      select program_id from client_training_assignments
      where active = true
        and client_id in (select id from clients where profile_id = auth.uid())
    )
  ));


-- Client assignments to a programme + week
create table if not exists client_training_assignments (
  id            uuid    primary key default gen_random_uuid(),
  client_id     uuid    not null references clients(id) on delete cascade,
  coach_id      uuid    not null,
  program_id    uuid    not null references training_programs(id),
  program_name  text,
  week_override int,
  active        boolean not null default true,
  created_at    timestamptz default now() not null
);

alter table client_training_assignments enable row level security;

create policy "client_training_assignments_coach" on client_training_assignments
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "client_training_assignments_client_read" on client_training_assignments
  for select using (
    client_id in (select id from clients where profile_id = auth.uid())
  );
