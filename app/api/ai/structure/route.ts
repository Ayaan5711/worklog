import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { structureLog, inferProjectFallback, inferTypeFallback, cleanSummaryFallback } from "@/lib/anthropic";
import { safeStyle } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import type { PromptStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`ai:${session.user.id}`, 20, 60_000))
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });

  const { raw_input, style, existingProjects: clientProjects }: { raw_input: string; style?: unknown; existingProjects?: string[] } = await req.json();
  if (!raw_input?.trim()) return NextResponse.json({ error: "raw_input required" }, { status: 400 });
  const safeStyleVal: PromptStyle = safeStyle(style);

  let existingProjects: string[] = Array.isArray(clientProjects)
    ? clientProjects.slice(0, 50).map(p => String(p).slice(0, 200))
    : [];
  if (!clientProjects) {
    const db = createServiceClient();
    const { data: existing } = await db.from("logs").select("project").eq("user_id", session.user.id);
    existingProjects = [...new Set((existing ?? []).map((l: { project: string }) => l.project))];
  }

  const structured = await structureLog(raw_input, existingProjects, safeStyleVal);

  if (structured) return NextResponse.json({ ...structured, fallback: false });

  return NextResponse.json({
    summary: cleanSummaryFallback(raw_input),
    project: inferProjectFallback(raw_input),
    type: inferTypeFallback(raw_input),
    fallback: true,
  });
}
