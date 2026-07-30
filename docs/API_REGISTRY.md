# API Registry

This registry tracks and documents Next.js Server Actions, REST API routes, repositories, and external system integrations.

---

## 1. Auth & Profiles Repository (`AuthRepository`)

### Function: `getProfile`
* **Purpose:** Fetch profiles by unique user identifier.
* **Input:** `userId: string`
* **Output:** `Promise<Profile | null>`

---

## 2. Core Financial Engine Services

### Class: `FinanceEngine`

#### Method: `getFinancialSummary`
* **Purpose:** Coordinates summary views with calculators to compute cash flow and savings rate.
* **Input:** `userId: string`
* **Output:** `Promise<FinancialSummary>`

#### Method: `getFinancialScore`
* **Purpose:** Evaluates health grade metrics.
* **Input:** `userId: string`
* **Output:** `Promise<FinancialScoreContract>`

---

## 3. Analytics Engine Services

### Class: `CategoryAnalytics`

#### Method: `getCategoryDistribution`
* **Purpose:** Computes percentage expenditure allocation weights.
* **Input:** `userId: string`
* **Output:** `Promise<CategorySummary[]>`

---

## 4. Financial Intelligence Engine Services

### Class: `KnowledgeEngine`

#### Method: `getFinancialKnowledge`
* **Purpose:** Main aggregator compiling insights, behaviors, advice, and forecasts into a single structured payload.
* **Input:** `userId: string`
* **Output:** `Promise<FinancialKnowledgeObject>`
* **Explainability:** Attaches confidence scores and algorithm version tags to output objects.

### Class: `InsightEngine`

#### Method: `getInsights`
* **Purpose:** Scans transaction amounts to flag outliers and record-large expenditures.
* **Input:** `userId: string`
* **Output:** `Promise<Insight[]>`

### Class: `BehaviorEngine`

#### Method: `getBehavioralPatterns`
* **Purpose:** Identifies weekday vs weekend spent ratios and other repeat habits.
* **Input:** `userId: string`
* **Output:** `Promise<BehaviorPattern[]>`

### Class: `RecommendationEngine`

#### Method: `getRecommendations`
* **Purpose:** Processes limits utilization indicators to generate actionable advice.
* **Input:** `userId: string`
* **Output:** `Promise<Recommendation[]>`

### Class: `PredictionEngine`

#### Method: `getPredictions`
* **Purpose:** Predicts month-end expenses based on spending velocity.
* **Input:** `userId: string`
* **Output:** `Promise<Prediction[]>`

---

## 5. AI Context Engine Services

### Class: `AIContextBuilder`

#### Method: `buildAIContext`
* **Purpose:** Assembles aggregate summaries, scores, budgets, and savings goals into a unified AI prompt context by consuming the Knowledge Object.
* **Input:** `userId: string`
* **Output:** `Promise<AIContextContract>`
* **AI Versioning:** Includes context schema versions.
