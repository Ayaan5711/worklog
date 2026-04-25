import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { generateBragSheet } from "@/lib/anthropic";
import type { Log, PromptStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from, to, projects, style = "professional" }: {
    from?: string; to?: string; projects?: string[]; style?: PromptStyle;
  } = await req.json();

  const db = createServiceClient();
  let query = db.from("logs").select("*").eq("user_id", session.user.id).order("date", { ascending: true });
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (projects?.length) query = query.in("project", projects);

  const { data: logs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!logs?.length) return NextResponse.json({ bullets: [], generated_at: new Date().toISOString() });

  const logsText = (logs as Log[]).map(l => `[${l.date}] [${l.project}] [${l.type}] ${l.summary}`).join("\n");
  const bullets = await generateBragSheet(logsText, style);

  if (!bullets) {
    const fallbackBullets: string[] = [];
    const grouped: Record<string, Log[]> = {};
    (logs as Log[]).forEach(l => { if (!grouped[l.project]) grouped[l.project] = []; grouped[l.project].push(l); });
    for (const [proj, pLogs] of Object.entries(grouped)) {
      const features = pLogs.filter(l => l.type === "feature");
      if (features.length) fallbackBullets.push(`Built ${features.length} feature(s) for ${proj}: ${features[0].summary}`);
      const refactors = pLogs.filter(l => l.type === "refactor");
      if (refactors.length) fallbackBullets.push(`Refactored ${proj}: ${refactors[0].summary}`);
    }
    return NextResponse.json({ bullets: fallbackBullets, generated_at: new Date().toISOString(), fallback: true });
  }

  return NextResponse.json({ bullets, generated_at: new Date().toISOString() });
}
