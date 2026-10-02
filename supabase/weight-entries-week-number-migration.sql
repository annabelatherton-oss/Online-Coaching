-- Lets a manually-logged weight entry be explicitly labelled with a week number (instead of only
-- ever falling back to the calendar-computed one, or showing as a bare "Weight log" placeholder) —
-- useful when backfilling history where the coach knows which week something belongs to better
-- than pure date math would guess. Multiple entries can share the same week_number; the entry's
-- own recorded_at date still decides where it sits in the chronological list.
alter table weight_entries add column if not exists week_number integer;
