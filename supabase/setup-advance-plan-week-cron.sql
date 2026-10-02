-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions, same as
-- setup-checkin-cron.sql) and the advance-plan-week edge function deployed first
-- (from a terminal with the Supabase CLI: supabase functions deploy advance-plan-week).
--
-- Before running: replace YOUR_SERVICE_ROLE_KEY below with your project's actual service_role key
-- (Supabase dashboard -> Project Settings -> API -> service_role, under "Project API keys"). The
-- earlier version of this file used current_setting('app.supabase_service_role_key', true), which
-- silently returns an empty value unless that Postgres setting has separately been configured —
-- nothing in this project ever set it, so the cron job was calling the function with a blank
-- Authorization header on every run, which Supabase rejects before the function code ever runs.
-- That's why current_week was never actually advancing. Embedding the real key directly here is
-- what the Authorization header needs to actually work.

-- If a 'weekly-plan-advance' job already exists from before, replace it rather than adding a
-- second one that would double-advance every week.
SELECT cron.unschedule('weekly-plan-advance') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-plan-advance');

-- Moves every plan group's "current week" forward by one, every Friday at 00:00 UTC — so the
-- shared meal rotation advances on its own and you never have to click the arrow in the Plan
-- Group editor. A client with their own week_override set is unaffected either way.
SELECT cron.schedule(
  'weekly-plan-advance',
  '0 0 * * 5',
  $$
  SELECT net.http_post(
    url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/advance-plan-week',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job WHERE jobname = 'weekly-plan-advance';

-- To check whether it has actually been running, and whether each run succeeded:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-plan-advance') ORDER BY start_time DESC LIMIT 10;

-- To change the day/time it advances (cron fields are minute hour day month weekday — weekday
-- 5 = Friday): SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'weekly-plan-advance'), schedule := '0 0 * * 5');

-- To remove the job if needed:
-- SELECT cron.unschedule('weekly-plan-advance');

-- To run it manually right now instead of waiting for Friday (useful to confirm it actually
-- advances current_week once the key above is filled in correctly):
-- SELECT net.http_post(
--   url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/advance-plan-week',
--   headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'),
--   body    := '{}'::jsonb
-- );
