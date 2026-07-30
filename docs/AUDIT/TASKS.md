# Lumora AI Task List

This file tracks progress across major design and engineering phases.

---

## 🟩 Milestone 1: Blueprint & Architecture
* [x] Create project structure and design folders
* [x] Design core system blueprint (`00_PROJECT_BLUEPRINT.md`)
* [x] Design server topology and data flow maps (`01_ARCHITECTURE.md`)
* [x] Design normalized database schema and RLS rules (`02_DATABASE.md`)
* [x] Design API spec and Server Action models (`03_API_SPEC.md`)
* [x] Design prompt pipelines and mathematical isolation layers (`04_AI_SYSTEM.md`)
* [x] Design Tailwind v4 design tokens and layouts (`05_UI_DESIGN_SYSTEM.md`)
* [x] Design threat model and security measures (`06_SECURITY.md`)
* [x] Design Vercel + Supabase deployment specs (`07_DEPLOYMENT.md`)
* [x] Design Vitest, pgTAP, and Playwright scopes (`08_TESTING.md`)
* [x] Design coding standards and lint directives (`09_CODING_STANDARDS.md`)
* [x] Set up audit systems (Changelog, Tasks, Decisions, Completed logs)
* [x] Establish SaaS registries (Memory, Features, Components, APIs, DB Changelog)
* [x] Formulate production-grade long-term engineering workflow


---

## 🟩 Milestone 2: Workspace & Environment Setup
* [x] Initialize Next.js 15 app inside `lumora-ai/`
* [x] Configure Tailwind CSS v4 and theme variables
* [x] Initialize and map Shadcn/ui system components
* [x] Connect local repository and Supabase DB instances

---

## 🟩 Milestone 3: Database & Auth Setup
* [x] Apply database migrations for profiles and core lookup tables
* [x] Set up Supabase RLS policies and validation triggers
* [x] Configure Supabase Authentication client & route middleware
* [x] Set up environment variable validation checks
* [x] Add repository layer data access patterns



---

## 🟩 Milestone 3.5: Core Financial Engine
* [x] Design and apply analytical PostgreSQL Views for dashboard summary
* [x] Formulate configurations for feature-flags, contracts, and events
* [x] Write pure domain calculators (income, expense, cashflow, budgets, goals, score)
* [x] Build Analytics Engine categories allocation weights
* [x] Build AI Context prompt context builders
* [x] Build Notification evaluation rules
* [x] Build Search Engine query parameters
* [x] Create ADR 6 documenting Domain-Driven Financial Engine architecture


---

## 🟩 Milestone 4: Ledger & Dashboard Development
* [x] Build transaction schema validators and layout drawer
* [x] Develop main overview charts (cash flow, balances, limits)
* [x] Establish budgeting models and warning banners

---

## 🟩 Milestone 4.5: Financial Intelligence & Knowledge Engine
* [x] Standardize calculators with generic FinancialCalculator interface
* [x] Build explainable calculators for largest transactions, weekend ratios, rules advisor, and forecasts
* [x] Build central KnowledgeEngine to aggregate summaries, insights, advice, and predictions
* [x] Upgrade AIContextBuilder to feed off the structured FinancialKnowledgeObject
* [x] Create ADR 7 (Ledger timeline) and ADR 8 (Explainable Knowledge Engine design)



---

## 🟨 Milestone 5: Conversational AI & Advanced Operations
* [ ] Integrate Claude API client routing
* [ ] Implement SQL context builder logic
* [ ] Design mobile AI interface overlay and swipe gestures
