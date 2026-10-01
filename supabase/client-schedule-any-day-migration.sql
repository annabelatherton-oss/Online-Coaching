-- Allows a client_schedule_items row to be "Any day" — cardio that isn't tied to a specific day,
-- so the client can do it whenever works for them. Shows on every day of their to-do list; ticking
-- it off on any one day marks it done for that whole week (see src/pages/client/ClientTodoList.jsx).
ALTER TABLE client_schedule_items DROP CONSTRAINT IF EXISTS client_schedule_items_day_of_week_check;
ALTER TABLE client_schedule_items ADD CONSTRAINT client_schedule_items_day_of_week_check
  CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Any'));
