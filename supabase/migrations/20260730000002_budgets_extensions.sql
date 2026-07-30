-- Extend budgets table schema to support advanced limits configurations
-- Applied Date: 2026-07-30

ALTER TABLE public.budgets 
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS carry_forward BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_reset BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'credit-card',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS warning_threshold NUMERIC(3,2) DEFAULT 0.85;

-- Update the vw_budget_progress view to include the extended properties and warning thresholds
CREATE OR REPLACE VIEW public.vw_budget_progress AS
SELECT
  b.id AS budget_id,
  b.user_id,
  b.category_id,
  COALESCE(b.name, c.name, 'Overall Limit') AS category_name,
  b.limit_amount,
  b.period::TEXT AS period,
  b.carry_forward,
  b.auto_reset,
  b.color,
  b.icon,
  b.notes,
  b.warning_threshold,
  COALESCE(SUM(t.amount), 0) AS spent_amount,
  b.limit_amount - COALESCE(SUM(t.amount), 0) AS remaining_amount,
  CASE 
    WHEN b.limit_amount > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / b.limit_amount) * 100, 2)
    ELSE 0 
  END AS utilization_percentage
FROM public.budgets b
LEFT JOIN public.categories c ON b.category_id = c.id
LEFT JOIN public.transactions t ON (t.category_id = b.category_id OR b.category_id IS NULL)
  AND t.user_id = b.user_id 
  AND t.deleted_at IS NULL 
  AND t.type = 'expense'
  AND t.date >= b.start_date 
  AND (b.end_date IS NULL OR t.date <= b.end_date)
  AND (
    (b.period = 'monthly' AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE)) OR
    (b.period = 'weekly' AND date_trunc('week', t.date) = date_trunc('week', CURRENT_DATE)) OR
    (b.period = 'daily' AND t.date = CURRENT_DATE) OR
    (b.period = 'yearly' AND date_trunc('year', t.date) = date_trunc('year', CURRENT_DATE))
  )
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.user_id, b.category_id, c.name, b.name, b.limit_amount, b.period, b.carry_forward, b.auto_reset, b.color, b.icon, b.notes, b.warning_threshold;
