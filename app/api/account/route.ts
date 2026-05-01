import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { signOut } from "next-auth/react";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();

  const { error } = await db.from("logs").delete().eq("user_id", session.user.id);
  if (error) {
    console.error("[account/DELETE]", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
