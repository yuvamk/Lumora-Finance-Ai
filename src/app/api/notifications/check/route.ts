import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationEngine } from "@/features/notifications/services/notification-engine";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await NotificationEngine.checkAndGenerateAlerts(user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run notification check" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
