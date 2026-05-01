import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { generateStandup } from "@/lib/anthropic";
import { safeStyle } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import type { Log, PromptStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`ai:${session.user.id}`, 20, 60_000))
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });

  const { date, style }: { date: string; style?: unknown } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
  const safeStyleVal: PromptStyle = safeStyle(style);

  const db = createServiceClient();
  const { data: logs, error } = await db.from("logs").select("*").eq("user_id", session.user.id).eq("date", date);
  if (error) { console.error("[standup]", error.message); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  if (!logs?.length) return NextResponse.json({ update: "No logs found for this date.", date });

  const logsText = (logs as Log[]).map(l => `[${l.project}] ${l.summary}`).join("\n");
  const update = await generateStandup(date, logsText, safeStyleVal);

  return NextResponse.json({ update: update || "Could not generate standup.", date });
}
