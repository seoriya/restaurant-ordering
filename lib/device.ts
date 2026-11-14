import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// An anonymous random ID stored on the customer's phone, so "My orders" works without logging in.
export const DEVICE_COOKIE = "device_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readDeviceId(): Promise<string | null> {
  const value = (await cookies()).get(DEVICE_COOKIE)?.value;
  return value && UUID_RE.test(value) ? value : null;
}

/** Only callable from route handlers / server actions (where cookies can be written). */
export async function setDeviceId(id: string): Promise<void> {
  (await cookies()).set(DEVICE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 2,
  });
}

/** Only callable from route handlers / server actions (where cookies can be written). */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await readDeviceId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  await setDeviceId(id);
  return id;
}
