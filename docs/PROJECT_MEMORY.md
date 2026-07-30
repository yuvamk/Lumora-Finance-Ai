# Project Memory

## 1. Current Project Status & Sprint
* **Status:** MVP Feature Integration, Intelligence UI, Global Search, and Onboarding Wizard Completed & Verified.
* **Current Sprint:** Sprint 5 — Product Integration & Production Readiness Audit
* **Latest Action:** Standardized navigation shell dynamically gated on user authentication status, fixed TypeScript errors, linked the landing page CTAs, and completed integration for reports, search, AI insights, and onboarding wizard.

---

## 2. Current Architecture & Folder Structure
We adhere to a decoupled, Server-First Next.js 15 and Supabase structure. Code is organized in a **Feature-Based Architecture**.

```
lumora-ai/
├── docs/                     # Design specs, ADRs, registries, and logs
│   ├── AUDIT/                # Tasks, completed logs, changelogs, decisions
│   └── (registries)          # Feature, Component, API, Database logs
└── src/
    ├── app/                  # Routing structure
    ├── components/           # Shared generic UI
    ├── features/             # Business boundaries:
    │   ├── auth/             # Custom auth repository & actions
    │   ├── finance-engine/   # Pure calculators (income, expense, budgets, score) and repository
    │   ├── analytics-engine/ # Distribution compiles
    │   ├── insight-engine/   # Deterministic observations and largest-tx calculator
    │   ├── behavior-engine/  # Weekend ratio and habits calculators
    │   ├── recommendation-engine/ # Rules advisor and spending recommendations
    │   ├── prediction-engine/ # Velocity forecaster linear predictions
    │   ├── knowledge-engine/ # Aggregator compiling the Knowledge Object
    │   ├── context-engine/   # Claude prompt context composers (consumes knowledge object)
    │   ├── notifications/    # Notifications repository and alert management
    │   ├── reports/          # Data interface for PostgreSQL views & chart components
    │   └── search/           # Global search routing & components
    ├── lib/                  # Shared libraries (Supabase client/server helper)
    └── types/                # Reusable typings:
        ├── config/           # Feature flags and dashboard widget registries
        └── financial/        # Shared financial contracts (Knowledge Object, calculators) and events
```

---

## 3. Database Status
* **Database Version:** PostgreSQL (Supabase)
* **Latest Migration:** `20260730000004_onboarding.sql` (added tracking columns to profiles)

---

## 4. Active Environment Variables
The following variables are active and validated:
* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (Client + Server access)
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client-safe authorization token
* `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
* `CLAUDE_API_KEY`: Anthropic Claude API token
* `NEXT_PUBLIC_APP_URL`: App domain URL (Defaults to localhost:3000)

---

## 5. Modules Registry

### Completed Modules
* **M1: Core Design Specs:** Setup foundation documents.
* **M2: Workspace Setup:** Configured next-themes, tailwind, button shims.
* **M3: Interactive Simulator Home:** Screen layout mocks.
* **M4: Database Schema & Authentication Setup:** Custom triggers, route guards, environments validator.
* **M4.5: Core Financial Engine & Intelligence Layer:**
  - Standardized the generic `FinancialCalculator` contract.
  - Implemented the `InsightEngine`, `BehaviorEngine`, `RecommendationEngine`, and `PredictionEngine` with explainability metadata (confidence scores, algorithms, priority levels).
  - Built the centralized `KnowledgeEngine` compiling a unified `FinancialKnowledgeObject` payload.
  - Upgraded the `AIContextBuilder` to feed off the organized knowledge metadata.
* **M5: Product Completion & Integration:**
  - Dynamic AppLayout client wrapper to hide nav components from landing page (/) and auth/onboarding pages.
  - Onboarding wizard (5-step progress, currency setup, goals/budgets inputs).
  - Reports analytics dashboard (Recharts CashFlow, CategoryPie, and IncomeExpense bar charts).
  - CSV transactional export support via API routes.
  - Global debounced search API matching transactions, budgets, and goals.
  - Full AI Insights page showcasing the compiled FKO.

---

## 6. Technical Debt & Constraints
* **Constraint:** **Rule of Math:** AI must never sum values directly. Calculations must reside on PostgreSQL views and internal engines.
