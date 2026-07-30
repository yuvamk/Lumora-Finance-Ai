# Component Registry

This registry tracks all custom reusable components to avoid duplicate implementations.

---

## 1. Application Providers & Shells

### Component: Providers
* **Name:** Providers
* **Purpose:** Wraps children in global configuration contexts for styling themes, server-state query caching, and toast notifications.
* **Location:** `src/components/providers.tsx`
* **Props:**
  ```ts
  interface ProvidersProps {
    children: React.ReactNode;
  }
  ```
* **Dependencies:** `next-themes`, `@tanstack/react-query`, `sonner`
* **Used By:** [layout.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/app/layout.tsx)

### Component: AppLayout
* **Name:** AppLayout
* **Purpose:** Dynamically hides navigation, headers, and floating widgets from landing page, auth views, and onboarding wizard.
* **Location:** `src/components/nav/app-layout.tsx`
* **Props:**
  ```ts
  interface AppLayoutProps {
    children: React.ReactNode;
    topHeader: React.ReactNode;
  }
  ```
* **Dependencies:** `next/navigation`
* **Used By:** [layout.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/app/layout.tsx)

### Component: TopHeader
* **Name:** TopHeader
* **Purpose:** Server Component rendering time-of-day greetings, unread notification count badges, global search links, and profile shortcuts.
* **Location:** `src/components/nav/top-header.tsx`
* **Dependencies:** `supabase`, `NotificationsRepository`
* **Used By:** [layout.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/app/layout.tsx)

### Component: BottomNav
* **Name:** BottomNav
* **Purpose:** Navigation bottom sheet mapping Dashboard, Ledger, AI Insights, Reports, and Settings pages.
* **Location:** `src/components/nav/bottom-nav.tsx`
* **Used By:** [app-layout.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/components/nav/app-layout.tsx)

---

## 2. Reusable Chart Components

### Component: CashFlowChart
* **Name:** CashFlowChart
* **Purpose:** Displays monthly income vs expense area trends over a 12-month period with gradient overlays.
* **Location:** `src/features/reports/components/charts.tsx`
* **Used By:** [reports/page.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/app/reports/page.tsx)

### Component: CategoryPieChart
* **Name:** CategoryPieChart
* **Purpose:** Renders expense distribution percentages across top 8 budget categories.
* **Location:** `src/features/reports/components/charts.tsx`
* **Used By:** [reports/page.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/app/reports/page.tsx)

### Component: IncomeExpenseBarChart
* **Name:** IncomeExpenseBarChart
* **Purpose:** Grouped bar chart comparing income and spending volumes.
* **Location:** `src/features/reports/components/charts.tsx`
* **Used By:** [reports/page.tsx](file:///c:/Users/pc/Desktop/lumora-ai/src/app/reports/page.tsx)

---

## 3. Shadcn Primitives Registry
The following registry entries are installed directly from the Shadcn registry and customized in `src/components/ui/`:

### Component: Button
* **Location:** `src/components/ui/button.tsx`
* **Purpose:** Standard interactive target for links and triggers.
* **Used By:** LandingPage, settings forms, onboarding wizard.

### Component: Card
* **Location:** `src/components/ui/card.tsx`
* **Purpose:** Visual content containers.
* **Used By:** LandingPage, reports analytics.

### Component: Badge
* **Location:** `src/components/ui/badge.tsx`
* **Purpose:** Label indicators for statuses and tags.
* **Used By:** LandingPage, reports analytics.
