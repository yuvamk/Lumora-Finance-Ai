-- Migration: Recreate views with security_invoker = true to enforce Row-Level Security
-- Applied Date: 2026-08-06

-- 1. vw_dashboard_summary
DROP VIEW IF EXISTS public.vw_dashboard_summary CASCADE;
CREATE VIEW public.vw_dashboard_summary WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  COALESCE(
    (SELECT SUM(amount) FROM public.transactions WHERE user_id = p.id AND deleted_at IS NULL AND type = 'income'), 0
  ) - COALESCE(
    (SELECT SUM(amount) FROM public.transactions WHERE user_id = p.id AND deleted_at IS NULL AND type = 'expense'), 0
  ) AS current_balance,
  
  COALESCE(
    (SELECT SUM(amount) FROM public.transactions 
     WHERE user_id = p.id AND deleted_at IS NULL AND type = 'income' 
       AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)), 0
  ) AS month_income,
  
  COALESCE(
    (SELECT SUM(amount) FROM public.transactions 
     WHERE user_id = p.id AND deleted_at IS NULL AND type = 'expense' 
       AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)), 0
  ) AS month_expense,
  
  COALESCE(
    (SELECT SUM(amount) FROM public.subscriptions 
     WHERE user_id = p.id AND deleted_at IS NULL AND status = 'active'), 0
  ) AS active_subscriptions_total
FROM public.profiles p;

-- 2. vw_cashflow
DROP VIEW IF EXISTS public.vw_cashflow CASCADE;
CREATE VIEW public.vw_cashflow WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('month', date)::DATE AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS net
FROM public.transactions
WHERE deleted_at IS NULL
GROUP BY user_id, date_trunc('month', date)::DATE;

-- 3. vw_budget_progress
DROP VIEW IF EXISTS public.vw_budget_progress CASCADE;
CREATE VIEW public.vw_budget_progress WITH (security_invoker = true) AS
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

-- 4. vw_goal_progress
DROP VIEW IF EXISTS public.vw_goal_progress CASCADE;
CREATE VIEW public.vw_goal_progress WITH (security_invoker = true) AS
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

-- 5. vw_category_breakdown
DROP VIEW IF EXISTS public.vw_category_breakdown CASCADE;
CREATE VIEW public.vw_category_breakdown WITH (security_invoker = true) AS
WITH monthly_totals AS (
  SELECT
    user_id,
    date_trunc('month', date)::DATE AS month,
    SUM(amount) AS grand_total
  FROM public.transactions
  WHERE deleted_at IS NULL AND type = 'expense'
  GROUP BY user_id, date_trunc('month', date)::DATE
)
SELECT
  t.user_id,
  t.category_id,
  c.name AS category_name,
  c.type::TEXT AS type,
  date_trunc('month', t.date)::DATE AS month,
  SUM(t.amount) AS total_spent,
  COUNT(t.id) AS transaction_count,
  CASE 
    WHEN m.grand_total > 0 THEN ROUND((SUM(t.amount) / m.grand_total) * 100, 2)
    ELSE 0
  END AS percentage
FROM public.transactions t
JOIN public.categories c ON t.category_id = c.id
LEFT JOIN monthly_totals m ON t.user_id = m.user_id AND date_trunc('month', t.date)::DATE = m.month
WHERE t.deleted_at IS NULL AND t.type = 'expense'
GROUP BY t.user_id, t.category_id, c.name, c.type, date_trunc('month', t.date)::DATE, m.grand_total;

-- 6. vw_monthly_statistics
DROP VIEW IF EXISTS public.vw_monthly_statistics CASCADE;
CREATE VIEW public.vw_monthly_statistics WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('month', date)::DATE AS month,
  AVG(amount) AS avg_amount,
  COUNT(id) AS transaction_count
FROM public.transactions
WHERE deleted_at IS NULL
GROUP BY user_id, date_trunc('month', date)::DATE;
