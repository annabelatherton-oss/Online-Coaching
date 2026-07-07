create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references clients(id) on delete cascade not null,
  coach_id    uuid references profiles(id) on delete cascade not null,
  sender      text not null check (sender in ('coach', 'client')),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now() not null
);

alter table messages enable row level security;

create policy "coach_own_messages" on messages
  for all to authenticated
  using  (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "client_own_messages" on messages
  for all to authenticated
  using  (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

create index if not exists messages_client_id_created_at on messages (client_id, created_at desc);
create index if not exists messages_coach_id_created_at  on messages (coach_id,  created_at desc);
