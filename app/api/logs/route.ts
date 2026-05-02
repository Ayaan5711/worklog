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
  if (search) {
    const esc = search.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`summary.ilike.%${esc}%,raw_input.ilike.%${esc}%,project.ilike.%${esc}%`);
  }

  const { data, error } = await query;
  if (error) { console.error("[logs/GET]", error.message); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { error } = await db.from("logs").delete().eq("user_id", session.user.id);
  if (error) { console.error("[logs/DELETE]", error.message); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: CreateLogInput & { style?: PromptStyle } = await req.json();
  const { date, raw_input, project_override, type_override, summary_override, style = "professional" } = body;

  if (!raw_input?.trim()) return NextResponse.json({ error: "raw_input required" }, { status: 400 });
  if (raw_input.length > 2000) return NextResponse.json({ error: "raw_input too long (max 2000 chars)" }, { status: 400 });

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (date && !isoDateRegex.test(date)) return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  if (date) {
    const d = new Date(date);
    const now = new Date();
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    if (d > now) return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
    const fiveYearsAgo = new Date(); fiveYearsAgo.setFullYear(now.getFullYear() - 5);
    if (d < fiveYearsAgo) return NextResponse.json({ error: "Date too far in the past" }, { status: 400 });
  }

  const db = createServiceClient();

  let summary: string;
  let project: string;
  let type: string;

  if (summary_override && project_override && type_override) {
    // Fast path: caller supplied all fields, skip AI entirely
    summary = summary_override.trim();
    project = project_override;
    type = type_override;
  } else {
    const { data: existing } = await db.from("logs").select("project").eq("user_id", session.user.id);
    const existingProjects = [...new Set((existing ?? []).map(l => l.project))];
    const structured = await structureLog(raw_input, existingProjects, style);
    summary = summary_override?.trim() || structured?.summary || cleanSummaryFallback(raw_input);
    project = project_override || structured?.project || inferProjectFallback(raw_input);
    type = type_override || structured?.type || inferTypeFallback(raw_input);
  }

  const log = {
    user_id: session.user.id,
    date: date || new Date().toISOString().slice(0, 10),
    raw_input: raw_input.trim(),
    summary,
    project,
    type,
  };

  const { data, error } = await db.from("logs").insert(log).select().single();
  if (error) { console.error("[logs/POST]", error.message); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return NextResponse.json(data, { status: 201 });
}
