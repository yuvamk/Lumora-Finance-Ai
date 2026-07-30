# Architecture Decision Records (ADR)

This document tracks major design, architecture, and technology decisions.

---

## ADR 1: Feature-Based Code Organization
* **Status:** Approved
* **Context:** Traditional Next.js layouts group components, hooks, and pages into global folders. As the app scales, files related to a single domain (e.g. Transactions) become spread out, increasing context-switching costs.
* **Decision:** We use a feature-based modular structure where components, hooks, actions, schemas, and types related to a single business capability are stored inside `src/features/[feature-name]/`.
* **Consequences:** Easier maintenance, clean code boundaries, and simplified deletion or modification of specific features.

---

## ADR 2: RSC Direct Database Querying
* **Status:** Approved
* **Context:** Exposing internal REST endpoints for internal Next.js components increases latency (double hop) and network overhead.
* **Decision:** We query the Supabase PostgreSQL database directly within Next.js 15 Server Components, leveraging React's cache and Next.js' data cache capabilities.
* **Consequences:** Instantaneous queries, simpler backend routes, and reduced API maintenance.

---

## ADR 3: Mathematical Operations Confined to PostgreSQL
* **Status:** Approved
* **Context:** Language Models (such as Claude Sonnet) frequently hallucinate or fail at precise mathematical operations, especially when reading thousands of raw transaction lines.
* **Decision:** The LLM is strictly banned from summing or calculating financial numbers. PostgreSQL runs aggregation functions, formatting the data as a structured JSON payload before passing it to the AI.
* **Consequences:** 100% calculation accuracy, smaller prompt payloads, lower token costs, and faster response times.

---

## ADR 4: Write Mutations via Server Actions
* **Status:** Approved
* **Context:** Exposing REST endpoints for state mutations (creating transactions, editing profiles) requires configuring custom routes and authentication guards on each endpoint.
* **Decision:** We implement all write mutations using Next.js 15 Server Actions, utilizing server-side Zod validation.
* **Consequences:** Improved developer productivity, automatic type-safety between form submissions and server handling, and built-in CSRF protection.

---

## ADR 5: Desktop Directory Placement
* **Status:** Approved
* **Context:** The user explicitly requested to initialize the folder directly on the Desktop (`c:/Users/pc/Desktop/lumora-ai`) instead of inside the pre-existing `chukde_chatbot` workspace.
* **Decision:** We bypass the standard rule that locks workspace files to the workspace subdirectory, creating all Lumora AI files on the Desktop directly.
* **Consequences:** Matches user preference and directory layout expectations.

---

## ADR 6: Domain-Driven Core Financial Engine Architecture
* **Status:** Approved
* **Context:** Scattered financial calculations across React components, page views, and API layers create duplication, make testing difficult, and increase the risk of business logic bugs.
* **Decision:** We introduce a modular Core Financial Engine separating domain capabilities (calculators, analytics, context building, alerts) into decoupled, testable, pure calculator subfolders under `src/features/`.
* **Reason:** Pure domain calculators are isolated from DB, Supabase, and React frameworks, making them fully testable, predictable, and reusable.
* **Trade-offs:** Increases early file-creation overhead, but prevents code duplication and establishes strict return contracts.
* **Future Impact:** Later modules (Dashboard, AI co-pilot chat, OCR parser, forecasting reports) can query these engines instead of rebuilding calculation logic, safeguarding scalability.

---

## ADR 7: Extensible Ledger & Independent Widget Dashboard Architecture
* **Status:** Approved
* **Context:** Building standard CRUD tables results in high coupled dependencies and sluggish loading speeds when the database scale increases.
* **Decision:** We establish a timeline-based ledger journal using cursor-paginated list groupings, Cupertino swipe controls, and reactive bottom sheets. Additionally, we slice the dashboard page layout into independent widget segments lazy-loaded via React Suspense boundaries.
* **Reason:** Keeps widgets fully separated, speeds up page visual indicators through progressive rendering, and isolates mutations via server-actions linked to next/cache revalidation paths.
* **Consequences:** Maximizes mobile responsiveness, enables customizable widget layouts, and simplifies bank-sync and AI metadata updates.

---

## ADR 8: Explainable Knowledge Engine & Calculator Contract Architecture
* **Status:** Approved
* **Context:** Relying on Claude to run raw transaction calculations or parse scattered metrics creates high latency, prompts version mismatches, and introduces non-deterministic outputs.
* **Decision:** We deploy a standardized `FinancialCalculator` contract forcing a common calculate() interface, inject explainability metrics (confidence, priority levels), and build a centralized **Knowledge Engine** that aggregates all observations into a single versioned `FinancialKnowledgeObject`.
* **Reason:** Ensures business logic execution is deterministic, simplifies LLM interactions to a translation-only layer, and provides debugging history trails.
* **Consequences:** Lowers token consumption costs, secures strict reproducibility, and prepares the platform for future bank integrations.



