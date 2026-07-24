-- Fix duplicate check-ins caused by a week_override change mid-cycle.
--
-- When the coach changes a client's week_override, the old code created a NEW
-- check-in row (for the new week number) instead of updating the existing one.
-- This script finds the duplicate and removes it, keeping the most recent submission.
--
-- Run once in Supabase SQL Editor.  Verify the query before the DELETE.

-- 1. Preview which rows would be deleted (run this first to check)
SELECT id, client_id, week_number, created_at, submitted_at
FROM client_checkins
WHERE client_id = (
  SELECT c.id FROM clients c JOIN profiles p ON p.id = c.profile_id WHERE p.email = 'lois@example.com' LIMIT 1
)
ORDER BY created_at;

-- 2. Delete the duplicate (the older one with a different week_number, keeping the most recent)
-- Uncomment and run only after verifying step 1 above shows the right rows.
/*
DELETE FROM client_checkins
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at DESC) AS rn
    FROM client_checkins
    WHERE client_id = (
      SELECT c.id FROM clients c JOIN profiles p ON p.id = c.profile_id WHERE p.email = 'lois@example.com' LIMIT 1
    )
  ) ranked
  WHERE rn > 1
);
*/
