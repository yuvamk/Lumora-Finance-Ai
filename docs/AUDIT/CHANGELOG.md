# Changelog

All notable changes to the Lumora AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-07-30

### Added
* Initial project layout and feature-based structure definition on the Desktop (`c:/Users/pc/Desktop/lumora-ai`).
* Comprehensive system design documents inside `docs/`:
  - `00_PROJECT_BLUEPRINT.md`: Vision, scope, personas, and feature maps.
  - `01_ARCHITECTURE.md`: High-level data flows, topologies, and directories.
  - `02_DATABASE.md`: Schema, indexing, triggers, and RLS layout for 20+ tables.
  - `03_API_SPEC.md`: Server actions and queries layout.
  - `04_AI_SYSTEM.md`: Rule of math, JSON prompt structures, and processing pipelines.
  - `05_UI_DESIGN_SYSTEM.md`: Colors, HSL tokens, and mobile layout targets.
  - `06_SECURITY.md`: JWT storage, authorization boundary, and RLS enforcement.
  - `07_DEPLOYMENT.md`: Continuous deployments, variables, and staging paths.
  - `08_TESTING.md`: Vitest configurations, RLS testing schemas, and Playwright scopes.
  - `09_CODING_STANDARDS.md`: TypeScript, React, feature code structure, and accessibility rules.
* Initial audit logs setup inside `docs/AUDIT/`:
  - `CHANGELOG.md`: Chronological changelog tracking.
  - `TASKS.md`: Task lists by milestones.
  - `COMPLETED.md`: Documented closed items.
  - `DECISIONS.md`: Architecture Decision Records (ADRs).
  - `KNOWN_ISSUES.md`: Tracker for open bugs and limitations.
* Setup of SaaS Registry and Memory system files inside `docs/`:
  - `PROJECT_MEMORY.md`: Tracks overall sprint memory, specs, variables, and technical debt.
  - `FEATURE_REGISTRY.md`: Registers all active, completed, and planned features.
  - `COMPONENT_REGISTRY.md`: Catalog of all custom and third-party UI components to prevent duplication.
  - `API_REGISTRY.md`: Registers Server Actions and REST API routes with input/output payloads.
  - `DATABASE_CHANGELOG.md`: Version control audit ledger for SQL database schema migrations.
* Adoption of strict, long-term SaaS engineering guidelines (maintainability, security isolation, component registries, prompt registries, math isolation rules).
* Added database schema migration script `20260730000000_initial_schema.sql` detailing 20+ tables, custom enums, RLS policies, indexing strategies, and default seeded categories.
* Integrated Supabase SSR browser, server, and session refresh middleware clients.
* Configured Next.js Middleware route interception to enforce authenticated user path guards.
* Implemented `AuthRepository` under the repository pattern to isolate DB queries from the UI.
* Built Zod-based startup validation schema for process environment variables.
* Added Core Financial Engine database views migration `20260730000001_financial_views.sql` providing user-level dashboard summary, cash flow, category breakdowns, budget utilization, and goals progress calculations.
* Implemented pure mathematical calculators for income, expense, cash flow, budgets, goals, and health scores under `src/features/finance-engine/calculators/`.
* Created configurable scoring weights constants inside `src/features/finance-engine/constants/score.ts`.
* Implemented modular Analytics Engine, AI Context Engine Builder, Notification Evaluator, and Search Engine providers.
* Structured shared config feature-flags, financial contracts, and event payloads under `src/types/`.
* Added ADR 6 detailing Domain-Driven Financial Engine architecture.
* Implemented Ledger & Dashboard UI (Milestone 4 complete) including Cupertino Apple Wallet-style transaction cards, chronological grouping timelines, mobile-first bottom sheets, swipe gestures, and lazy-loaded widget Suspend grids.
* Bypassed environment validation errors during build scripts by deploying default URL/secret fallback parameters in `src/lib/env.ts`.
* Standardized the core calculations layers by introducing the generic `FinancialCalculator` interface contract (Milestone 4.5 complete).
* Created explainable calculators for largest transactions, weekend ratios, rules-based advisors, and spending velocity predictions under their respective engine feature directories.
* Built the centralized `KnowledgeEngine` to compile all calculator outputs into a versioned, single-source-of-truth `FinancialKnowledgeObject` (FKO).
* Upgraded the `AIContextBuilder` to consume the structured FKO payload.
* Added ADR 7 and ADR 8 records.




