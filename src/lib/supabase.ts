import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Server-only client using the service role key. Tables have RLS on with no policies, so only this key can read/write. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tapkdjdhyyxmsnbjbxae.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "missing";
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export const BUCKET = "breadbox";

/** Wrap a query so a missing key / network error degrades to empty data instead of a crash. */
export async function safe<T>(q: PromiseLike<{ data: unknown; error: unknown }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await q;
    if (error) {
      console.error("[supabase]", error);
      return fallback;
    }
    return (data ?? fallback) as T;
  } catch (e) {
    console.error("[supabase]", e);
    return fallback;
  }
}
