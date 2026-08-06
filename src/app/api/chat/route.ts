import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AIContextBuilder } from "@/features/context-engine/context-builder";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Fetch messages from chat_history ordered by creation date
    const { data: history, error } = await supabase
      .from("chat_history")
      .select("role, message, conversation_id, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch chat history: ${error.message}`);
    }

    const messages = (history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.message,
    }));

    // Find the latest conversation ID, or create a new one
    const conversationId = history && history.length > 0
      ? history[history.length - 1].conversation_id
      : crypto.randomUUID();

    return NextResponse.json({ messages, conversationId });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Soft delete or clear chat history for user
    const { error } = await supabase
      .from("chat_history")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      // If deleted_at column doesn't exist, hard delete rows
      await supabase.from("chat_history").delete().eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse payload parameters
    const { message, conversationId, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message payload" }, { status: 400 });
    }

    const activeConversationId = conversationId || crypto.randomUUID();

    // 3. Write user's message to chat_history database table
    const { error: userMsgError } = await supabase
      .from("chat_history")
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "user",
        message: message,
      });

    if (userMsgError) {
      console.error("Failed to insert user message in DB:", userMsgError.message);
    }

    // 4. Compile deterministic Financial Knowledge Object context
    const financialContext = await AIContextBuilder.buildAIContext(user.id);

    // Fetch user categories to match and list in system prompt
    const { data: dbCategories } = await supabase
      .from("categories")
      .select("id, name")
      .is("deleted_at", null);
    const categoriesList = (dbCategories || []).map((c) => c.name).join(", ");

    // 5. Formulate system rules and prompt instructions
    const systemPrompt = `You are Lumora AI, a state-of-the-art personal finance companion.
Your role is to explain, summarize, and outline the user's financial status, budget limits, goal progress, and trends.

CRITICAL RULES:
- **NO CALCULATIONS**: Never perform manual math calculations, sums, averages, or predictions.
- **DETERMINISTIC PRESENTATION**: Rely entirely on the pre-calculated metrics, insights, and recommendations supplied inside the Financial Knowledge Object below.
- **SOURCE INTEGRITY**: Refer to confidence metrics and Priority levels where helpful.
- **CONCISE FORMATTING**: Present responses in clean, bulleted, mobile-first Markdown.
- **CURRENCY**: Since the user is in India, always format currency amounts using Indian Rupee (₹) symbols instead of dollars ($).

EXPENSE CAPTURE RULE:
- If the user explicitly mentions a transaction they want to record (e.g. "I spent 20 rupees on a toffee" or "Bought coffee for $4"), you must:
  1. Ask: "Would you like me to save this expense?"
  2. Append a special XML tag at the very end of your response:
     <save-expense-cta amount="[number]" merchant="[string]" category="[one of: ${categoriesList}]" notes="[string]" />
     Example: <save-expense-cta amount="20" merchant="Toffee" category="Food & Dining" notes="Spent 20 rupees on a toffee" />

SUGGESTED QUESTIONS:
- At the very end of your response, always suggest 2 to 3 context-aware, follow-up questions the user might want to ask next. Format them inside a <suggested-questions> XML tag (one question per bullet line starting with "- ").
  Example:
  <suggested-questions>
  - What is my budget utilization?
  - How can I save more?
  </suggested-questions>

Provided Financial Context (FKO):
${JSON.stringify(financialContext, null, 2)}`;

    // Prepare message structures for Anthropic Claude
    const claudeMessages = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    // Read CLAUDE_API_KEY securely from server-side env
    const claudeApiKey = process.env.CLAUDE_API_KEY;

    if (!claudeApiKey) {
      const score = financialContext.score;
      const topBehavior = financialContext.financialKnowledge.behaviors?.[0];
      const topPrediction = financialContext.financialKnowledge.predictions?.[0];

      let demoResponse = `[Demo Mode] Lumora AI: Thank you for asking! Based on your financial intelligence layer:\n\n- **Health Score**: **${score.grade}** (${score.overallScore}/100)\n- **Top Behavior**: ${topBehavior?.description || "No behavior patterns detected yet."}\n- **Top Prediction**: ${topPrediction?.metric ? `${topPrediction.metric} is trending ${topPrediction.trend}` : "No predictions available yet."}\n\n*Configure CLAUDE_API_KEY inside your .env.local to enable real-time AI explanations.*\n\n<suggested-questions>\n- Tell me about my budgets\n- What are my top categories?\n- Show me my savings goals\n</suggested-questions>`;

      // Check if user is asking to record an expense in demo mode
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("spent") || lowerMsg.includes("bought") || lowerMsg.includes("buy") || lowerMsg.includes("rupees") || lowerMsg.includes("toffee") || lowerMsg.includes("uber")) {
        const amountMatch = message.match(/(?:₹|rs\.?|rupees?|\$)\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:₹|rs\.?|rupees?|\$|inr)/i) || message.match(/\b(\d+)\b/);
        const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2] || amountMatch[0]) : 20.00;
        
        let merchant = "Toffee";
        if (lowerMsg.includes("uber")) merchant = "Uber";
        else if (lowerMsg.includes("starbucks")) merchant = "Starbucks";
        else if (lowerMsg.includes("coffee")) merchant = "Starbucks";
        else if (lowerMsg.includes("electricity")) merchant = "Power Corp";
        
        let category = "Food & Dining";
        if (lowerMsg.includes("uber")) category = "Transportation";
        else if (lowerMsg.includes("electricity")) category = "Utilities";

        demoResponse = `[Demo Mode] Lumora AI: I see you want to log an expense of ₹${amount} at ${merchant}.\n\nWould you like me to save this expense?\n\n<save-expense-cta amount="${amount}" merchant="${merchant}" category="${category}" notes="Spent ${amount} on ${merchant}" />\n\n<suggested-questions>\n- Show me my today expenses\n- Tell me about my budgets\n</suggested-questions>`;
      }

      // Log assistant message in demo mode
      await supabase.from("chat_history").insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "assistant",
        message: demoResponse,
        model: "demo-fallback",
      });

      return NextResponse.json({
        role: "assistant",
        content: demoResponse,
      });
    }

    // 6. Try Anthropic Claude Models: claude-haiku-4-5 -> 3.5 Haiku -> 3 Haiku -> 3.5 Sonnet
    let claudeResponse: Response | null = null;
    const modelsToTry = [
      "claude-haiku-4-5",
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307",
      "claude-3-5-sonnet-20241022",
    ];

    for (const modelName of modelsToTry) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": claudeApiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            max_tokens: 1024,
            system: systemPrompt,
            messages: claudeMessages,
          }),
        });

        if (res.ok) {
          claudeResponse = res;
          break;
        } else {
          console.warn(`⚠️ Model ${modelName} returned status ${res.status}`);
        }
      } catch (err) {
        console.warn(`⚠️ Failed to connect to model ${modelName}:`, err);
      }
    }

    // If Claude response succeeded
    if (claudeResponse && claudeResponse.ok) {
      const data = await claudeResponse.json();
      const assistantContent = data.content?.[0]?.text || "Sorry, I could not formulate an answer.";

      // Write assistant response to DB
      await supabase.from("chat_history").insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "assistant",
        message: assistantContent,
        model: data.model || "claude-haiku",
      });

      return NextResponse.json({
        role: "assistant",
        content: assistantContent,
      });
    }

    // Fallback: Generate intelligent Financial Analytics response using live user data
    console.log("Using Lumora Financial Intelligence Engine for data analytics response.");
    const analyticsResponse = generateFinancialIntelligenceResponse(message, financialContext, categoriesList);

    await supabase.from("chat_history").insert({
      user_id: user.id,
      conversation_id: activeConversationId,
      role: "assistant",
      message: analyticsResponse,
      model: "lumora-analytics-engine",
    });

    return NextResponse.json({
      role: "assistant",
      content: analyticsResponse,
    });
  } catch (error) {
    console.error("Internal API Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Intelligent Data Analytics Generator based on live user Financial Knowledge Object
 */
function generateFinancialIntelligenceResponse(message: string, context: any, categoriesList: string): string {
  const lower = message.toLowerCase();
  const summary = context.financialKnowledge?.financialSummary || {};
  const score = context.score || {};
  const categories = context.financialKnowledge?.categorySummaries || [];
  const budgets = context.financialKnowledge?.budgetSummaries || [];
  const predictions = context.financialKnowledge?.predictions || [];
  const recommendations = context.financialKnowledge?.recommendations || [];

  // 1. Check expense logging intent
  if (lower.includes("spent") || lower.includes("bought") || lower.includes("paid") || lower.includes("rupees") || lower.includes("toffee") || lower.includes("uber") || lower.includes("coffee") || lower.includes("tea")) {
    const amountMatch = message.match(/(?:₹|rs\.?|rupees?|\$)\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:₹|rs\.?|rupees?|\$|inr)/i) || message.match(/\b(\d+(?:\.\d{2})?)\b/);
    const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2] || amountMatch[0]) : 50.00;
    
    let merchant = "Merchant";
    if (lower.includes("uber")) merchant = "Uber";
    else if (lower.includes("toffee") || lower.includes("candy")) merchant = "Toffee";
    else if (lower.includes("coffee") || lower.includes("starbucks")) merchant = "Starbucks";
    else if (lower.includes("chai") || lower.includes("tea")) merchant = "Tea Stall";
    else if (lower.includes("groceries") || lower.includes("supermarket")) merchant = "Supermarket";

    let category = "Food & Dining";
    if (lower.includes("uber") || lower.includes("auto") || lower.includes("cab")) category = "Transportation";
    else if (lower.includes("groceries")) category = "Shopping";

    return `I can record this transaction for you!

- **Amount**: ₹${amount}
- **Merchant**: ${merchant}
- **Category**: ${category}

Would you like me to save this expense to your Ledger?

<save-expense-cta amount="${amount}" merchant="${merchant}" category="${category}" notes="Recorded via Lumora AI: ${message.replace(/"/g, '')}" />

<suggested-questions>
- Show my top category expenses
- What is my financial health score?
- Am I within my budget limits?
</suggested-questions>`;
  }

  // 2. Check Health Score Intent
  if (lower.includes("score") || lower.includes("health") || lower.includes("grade")) {
    return `### Financial Health Score Overview

- **Overall Grade**: **${score.grade || 'B'}** (${score.overallScore || 78}/100)
- **Monthly Income**: ₹${(summary.monthIncome || 0).toLocaleString()}
- **Monthly Expense**: ₹${(summary.monthExpense || 0).toLocaleString()}
- **Net Cash Flow**: ₹${(summary.netCashFlow || 0).toLocaleString()}
- **Savings Rate**: ${(summary.savingsRate || 0).toFixed(1)}%

**Key Insight**: ${score.overallScore >= 80 ? "Your finances are in excellent shape!" : "You have a stable financial foundation. Keep track of category limits to improve your score."}

<suggested-questions>
- Show my budget utilization
- What spending predictions do I have?
- How can I increase my savings?
</suggested-questions>`;
  }

  // 3. Check Budget Intent
  if (lower.includes("budget") || lower.includes("limit") || lower.includes("exceed")) {
    if (!budgets || budgets.length === 0) {
      return `### Budget Summary

You currently have no active category budget limits configured. You can set up category spending limits in the **Budgets** section!

<suggested-questions>
- Show my top spending categories
- What is my monthly income and expense?
</suggested-questions>`;
    }

    const budgetLines = budgets.map((b: any) => `- **${b.categoryName}**: ₹${b.spentAmount} / ₹${b.limitAmount} (${b.utilizationPercentage}% spent)`).join("\n");

    return `### Category Budget Limits

${budgetLines}

<suggested-questions>
- What are my spending predictions?
- Show my financial health score
</suggested-questions>`;
  }

  // 3a. Check Runway or Emergency Fund Intent
  if (lower.includes("runway") || lower.includes("emergency") || lower.includes("survival")) {
    const wp = context.wealthPlan || {};
    return `### Emergency Fund & Runway Analysis
 
- **Survival Runway**: **${wp.runwayMonths || 0} months**
- **Average Monthly Expenses**: ₹${(wp.averageMonthlyExpenses || 35000).toLocaleString()}
- **Total Cash Reserves**: ₹${(wp.totalCash || 0).toLocaleString()}
- **Safety Score**: **${wp.safetyScore || 0}/100**
 
**Status Advisory**: ${(wp.runwayMonths || 0) >= 6 ? "Excellent safety buffer! You have more than the standard 6 months of expenses in cash. You can confidently allocate new savings towards investments." : "Your liquid cash buffer is below the recommended 6-month safety threshold. Prioritize saving more cash before investing."}
 
<suggested-questions>
- Tell me about my asset allocations
- What is my debt paydown suggestion?
- Show my FIRE retirement progress
</suggested-questions>`;
  }
 
  // 3b. Check Asset Allocation/Rebalancing Intent
  if (lower.includes("allocation") || lower.includes("rebalanc") || lower.includes("asset")) {
    const wp = context.wealthPlan || {};
    const assetLines = (wp.assets || []).map((a: any) => `- **${a.name}** (${a.type.toUpperCase()}): Current: ₹${a.value.toLocaleString()} | Target: ${a.target}%`).join("\n") || "- No manual assets registered yet.";
    return `### Asset Allocation & Rebalancing Insights
 
${assetLines}
 
**Strategic Action**: Check the **Allocator** tab to see rebalancing operations needed to align with your risk targets.
 
<suggested-questions>
- Show my emergency runway
- Show my FIRE retirement progress
- What is my debt paydown suggestion?
</suggested-questions>`;
  }
 
  // 3c. Check Debt Paydown Intent
  if (lower.includes("debt") || lower.includes("loan") || lower.includes("interest") || lower.includes("credit card")) {
    const wp = context.wealthPlan || {};
    const totalDebt = wp.totalDebts || 0;
    const debtLines = (wp.debts || []).map((d: any) => `- **${d.name}**: ₹${d.balance.toLocaleString()} (Rate: ${d.rate}%)`).join("\n") || "- No manual debts registered.";
    return `### Debt Paydown Suggestions (Avalanche Plan)
 
- **Total Outstanding Debt**: ₹${totalDebt.toLocaleString()}
 
**Registered Liabilities**:
${debtLines}
 
**AI Recommendation**: We suggest sorting debts by interest rate and putting all spare surplus towards the highest rate first. Check the **Debt Paydown** tab to see your custom payment plan.
 
<suggested-questions>
- Show my emergency runway
- Show my asset allocations
</suggested-questions>`;
  }
 
  // 3d. Check FIRE retirement Intent
  if (lower.includes("fire") || lower.includes("retire") || lower.includes("independence")) {
    const wp = context.wealthPlan || {};
    return `### Financial Independence (FIRE) Target Plan
 
- **Target Retirement Fund (FIRE Number)**: ₹${(wp.fireNumber || 0).toLocaleString()}
- **Net Wealth Progress**: ₹${(wp.netWealth || 0).toLocaleString()}
- **Retirement Progress**: **${wp.fireProgress || 0}% Completed**
 
*Note: This calculation uses the rule of 25 (Annual expenses multiplied by 25) based on your ledger's spending history.*
 
<suggested-questions>
- Show my emergency runway
- Tell me about my asset allocations
</suggested-questions>`;
  }
 
  // 4. Default Comprehensive Data Analytics Summary
  const topCatLines = categories.slice(0, 3).map((c: any) => `- **${c.categoryName || 'Other'}**: ₹${c.totalSpent} (${c.percentage}%)`).join("\n") || "- No category data recorded yet.";
  
  return `### Lumora AI Financial Intelligence Summary

- **Health Grade**: **${score.grade || 'B'}** (${score.overallScore || 78}/100)
- **Monthly Income**: ₹${(summary.monthIncome || 0).toLocaleString()}
- **Monthly Expense**: ₹${(summary.monthExpense || 0).toLocaleString()}
- **Net Savings Rate**: ${(summary.savingsRate || 0).toFixed(1)}%

#### Top Spending Categories
${topCatLines}

<suggested-questions>
- Show my budget limits
- What spending predictions do I have?
- How can I save more this month?
</suggested-questions>`;
}
