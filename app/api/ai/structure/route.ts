import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { structureLog, inferProjectFallback, inferTypeFallback, cleanSummaryFallback } from "@/lib/anthropic";
import type { PromptStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { raw_input, style = "professional" }: { raw_input: string; style?: PromptStyle } = await req.json();
  if (!raw_input?.trim()) return NextResponse.json({ error: "raw_input required" }, { status: 400 });

  const db = createServiceClient();
  const { data: existing } = await db.from("logs").select("project").eq("user_id", session.user.id);
  const existingProjects = [...new Set((existing ?? []).map((l: { project: string }) => l.project))];

  const structured = await structureLog(raw_input, existingProjects, style as PromptStyle);

  if (structured) return NextResponse.json({ ...structured, fallback: false });

  return NextResponse.json({
    summary: cleanSummaryFallback(raw_input),
    project: inferProjectFallback(raw_input),
    type: inferTypeFallback(raw_input),
    fallback: true,
  });
}
