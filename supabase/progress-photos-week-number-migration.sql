-- Lets a coach-uploaded progress photo be explicitly labelled with a week number (instead of only
-- ever falling back to the calendar-computed one) — useful when backfilling a photo that was taken
-- on a different day than its check-in, or adding an old photo the coach knows belongs to a
-- specific week better than pure date math would guess.
alter table progress_photos add column if not exists week_number integer;
