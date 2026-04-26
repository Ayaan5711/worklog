import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { structureLog, inferProjectFallback, inferTypeFallback, cleanSummaryFallback } from "@/lib/anthropic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = createServiceClient();

  // If raw_input changed, re-structure
  if (body.raw_input) {
    const { data: existing } = await db.from("logs").select("project").eq("user_id", session.user.id);
    const existingProjects = [...new Set((existing ?? []).map((l: { project: string }) => l.project))];
    const structured = await structureLog(body.raw_input, existingProjects);
    if (structured) {
      body.summary = structured.summary;
      body.project = body.project_override || structured.project;
      body.type = body.type_override || structured.type;
    } else {
      body.summary = cleanSummaryFallback(body.raw_input);
      body.project = body.project_override || inferProjectFallback(body.raw_input);
      body.type = body.type_override || inferTypeFallback(body.raw_input);
    }
  }

  const allowed = ["summary", "raw_input", "project", "type", "date"] as const;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await db
    .from("logs")
    .update(update)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) { console.error("[logs/PUT]", error.message); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createServiceClient();
  const { error } = await db.from("logs").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) { console.error("[logs/DELETE id]", error.message); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return new NextResponse(null, { status: 204 });
}
