# Lumora AI — API Specification

This document details the Next.js Server Actions, APIs, and real-time database interfaces.

---

## 1. Next.js 15 Server Actions (Database Writes)

Next.js Server Actions are used exclusively for write mutations (create, update, delete) to enforce server-side validation and security checks.

### Auth Actions (`src/features/auth/actions.ts`)

#### `signUpUser(data: SignUpSchema)`
* **Input Validation:** Zod validator checking email, secure password format.
* **Database Call:** Passes values to `supabase.auth.signUp()`.
* **Returns:** Success status, verification email redirection target, or error message.

#### `signInUser(data: SignInSchema)`
* **Database Call:** Calls `supabase.auth.signInWithPassword()`.
* **Returns:** User profiles payload or validation errors.

---

### Transaction Actions (`src/features/transactions/actions.ts`)

#### `createTransaction(data: CreateTransactionSchema)`
* **Input Validation:** Zod schema validator verifying positive non-zero amount, date, and category UUID.
* **Server-side check:** Restricts `user_id` to current active `auth.uid()`.
* **Returns:** Created transaction row, or throws Error.

#### `updateTransaction(id: string, data: UpdateTransactionSchema)`
* **Access check:** Ensures targeted transaction belongs to the calling user.
* **Returns:** Updated database record.

#### `deleteTransaction(id: string, softDelete?: boolean)`
* **Behavior:** Moves transaction to soft-deleted state (`deleted_at = now()`) or hard deletes depending on scope.

---

### Budgets & Goals Actions (`src/features/budgets/actions.ts` & `src/features/goals/actions.ts`)

#### `createBudget(data: CreateBudgetSchema)`
* **Checks:** Prevents duplicate budget rules for the same category per period.

#### `addGoalProgress(goalId: string, amount: number, notes?: string)`
* **Triggers:** Recalculates goal achievement percentages and success probabilities.

---

## 2. Server Components (Database Reads)

Read-only activities do not route through intermediate endpoints; they fetch directly from PostgreSQL using Next.js Server Components.

### Dashboard Core Queries (`src/features/dashboard/queries.ts`)

#### `getMonthlySummary(userId: string, year: number, month: number)`
* **Execution:** Direct SQL select summing total expenses, income, cash flow, and savings rate.
```ts
const { data, error } = await supabase
  .from('transactions')
  .select('amount, type')
  .eq('user_id', userId)
  .eq('deleted_at', null)
  .gte('date', startOfMonth)
  .lte('date', endOfMonth);
```

---

## 3. Subscription & OCR REST Services (`src/app/api/`)

To support background hooks or external files:

### `POST /api/ocr/parse`
* **Content-Type:** `multipart/form-data` containing image/PDF.
* **Flow:** Uploads file to Supabase Storage bucket -> triggers Claude Vision OCR -> parses fields (merchant, items, tax, total) -> returns JSON schema -> creates transaction.

### `POST /api/subscriptions/detect`
* **Trigger:** Triggers scan on transaction history for patterns of repeated billing amounts/intervals.
