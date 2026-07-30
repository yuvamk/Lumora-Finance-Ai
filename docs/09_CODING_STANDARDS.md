# Lumora AI — Coding Standards

This document establishes the patterns, code styles, and architecture rules to keep the codebase clean, readable, and maintainable.

---

## 1. Strictly-Typed TypeScript
* **No `any` rule:** The use of `any` is strictly prohibited. If a type is unknown or dynamic, use `unknown` or configure generic variables.
* **Implicit typing:** Rely on TypeScript inference for trivial variable declarations, but explicitly define return types for Server Actions, API routes, and custom hooks.
* **Database mappings:** Use Supabase generated types directly. Re-export and extend them under `src/types/database.types.ts`.

---

## 2. Server Components vs. Client Components

### Server Components (RSCs)
* **Default choice:** Mark files as Server Components unless interactivity is required.
* **Data Fetching:** Direct database calls or SDK executions. Avoid routing internal traffic through REST APIs inside the same application.

### Client Components
* **Declaration:** Prefix with `"use client"` at the top of the file.
* **When to use:** User interactions (forms, drawers, buttons), state hooks (`useState`, `useEffect`), animations (framer-motion), and custom client event listeners.

---

## 3. Server Actions & Mutations
All write mutations are handled via Server Actions:
* **Validation:** Every action must parse inputs using a Zod schema before modifying data.
* **Execution Boundary:** Standardize return response structures to handle error bubbles gracefully:
  ```ts
  export type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string; details?: Record<string, string[]> };
  ```

---

## 4. Feature-Based Architecture
Co-locate files related to the same feature inside `src/features/[feature_name]/`:
```
src/features/transactions/
├── components/          # Transaction-specific sub-components (TransactionCard, ReceiptModal)
├── actions.ts           # Server Actions for transaction mutations
├── queries.ts           # DB query helpers for transaction reads
├── hooks.ts             # Custom feature hooks
├── schemas.ts           # Zod schema definitions
└── types.ts             # Domain-specific TypeScript declarations
```

---

## 5. UI Elements: Skeletons & Accessibility
* **Loading States:** Every dynamic section must define a fallback component using `Suspense` and styled Tailwind skeletons matching the shape of the resolved UI.
* **Empty States:** When lists are empty, display descriptive placeholders with action buttons instead of blank space.
* **A11y (Accessibility):** Ensure form fields have associated labels, ARIA tags are set for components, and color contrast ratios meet WCAG AA standards.
* **Keyboard Navigation:** Interactivity (modals, dropdown lists) must support complete keyboard selection (escape key, tab index, enter button).
