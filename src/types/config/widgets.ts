/**
 * Configurable Dashboard Widget Registry.
 * Centralizes layout rules, ordering, and visibility settings.
 */

export interface DashboardWidgetConfig {
  id: "balance" | "cashflow" | "score" | "budgets" | "goals" | "subscriptions" | "activity";
  name: string;
  visible: boolean;
  order: number;
  size: "sm" | "md" | "lg";
  description: string;
}

export const WIDGET_REGISTRY: DashboardWidgetConfig[] = [
  {
    id: "balance",
    name: "Balance Overview",
    visible: true,
    order: 1,
    size: "sm",
    description: "Displays current liquid balance, income, and expense summaries.",
  },
  {
    id: "score",
    name: "Financial Health Score",
    visible: true,
    order: 2,
    size: "sm",
    description: "Shows overall health grade and weighted scoring factors.",
  },
  {
    id: "cashflow",
    name: "Monthly Cash Flow",
    visible: true,
    order: 3,
    size: "md",
    description: "Timeline visual of income comparison against expenses.",
  },
  {
    id: "budgets",
    name: "Category Budgets",
    visible: true,
    order: 4,
    size: "md",
    description: "Monitors category limits and warns on high utilization levels.",
  },
  {
    id: "goals",
    name: "Savings Goals",
    visible: true,
    order: 5,
    size: "md",
    description: "Tracks saving targets progress and suggests monthly deposits.",
  },
  {
    id: "subscriptions",
    name: "Recurring Bills",
    visible: true,
    order: 6,
    size: "sm",
    description: "Lists upcoming subscription renewals and rolling totals.",
  },
  {
    id: "activity",
    name: "Recent Logs",
    visible: true,
    order: 7,
    size: "sm",
    description: "Chronological feed of audits and user activity logs.",
  },
];
