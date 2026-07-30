# Database Changelog

This changelog records SQL schema migrations, database constraints, and index updates.

---

## Migration Log Index

| Migration Number | Description | Tables Impacted | Status | Applied Date |
|---|---|---|---|---|
| `20260730000000_initial_schema` | Initial Schema creation with ENUMs, triggers, and indices | Profiles, categories, subcategories, transactions, budgets, goals, activity logs | Active | 2026-07-30 |
| `20260730000001_financial_views` | Database analytical SQL views | Profiles, categories, subcategories, transactions, budgets, goals | Active | 2026-07-30 |
| `20260730000002_budgets_extensions` | Extension columns for budgets and updated progress calculation | Budgets, vw_budget_progress | Active | 2026-07-30 |
| `20260730000003_goals_extensions` | Extension columns for goals and updated progress calculation | Goals, vw_goal_progress | Active | 2026-07-30 |
| `20260730000004_onboarding` | Added onboarding tracking columns to profiles | Profiles | Active | 2026-07-30 |

---

## Details: Migration 20260730000001_financial_views
* **Migration ID:** `20260730000001_financial_views`
* **Reason:** Isolate financial aggregations and calculations inside PostgreSQL to speed up dashboard page loads and avoid code duplication in Node.js.
* **Views Created:**
  - `vw_dashboard_summary`: Rollup user balance, income, expenses, and active subscription totals.
  - `vw_cashflow`: Monthly aggregates of income vs expense cash flow.
  - `vw_budget_progress`: Computes remaining limits and utilization percentages based on category.
  - `vw_goal_progress`: Calculates overall target completion percentages for savings goals.
  - `vw_category_breakdown`: Sums expenditures by category for active billing cycles.
  - `vw_monthly_statistics`: Tracks frequency and average transaction sizes.
* **Rollback Strategy:** Run:
  ```sql
  DROP VIEW IF EXISTS public.vw_monthly_statistics;
  DROP VIEW IF EXISTS public.vw_category_breakdown;
  DROP VIEW IF EXISTS public.vw_goal_progress;
  DROP VIEW IF EXISTS public.vw_budget_progress;
  DROP VIEW IF EXISTS public.vw_cashflow;
  DROP VIEW IF EXISTS public.vw_dashboard_summary;
  ```

---

## Details: Migration 20260730000002_budgets_extensions
* **Migration ID:** `20260730000002_budgets_extensions`
* **Reason:** Added configuration metadata columns (name, carry_forward, auto_reset, color, icon, notes, warning_threshold) and updated `vw_budget_progress` to fetch these fields.
* **Rollback Strategy:** Run:
  ```sql
  DROP VIEW IF EXISTS public.vw_budget_progress;
  -- Remove columns if needed, or restore original view definition
  ```

---

## Details: Migration 20260730000003_goals_extensions
* **Migration ID:** `20260730000003_goals_extensions`
* **Reason:** Added metadata columns (icon, color, priority, notes) to goals table and updated `vw_goal_progress` view.
* **Rollback Strategy:** Run:
  ```sql
  DROP VIEW IF EXISTS public.vw_goal_progress;
  -- Restore original view definition
  ```

---

## Details: Migration 20260730000004_onboarding
* **Migration ID:** `20260730000004_onboarding`
* **Reason:** Added columns to profiles table to track wizard step completion state.
* **Rollback Strategy:** Run:
  ```sql
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS onboarding_completed;
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS onboarding_step;
  DROP INDEX IF EXISTS idx_profiles_onboarding;
  ```
