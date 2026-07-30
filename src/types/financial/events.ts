/**
 * Type contracts for event-driven processing and cache-invalidation flows.
 */

export type EventType = 
  | "transaction.created"
  | "transaction.updated"
  | "transaction.deleted"
  | "budget.updated"
  | "goal.updated"
  | "ai.report_generated";

export interface BaseEventPayload {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  userId: string;
}

export interface TransactionEventPayload extends BaseEventPayload {
  eventType: "transaction.created" | "transaction.updated" | "transaction.deleted";
  data: {
    transactionId: string;
    amount: number;
    type: "income" | "expense" | "transfer" | "refund";
    categoryId: string;
    date: string;
  };
}

export interface BudgetEventPayload extends BaseEventPayload {
  eventType: "budget.updated";
  data: {
    budgetId: string;
    categoryId: string;
    limitAmount: number;
  };
}

export interface GoalEventPayload extends BaseEventPayload {
  eventType: "goal.updated";
  data: {
    goalId: string;
    name: string;
    targetAmount: number;
    currentBalance: number;
  };
}

export interface AIReportEventPayload extends BaseEventPayload {
  eventType: "ai.report_generated";
  data: {
    reportId: string;
    reportType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    modelName: string;
  };
}

export type LumoraEvent = 
  | TransactionEventPayload 
  | BudgetEventPayload 
  | GoalEventPayload 
  | AIReportEventPayload;
