import { NextResponse } from "next/server";
import { endStaffSession } from "@/lib/staff-auth";

export async function POST(req: Request) {
  await endStaffSession();
  return NextResponse.redirect(new URL("/staff", req.url), 303);
}
