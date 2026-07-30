-- Extend goals table schema to support advanced savings goals tracking
-- Applied Date: 2026-07-30

ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'piggy-bank',
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the vw_goal_progress view to include the extended properties
CREATE OR REPLACE VIEW public.vw_goal_progress AS
SELECT
  g.id AS goal_id,
  g.user_id,
  g.name,
  g.target_amount,
  g.target_date,
  g.current_balance + COALESCE(SUM(gp.amount), 0) AS total_saved,
  g.icon,
  g.color,
  g.priority,
  g.notes,
  CASE 
    WHEN g.target_amount > 0 THEN ROUND(((g.current_balance + COALESCE(SUM(gp.amount), 0)) / g.target_amount) * 100, 2)
    ELSE 0 
  END AS progress_percentage
FROM public.goals g
LEFT JOIN public.goal_progress gp ON gp.goal_id = g.id AND gp.deleted_at IS NULL
WHERE g.deleted_at IS NULL
GROUP BY g.id, g.user_id, g.name, g.target_amount, g.target_date, g.current_balance, g.icon, g.color, g.priority, g.notes;
