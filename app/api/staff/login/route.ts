import { NextResponse } from "next/server";
import { passwordMatches, startStaffSession } from "@/lib/staff-auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.redirect(new URL("/staff?error=1", req.url), 303);
  }
  await startStaffSession();
  return NextResponse.redirect(new URL("/staff", req.url), 303);
}
