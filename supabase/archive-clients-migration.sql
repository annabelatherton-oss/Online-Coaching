-- Lets a coach archive a client: they stop showing up anywhere in the coach's
-- dashboard/client list, but every bit of their data (meal plans, check-ins, weight
-- history, etc) stays in place and the client can be unarchived at any time.
-- Not the same as deleting a client, which removes the row (and everything that
-- cascades from it) permanently.

alter table clients add column if not exists is_archived boolean not null default false;
