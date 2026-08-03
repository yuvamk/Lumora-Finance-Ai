"use client";

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { CashflowRow, CategoryBreakdownRow } from "@/features/reports/repository";

const COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#84cc16", "#f97316", "#3b82f6",
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthLabel(dateStr: string): string {
  if (!dateStr) return "";
  const cleanStr = String(dateStr).trim();
  
  // Safely parse YYYY-MM-DD or YYYY-MM format without invalid Date conversion issues
  const match = cleanStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const month = parseInt(match[2], 10);
    if (month >= 1 && month <= 12) {
      return `${MONTH_NAMES[month - 1]} '${year.slice(2)}`;
    }
  }

  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short" });
  }

  return cleanStr;
}

// ─── Cash Flow Chart ──────────────────────────────────────────────────────────
export function CashFlowChart({ data }: { data: CashflowRow[] }) {
  if (!data.length) return <EmptyChart label="No cash flow data yet" />;

  const formatted = data.map(d => ({
    ...d,
    month: formatMonthLabel(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 11 }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value);
            const label = name === "income" ? "Income" : "Expense";
            return [`₹${v.toLocaleString()}`, label];
          }}
        />
        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
        <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Category Pie Chart ───────────────────────────────────────────────────────
export function CategoryPieChart({ data }: { data: CategoryBreakdownRow[] }) {
  if (!data.length) return <EmptyChart label="No category data yet" />;
  const expenses = data.filter(d => d.type === "expense").slice(0, 8);

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={expenses} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
            dataKey="total_spent" nameKey="category_name" paddingAngle={2}>
            {expenses.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 11 }}
            formatter={(value: unknown) => [`₹${Number(value).toLocaleString()}`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 w-full md:w-48 flex-shrink-0">
        {expenses.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-zinc-400 truncate max-w-[100px]">{item.category_name}</span>
            </div>
            <span className="text-zinc-300 font-semibold">{item.percentage?.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Income vs Expense Bar Chart ─────────────────────────────────────────────
export function IncomeExpenseBarChart({ data }: { data: CashflowRow[] }) {
  if (!data.length) return <EmptyChart label="No data yet" />;
  const formatted = data.map(d => ({
    ...d,
    month: formatMonthLabel(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 11 }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value);
            const label = name === "income" ? "Income" : "Expenses";
            return [`₹${v.toLocaleString()}`, label];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Empty Placeholder ────────────────────────────────────────────────────────
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">
      {label}
    </div>
  );
}
