import { NextResponse } from "next/server";
import { isStaff } from "@/lib/staff-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/validate";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ done_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "paid");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
