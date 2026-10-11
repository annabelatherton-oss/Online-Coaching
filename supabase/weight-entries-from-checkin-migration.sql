-- Marks which weight_entries rows were auto-created by a client's own check-in submission (as
-- opposed to a coach's manual backfill entry) so the check-in save flow can update its own mirror
-- row in place on a later edit instead of blindly inserting a new one every time — that old
-- behaviour is what piled up duplicate, wrongly-dated weight entries whenever a check-in got
-- edited (even just to fix a typo in the notes, with the weight itself unchanged).
alter table weight_entries add column if not exists from_checkin boolean not null default false;

-- Backfill: tag existing rows that are very likely a check-in's own mirror (same client, matching
-- weight, and the entry's date lines up with when that check-in was submitted/last updated) and
-- set their week_number from the check-in so they stop falling back to a calendar-guessed week —
-- this is what made a LATE check-in's weight show under today's calendar week instead of the week
-- it was actually for. Only touches rows that don't already have an explicit week_number, so it
-- never overwrites anything a coach deliberately set by hand.
update weight_entries we
set from_checkin = true,
    week_number = cc.week_number
from client_checkins cc
where we.client_id = cc.client_id
  and we.week_number is null
  and cc.weight_kg is not null
  and we.weight_kg = cc.weight_kg
  and we.recorded_at = coalesce(cc.submitted_at, cc.updated_at)::date;

-- Preview only — review before deleting anything: likely-duplicate weight entries for the same
-- client and (near-)identical weight recorded within a few days of each other. These are the
-- probable fallout of the bug above (an edited check-in adding another dated-to-today row with the
-- same weight as before). Nothing here is deleted automatically.
select client_id, weight_kg, array_agg(id order by recorded_at) as entry_ids, array_agg(recorded_at order by recorded_at) as dates
from weight_entries
group by client_id, weight_kg
having count(*) > 1
order by client_id, weight_kg;
