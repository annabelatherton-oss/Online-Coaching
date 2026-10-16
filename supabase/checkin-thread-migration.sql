-- Lets a client reply to their coach's comment on a specific check-in, as a small threaded
-- conversation attached to that one week — reuses the existing messages table (same realtime
-- delivery, same client/coach-scoped RLS policies already on it) rather than a new table, just
-- scoped by checkin_id instead of left null for the general Messages chat.
alter table messages add column if not exists checkin_id uuid references client_checkins(id) on delete cascade;

create index if not exists messages_checkin_id_created_at on messages (checkin_id, created_at) where checkin_id is not null;
