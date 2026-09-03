-- Diagnostic only — makes no changes. Lists every training_programs row
-- whose name is shared by more than one row for the same coach, along with
-- how many active client assignments point at each one, so you can tell
-- which copy is "the real one" Lois (or anyone else) is actually on, and
-- which is the stray duplicate.
SELECT
  tp.id,
  tp.name,
  tp.created_at,
  tp.top_lifts,
  (SELECT count(*) FROM client_training_assignments cta WHERE cta.program_id = tp.id AND cta.active = true) AS active_clients,
  (SELECT count(*) FROM training_sessions ts WHERE ts.program_id = tp.id) AS session_count
FROM training_programs tp
WHERE tp.name IN (
  SELECT name FROM training_programs
  WHERE coach_id = tp.coach_id
  GROUP BY name
  HAVING count(*) > 1
)
ORDER BY tp.name, tp.created_at;
