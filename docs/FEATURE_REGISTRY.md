# Feature Registry

This registry tracks the life cycle, owners, dependencies, and impact details of every application feature.

---

## 1. Active & Completed Features

### Feature: Interactive Demo Showcase
* **Feature Name:** Interactive Demo Showcase
* **Status:** Complete (v0.1.0 Alpha Preview)
* **Last Updated:** 2026-07-30

### Feature: Supabase User Authentication & Profiles
* **Feature Name:** Supabase User Authentication & Profiles
* **Status:** Complete (Fully Integrated UI for login, signup, forgot password, reset password, callback routes)
* **Last Updated:** 2026-07-30

### Feature: Core Financial & Analytics Engine
* **Feature Name:** Core Financial & Analytics Engine
* **Status:** Complete (Underlying database views, ledger timeline, and category trackers)
* **Last Updated:** 2026-07-30

### Feature: Financial Intelligence Layer & Knowledge Engine
* **Feature Name:** Financial Intelligence Layer & Knowledge Engine
* **Status:** Complete (Centralized aggregator compiling FKO payload)
* **Owner:** Principal Software Engineer & AI Architect
* **Dependencies:** Core Financial & Analytics Engine
* **Database Impact:** Employs underlying SQL views to extract transaction records.
* **API Impact:** Exposes standard calculators and compiles a unified `FinancialKnowledgeObject` for dashboard and prompt contexts.
* **UI Impact:** Powers AI Insights, alert grids, trend charts, and AI chat queries.
* **Last Updated:** 2026-07-30

### Feature: Reports & Analytics Dashboard
* **Feature Name:** Reports & Analytics Dashboard
* **Status:** Complete (Recharts visual cash flow, category breakdowns, budget utilization, goals velocity, and CSV transaction exporter API)
* **Owner:** Senior frontend developer
* **Dependencies:** Core Financial & Analytics Engine, ReportsRepository
* **UI Impact:** Visual indicators on budgets, goals progress, and month-on-month cash flow trends.
* **Last Updated:** 2026-07-30

### Feature: Global Search Engine
* **Feature Name:** Global Search Engine
* **Status:** Complete (Unified debounced search over transactions, budgets, goals, and recurring subscriptions)
* **Owner:** Fullstack Engineer
* **API Impact:** Route `GET /api/search` using SearchEngine provider.
* **UI Impact:** Global search bar inside top header with history cache.
* **Last Updated:** 2026-07-30

### Feature: User Onboarding Wizard
* **Feature Name:** User Onboarding Wizard
* **Status:** Complete (5-step progressive wizard with flag-based currency selector, goal setups, and profile configuration)
* **Owner:** Frontend developer
* **Last Updated:** 2026-07-30

---

## 2. Planned Features Pipeline

### Feature: Conversational AI Co-Pilot
* **Feature Name:** Conversational AI Co-Pilot
* **Status:** Complete (Swipeable chat drawer layout and FAB trigger on dashboard; queries API route `/api/chat`)
* **Owner:** AI Engineer & Backend Architect
* **Dependencies:** Financial Intelligence Layer & Knowledge Engine
* **Last Updated:** 2026-07-30
