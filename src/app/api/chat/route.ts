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

EXPENSE CAPTURE RULE:
- If the user explicitly mentions a transaction they want to record (e.g. "I spent 20 rupees on a toffee" or "Bought coffee for $4"), you must:
  1. Ask: "Would you like me to save this expense?"
  2. Append a special XML tag at the very end of your response:
     <save-expense-cta amount="[number]" merchant="[string]" category="[one of: ${categoriesList}]" notes="[string]" />
     Example: <save-expense-cta amount="20" merchant="Toffee" category="Food & Dining" notes="Spent 20 rupees on a toffee" />

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

      let demoResponse = `[Demo Mode] Lumora AI: Thank you for asking! Based on your financial intelligence layer:\n\n- **Health Score**: **${score.grade}** (${score.overallScore}/100)\n- **Top Behavior**: ${topBehavior?.description || "No behavior patterns detected yet."}\n- **Top Prediction**: ${topPrediction?.metric ? `${topPrediction.metric} is trending ${topPrediction.trend}` : "No predictions available yet."}\n\n*Configure CLAUDE_API_KEY inside your .env.local to enable real-time AI explanations.*`;

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

        demoResponse = `[Demo Mode] Lumora AI: I see you want to log an expense of ₹${amount} at ${merchant}.\n\nWould you like me to save this expense?\n\n<save-expense-cta amount="${amount}" merchant="${merchant}" category="${category}" notes="Spent ${amount} on ${merchant}" />`;
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

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API invocation failure status:", claudeResponse.status, errText);

      const errorText = `⚠️ Claude API returned an error (${claudeResponse.status}). Please verify your API key and try again.`;

      // Log error message as assistant response in DB
      await supabase.from("chat_history").insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "assistant",
        message: errorText,
        model: "claude-error-fallback",
      });

      return NextResponse.json({
        role: "assistant",
        content: errorText,
      });
    }

    const data = await claudeResponse.json();
    const assistantContent = data.content?.[0]?.text || "Sorry, I could not formulate an answer.";

    // 6. Write assistant's response to chat_history database table
    const { error: assistantMsgError } = await supabase
      .from("chat_history")
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "assistant",
        message: assistantContent,
        model: "claude-3-5-haiku-20241022",
      });

    if (assistantMsgError) {
      console.error("Failed to insert assistant message in DB:", assistantMsgError.message);
    }

    return NextResponse.json({
      role: "assistant",
      content: assistantContent,
    });
  } catch (error) {
    console.error("Internal API Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
