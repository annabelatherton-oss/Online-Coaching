alter table client_checkins
  add column if not exists coach_response text,
  add column if not exists coach_responded_at timestamptz;
