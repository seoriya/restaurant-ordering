import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let admin: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

/** Full-access client using the SECRET key. Server only — used for orders. */
export function supabaseAdmin(): SupabaseClient {
  admin ??= createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Read-only-by-RLS client using the publishable key — used for the menu. */
export function supabasePublic(): SupabaseClient {
  publicClient ??= createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}
