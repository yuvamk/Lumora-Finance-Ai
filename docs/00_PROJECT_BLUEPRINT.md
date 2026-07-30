# Lumora AI — Project Blueprint

## 1. Product Identity & Vision
**Project Name:** Lumora AI  
**Tagline:** *"Understand every dollar. Predict every tomorrow."*  
**Mission:** Build the world's most intelligent AI-powered personal finance companion. Lumora AI goes beyond simple backward-looking ledger tracking by combining real-time cash flow analysis, proactive behavioral budgeting, predictive forecast analytics, and a conversational AI co-pilot. It acts as an autonomous financial operating system helping users achieve long-term wealth, optimize spending, and manage subscriptions seamlessly.

---

## 2. Target Audience & Core Personas
* **The Smart Saver:** Needs automated categories, budget warnings, and optimized subscription tracking to maximize savings.
* **The Forward Thinker:** Looks for cash flow predictions, predictive month-end balance forecasts, and decision assistance ("Can I afford a new laptop?").
* **The Busy Professional:** Wants OCR receipt scanning, quick transaction logging, automated subscription management, and summary updates without manual sorting.

---

## 3. Core Feature Specifications

### A. Core Ledger & Transaction Management
* **Types:** Expense, Income, Transfer.
* **Metadata:** Merchant, Category, Subcategory, Date, Time, Currency, Payment Method, Location, Notes, Tags, Attachments, Mood (behavioral tracking), and Receipts.
* **Modes:** Manual quick add, recurring transactions, installments, refunds.

### B. Intelligent Dashboard
* Real-time metrics: Current Balance, Cash Flow (Income vs Expense), Savings Rate.
* Financial Health Score (dynamic grading based on budget compliance and saving trends).
* AI summaries, upcoming bills tracking, and predicted month-end expense.

### C. Cash Flow & Analytics Engine
* Timeline trends (Daily, Weekly, Monthly, Yearly).
* Interactive distributions (Category breakdown, Merchant breakdown, Weekday vs Weekend spending habits).
* Predictive lines (Moving averages, Growth rates, Category comparisons).

### D. AI Co-Pilot (Claude-powered)
* Structured JSON communication with database summaries to minimize token costs.
* Natural language querying ("Where is my money going?", "Can I afford to go to Paris next month?").
* Automated insights (anomaly detection, overspending warnings, subscription duplicates).

### E. Budgets & Goals
* Dual systems: Budgets (enforces Category-specific or global limit boundaries) and Goals (savings targets with AI-estimated success probability and monthly requirements).
* Predictive alarms when spending velocity indicates a budget will be exceeded before month-end.

### F. Subscription Tracker
* Automatic detection of recurring charges.
* Upcoming renewals schedule, duplicate alerts, and cost projections.

### G. Receipt OCR
* Extracting merchant, tax, discount, total, payment method, date, and individual line items from images/PDFs.
* Automatic translation of OCR items into categorized transactions.

---

## 4. Product Constraints
* **Mobile-First Design:** Fully optimized viewport and gesture interactions for iPhone/mobile browsers.
* **Offline-Friendly:** Core logging and cache reads work seamlessly offline.
* **Accuracy:** Calculations must be computed natively in the PostgreSQL database before ingestion by the AI.
