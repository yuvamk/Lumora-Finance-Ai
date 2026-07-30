# Lumora AI — Intelligent Personal Finance Operating System

Lumora AI is a next-generation Personal Finance Operating System designed to make expense tracking frictionless and financial intelligence automatic. Built with Next.js, TypeScript, and Supabase, it features real-time calculations, natural language capture, an AI assistant, budgets, goals, and comprehensive cashflow reports.

---

## 🚀 Key Features

*   **⚡ Frictionless Transaction Capture**: Google Keep-style floating Action Button (FAB) accessible throughout the authenticated app to log transactions in under 5 seconds.
*   **🗣️ Natural Language Processing (NLP)**: Type naturally (e.g., *"Spent ₹20 on a coffee at Starbucks"*) to log expenses instantly.
*   **🔮 AI Assistant Workspace**: A central tabbed AI hub containing Chat, Insights, Predictions, Savings Recommendations, NLP Loggers, and query history logs.
*   **📸 OCR Receipt Scanner**: Scan receipt images to automatically extract merchant name, line items, taxes, totals, and suggest categories.
*   **🇮🇳 Indian Rupee (INR / ₹) Native**: Full support for Indian Rupee locales (`en-IN`), formatting numbers correctly in Lakhs and Crores.
*   **🔄 Live Client-Side Sync**: Shared client event bus updates lists reactively in the UI with zero page refreshes.
*   **📊 Daily Spending Timelines**: Grouped chronological ledgers with dynamically calculated daily spend and income totals.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 16.2 (using Turbopack)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Database & Auth**: Supabase (PostgreSQL)
*   **AI Integration**: Google Gemini & Claude Vision APIs
*   **Animations**: Framer Motion

---

## 🗄️ Database Architecture & Views

Lumora relies on real-time PostgreSQL database views to compile financial statistics instantly:

*   `vw_dashboard_summary`: Computes current balances, monthly income, monthly expenses, and active subscription totals per user.
*   `vw_cashflow`: Groups income, expenses, and net balances by month over time.
*   `vw_budget_progress`: Tracks limit amount, spent amount, remaining budget, and utilization percentages per category.
*   `vw_goal_progress`: Tracks total savings progress and suggested monthly savings rates to reach financial goals.
*   `vw_category_breakdown`: Aggregates expenses by category and calculates percentages of total spend.

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Environment Variables
Create a `.env.local` file in the root directory and configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```
