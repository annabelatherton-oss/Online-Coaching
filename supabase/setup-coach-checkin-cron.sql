-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions,
-- same as setup-checkin-cron.sql) and supabase/coach-push-subscriptions-migration.sql run first.

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
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job;

-- To remove the job if needed:
-- SELECT cron.unschedule('coach-friday-checkin-reminder');
