# Lumora AI — Testing & QA Strategy

This document details the testing tools, test suite organization, and manual verification scripts.

---

## 1. Test Automation Hierarchy

Lumora AI maintains a rigorous testing hierarchy.

```
┌────────────────────────────────────────┐
│         End-to-End (Playwright)        │  ◄── Critical User Flows (Login, Logging)
├────────────────────────────────────────┤
│        Integration (Vitest + RTL)      │  ◄── Features & State Transitions
├────────────────────────────────────────┤
│          Unit (Vitest / pgTAP)         │  ◄── Math Utilities & RLS Policies
└────────────────────────────────────────┘
```

---

## 2. Unit Testing (Vitest & React Testing Library)
Used to test helper logic, date transformations, currency calculations, and reusable component presentation.
* **Location:** Co-located with files: `src/features/transactions/__tests__/calculators.test.ts`.
* **Execution Command:**
  ```bash
  npm run test:unit
  ```

---

## 3. Row-Level Security (RLS) Database Verification
To guarantee that user data is isolated, RLS policy tests are run using the **pgTAP** extension or through test suites simulating queries with different database users.

```sql
-- Example RLS verification test case
BEGIN;
SELECT plan(3);

-- Set user context
SET local role authenticated;
SET local request.jwt.claim.sub = 'user-uuid-1234';

-- Verify SELECT
SELECT results_eq(
    'SELECT count(*)::integer FROM public.transactions',
    ARRAY[5],
    'User should only see their own 5 transactions'
);

SELECT finish();
ROLLBACK;
```

---

## 4. End-to-End (E2E) UI Testing (Playwright)
Validates core critical user paths inside the Chromium/Safari webkit layout:
1. **User Authentication Flow:** Sign up -> verify email simulation -> sign in -> redirect.
2. **Transaction Life Cycle:** Add manual expense -> check budget alert -> verify savings rate changes -> delete expense.
3. **PWA Offline Mode:** Disconnect network -> verify client loads cached lists from IndexedDB/localStorage -> log offline transaction.

---

## 5. Continuous Integration (CI) Checks
A branch cannot be merged to `main` until the following pass:
1. TypeScript compilations (`npm run build`).
2. ESLint checks (`npm run lint`).
3. Unit and integration tests (`npm run test`).
