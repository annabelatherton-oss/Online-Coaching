-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions, same as
-- setup-checkin-cron.sql) and the advance-plan-week edge function deployed first
-- (from a terminal with the Supabase CLI: supabase functions deploy advance-plan-week).

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
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job;

-- To change the day/time it advances (cron fields are minute hour day month weekday — weekday
-- 5 = Friday): SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'weekly-plan-advance'), schedule := '0 0 * * 5');

-- To remove the job if needed:
-- SELECT cron.unschedule('weekly-plan-advance');
