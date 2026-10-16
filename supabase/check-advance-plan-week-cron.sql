-- Diagnoses why plan_groups.current_week isn't advancing on its own. Run each block and send
-- back what comes out of each.

-- 1) Does the job exist at all, and when did it last/next fire?
select jobid, jobname, schedule, active
from cron.job
where jobname = 'weekly-plan-advance';

-- 2) Its last 10 runs — status and any error message.
select start_time, end_time, status, return_message
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'weekly-plan-advance')
order by start_time desc
limit 10;

-- 3) Current state of every plan group, for reference.
select id, name, current_week from plan_groups order by name;
