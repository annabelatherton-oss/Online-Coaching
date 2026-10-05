-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions) and the
-- send-checkin-reminders edge function deployed first.
--
-- Before running: replace PASTE_KEY_HERE below with your project's actual service_role key
-- (Supabase dashboard -> Project Settings -> API -> service_role, under "Project API keys"). The
-- earlier version of this file used current_setting('app.supabase_service_role_key', true), which
-- silently returns an empty value unless that Postgres setting has separately been configured —
-- nothing in this project ever set it, so this cron job would have sent a blank Authorization
-- header on every run and failed with 401, same issue found and fixed in
-- setup-advance-plan-week-cron.sql. Embedding the real key directly here is what the
-- Authorization header actually needs to work.

-- If a 'checkin-friday-reminder' job already exists from before, replace it rather than adding a
-- second one that would double-send every week.
SELECT cron.unschedule('checkin-friday-reminder') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'checkin-friday-reminder');

-- Send check-in reminders every Friday at 05:00 UTC (= 06:00 BST / UK summer time)
-- Change to '0 6 * * 5' in winter (when UK is UTC+0)
SELECT cron.schedule(
  'checkin-friday-reminder',
  '0 5 * * 5',
  $$
  SELECT net.http_post(
    url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/send-checkin-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || 'PASTE_KEY_HERE'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job WHERE jobname = 'checkin-friday-reminder';

-- To check whether it has actually been running, and whether each run succeeded:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'checkin-friday-reminder') ORDER BY start_time DESC LIMIT 10;

-- To remove the job if needed:
-- SELECT cron.unschedule('checkin-friday-reminder');

-- To run it manually right now instead of waiting for Friday (useful to confirm it actually sends
-- once the key above is filled in correctly):
-- SELECT net.http_post(
--   url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/send-checkin-reminders',
--   headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || 'PASTE_KEY_HERE'),
--   body    := '{}'::jsonb
-- );
