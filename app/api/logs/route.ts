import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { structureLog, inferProjectFallback, inferTypeFallback, cleanSummaryFallback } from "@/lib/anthropic";
import type { CreateLogInput, PromptStyle } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const db = createServiceClient();
  let query = db.from("logs").select("*").eq("user_id", session.user.id).order("date", { ascending: false });

  if (project) query = query.eq("project", project);
  if (type) query = query.eq("type", type);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (search) query = query.or(`summary.ilike.%${search}%,raw_input.ilike.%${search}%,project.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: CreateLogInput & { style?: PromptStyle } = await req.json();
  const { date, raw_input, project_override, type_override, style = "professional" } = body;

  if (!raw_input?.trim()) return NextResponse.json({ error: "raw_input required" }, { status: 400 });
  if (raw_input.length > 2000) return NextResponse.json({ error: "raw_input too long (max 2000 chars)" }, { status: 400 });

  const db = createServiceClient();

  // Get existing projects for context
  const { data: existing } = await db.from("logs").select("project").eq("user_id", session.user.id);
  const existingProjects = [...new Set((existing ?? []).map(l => l.project))];

  // Structure with Claude (falls back to keyword inference)
  const structured = await structureLog(raw_input, existingProjects, style);

  const log = {
    user_id: session.user.id,
    date: date || new Date().toISOString().slice(0, 10),
    raw_input: raw_input.trim(),
    summary: structured?.summary || cleanSummaryFallback(raw_input),
    project: project_override || structured?.project || inferProjectFallback(raw_input),
    type: type_override || structured?.type || inferTypeFallback(raw_input),
  };

  const { data, error } = await db.from("logs").insert(log).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
