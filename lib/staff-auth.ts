import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE = "staff_session";

function token(): string {
  // Derived from the staff password, so changing the password logs everyone out.
  return crypto.createHmac("sha256", env.staffPassword).update("staff-session-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function passwordMatches(input: string): boolean {
  return safeEqual(input, env.staffPassword);
}

export async function isStaff(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, token());
}

export async function startStaffSession() {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function endStaffSession() {
  (await cookies()).delete(COOKIE);
}
