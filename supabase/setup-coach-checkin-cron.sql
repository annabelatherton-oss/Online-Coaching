-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions,
-- same as setup-checkin-cron.sql), supabase/coach-push-subscriptions-migration.sql run first,
-- and the send-coach-checkin-reminder edge function deployed.
--
-- Before running: replace PASTE_KEY_HERE below with your project's actual service_role key
-- (Supabase dashboard -> Project Settings -> API -> service_role, under "Project API keys"). The
-- earlier version of this file used current_setting('app.supabase_service_role_key', true), which
-- silently returns an empty value unless that Postgres setting has separately been configured —
-- nothing in this project ever set it, so this cron job would have sent a blank Authorization
-- header on every run and failed with 401, same issue found and fixed in
-- setup-advance-plan-week-cron.sql. Embedding the real key directly here is what the
-- Authorization header actually needs to work.

-- If a 'coach-friday-checkin-reminder' job already exists from before, replace it rather than
-- adding a second one that would double-send every week.
SELECT cron.unschedule('coach-friday-checkin-reminder') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coach-friday-checkin-reminder');

-- Send the coach's "check-ins are due" reminder every Friday at 07:00 UK time.
-- 06:00 UTC = 07:00 BST (UK summer time). Change to '0 7 * * 5' in winter (UK on UTC+0).
SELECT cron.schedule(
  'coach-friday-checkin-reminder',
  '0 6 * * 5',
  $$
  SELECT net.http_post(
    url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/send-coach-checkin-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || 'PASTE_KEY_HERE'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job WHERE jobname = 'coach-friday-checkin-reminder';

-- To check whether it has actually been running, and whether each run succeeded:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'coach-friday-checkin-reminder') ORDER BY start_time DESC LIMIT 10;

-- To remove the job if needed:
-- SELECT cron.unschedule('coach-friday-checkin-reminder');

-- To run it manually right now instead of waiting for Friday (useful to confirm it actually sends
-- once the key above is filled in correctly):
-- SELECT net.http_post(
--   url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/send-coach-checkin-reminder',
--   headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || 'PASTE_KEY_HERE'),
--   body    := '{}'::jsonb
-- );
