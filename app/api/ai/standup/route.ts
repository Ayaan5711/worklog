import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { generateStandup } from "@/lib/anthropic";
import type { Log, PromptStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, style = "professional" }: { date: string; style?: PromptStyle } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const db = createServiceClient();
  const { data: logs, error } = await db.from("logs").select("*").eq("user_id", session.user.id).eq("date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!logs?.length) return NextResponse.json({ update: "No logs found for this date.", date });

  const logsText = (logs as Log[]).map(l => `[${l.project}] ${l.summary}`).join("\n");
  const update = await generateStandup(date, logsText, style);

  return NextResponse.json({ update: update || "Could not generate standup.", date });
}
