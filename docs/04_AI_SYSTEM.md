# Lumora AI — Intelligent AI System

This document outlines the architecture, pipeline, prompt templates, and security guidelines for the Lumora AI financial co-pilot.

---

## 1. Ground Rules for the AI Engine

> [!IMPORTANT]
> **Rule of Math:** The LLM (Claude Sonnet 4) must **NEVER** calculate totals, additions, subtractions, averages, or percentages. 
> Doing so is prone to hallucinations and is slow and expensive. All math is computed natively in PostgreSQL using aggregates, then fed to the LLM as structured JSON.

---

## 2. Information Pipeline

```
[ User Query ]
      │
      ▼
[ Next.js Server / Parser ] ───► Executes Structured SQL Queries in PostgreSQL
                                      │
                                      ▼
[ Structured JSON Outputs ] ◄─────────┘ (Sums, Categories, Budgets, Averages)
      │
      ▼
[ Claude Sonnet 4 Engine ]  ───► Compiles Natural Language Explanation
      │
      ▼
[ Client UI Renderer ]
```

---

## 3. Database Aggregation Schema (Context Injection)

When the user queries the chatbot or requests an insight report, the server compiles context using specialized SQL views and helper functions:

```json
{
  "user_context": {
    "currency": "USD",
    "timezone": "America/New_York"
  },
  "financials": {
    "this_month_spent": 1245.50,
    "last_month_spent": 980.20,
    "change_percentage": 27.06,
    "top_category": "Food & Dining",
    "budget_limit": 1500.00,
    "remaining_budget": 254.50,
    "predicted_month_end": 1420.00,
    "recurring_subscriptions_total": 45.00
  },
  "recent_anomalies": [
    {
      "date": "2026-07-28",
      "merchant": "Uber Eats",
      "amount": 75.20,
      "reason": "Spent 150% more than usual average merchant charge ($30.00)"
    }
  ]
}
```

---

## 4. Prompt Specifications

### System Prompt (`src/services/ai/prompts.ts`)
```
You are Lumora, a highly knowledgeable, empathetic, and professional personal financial companion. 
Your goal is to explain financial data and trends like an expert human advisor (friendly, clear, concise).

Operational Guidelines:
1. Do NOT perform arithmetic operations. Rely entirely on the values provided in the JSON context.
2. If the user asks for calculations not present in the JSON payload, politely reply: "I don't have that direct calculation ready, let me fetch it for you."
3. Highlight patterns, behavior, and opportunities for optimization. Do not just read numbers back.
4. Keep paragraphs short (maximum 2-3 sentences). Use clean bullet points.
```

### Conversational Examples
* **User:** "Why am I overspending?"
* **Context Engine:** Fetches category sums, comparison with last month, list of categories over budget.
* **LLM Synthesis:** "You've spent 27% more on food delivery compared to last month. Specifically, Friday evenings represent 40% of this increase, suggesting a habit of ordering dinner after a long work week."
