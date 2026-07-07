alter table training_programs
  add column if not exists top_lifts jsonb not null default '[]'::jsonb;
