-- Re-populates every actively-assigned client's weekly schedule (workout
-- days) from their currently-assigned training programme's sessions — the
-- same thing the "Re-populate" button does per client, run for everyone at
-- once. Run this AFTER dedupe-training-programs.sql, since it depends on
-- client_training_assignments already pointing at the correct block.
-- Cardio/rest schedule items are untouched; HIIT items are cleared (same as
-- the per-client button) since they aren't derived from the training block.

-- 1. Clear existing workout/hiit items for every actively-assigned client.
DELETE FROM client_schedule_items
WHERE item_type IN ('workout', 'hiit')
  AND client_id IN (SELECT client_id FROM client_training_assignments WHERE active = true);

-- 2. Reinsert one row per day from each client's assigned programme's week-1
--    sessions (first session per day, by order_index — matches the app's own
--    de-dupe rule).
INSERT INTO client_schedule_items (client_id, coach_id, day_of_week, item_type, workout_id, custom_label, order_index)
SELECT DISTINCT ON (cta.client_id, parsed.day)
  cta.client_id, cta.coach_id, parsed.day, 'workout', ts.workout_id, parsed.label, 0
FROM client_training_assignments cta
JOIN training_sessions ts ON ts.program_id = cta.program_id AND ts.week_number = 1
CROSS JOIN LATERAL (
  SELECT
    x.day_match AS day,
    COALESCE(NULLIF(TRIM(BOTH ' -–—' FROM regexp_replace(ts.name, '^' || x.day_match, '')), ''), x.day_match) AS label
  FROM (SELECT (regexp_match(ts.name, '^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)'))[1] AS day_match) x
  WHERE x.day_match IS NOT NULL
) AS parsed
WHERE cta.active = true
ORDER BY cta.client_id, parsed.day, ts.order_index;
