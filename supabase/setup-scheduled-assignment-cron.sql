-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions, same as
-- setup-checkin-cron.sql) and supabase/scheduled-assignment-start-migration.sql run first.

-- Activates any meal-plan/training-block assignment scheduled to start today, every morning at
-- 00:10 UTC — well before any client would open the app, whatever UK clock time that is.
SELECT cron.schedule(
  'activate-scheduled-assignments-daily',
  '10 0 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://rjaduiqakoudnmkjwwdw.supabase.co/functions/v1/activate-scheduled-assignments',
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
-- SELECT cron.unschedule('activate-scheduled-assignments-daily');
