import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { generateWeeklySummary } from "@/lib/anthropic";
import type { Log, PromptStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from, to, style = "professional" }: { from?: string; to?: string; style?: PromptStyle } = await req.json();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const db = createServiceClient();
  const { data: logs, error } = await db
    .from("logs")
    .select("*")
    .eq("user_id", session.user.id)
    .gte("date", from || weekAgo)
    .lte("date", to || today)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!logs?.length) return NextResponse.json({ summary: "No logs found for this period." });

  const logsText = (logs as Log[]).map(l => `[${l.date}] [${l.project}] ${l.summary}`).join("\n");
  const summary = await generateWeeklySummary(logsText, style);

  return NextResponse.json({ summary: summary || "Could not generate summary." });
}
