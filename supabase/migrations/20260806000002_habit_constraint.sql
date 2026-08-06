-- 20260806000002_habit_constraint.sql
-- Delete duplicate records if any exist before applying unique constraint
DELETE FROM public.habit_logs a USING public.habit_logs b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.name = b.name
  AND a.logged_date = b.logged_date;
 
-- Add unique constraint to enable atomic conflicts management
ALTER TABLE public.habit_logs 
  DROP CONSTRAINT IF EXISTS habit_logs_user_id_name_logged_date_key;
 
ALTER TABLE public.habit_logs 
  ADD CONSTRAINT habit_logs_user_id_name_logged_date_key UNIQUE (user_id, name, logged_date);
