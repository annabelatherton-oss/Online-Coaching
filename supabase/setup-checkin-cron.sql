-- Run in Supabase SQL Editor
-- Requires pg_cron and pg_net extensions (enable both in Database > Extensions)

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
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job;

-- To remove the job if needed:
-- SELECT cron.unschedule('checkin-friday-reminder');
