-- Lets a coach "tick off" a Needs Attention item on the dashboard once they've dealt with it,
-- rather than it sitting there until the underlying condition happens to clear itself (a low
-- rating streak breaking, a client finally checking in, etc — several of these have no other way
-- to acknowledge them at all). Keyed by the reason's own text rather than a foreign key into
-- whichever table produced it, since the six different signals that feed "Needs attention" don't
-- share a common row type — this is deliberately a flat, generic dismiss log rather than one
-- per-source table.
create table if not exists coach_attention_dismissals (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  reason_text text not null,
  dismissed_at timestamptz not null default now(),
  unique (coach_id, client_id, reason_text)
);

create index if not exists coach_attention_dismissals_coach_idx on coach_attention_dismissals (coach_id);

alter table coach_attention_dismissals enable row level security;

drop policy if exists "coach_attention_dismissals_own" on coach_attention_dismissals;
create policy "coach_attention_dismissals_own" on coach_attention_dismissals
  for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
