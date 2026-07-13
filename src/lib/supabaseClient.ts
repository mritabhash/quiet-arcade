import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one Supabase client, built from the anon (public) key only — the
 * service_role key must never appear anywhere in this app. When the env vars
 * are absent the client is null and the whole arcade behaves exactly as the
 * offline, localStorage-only guest experience.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey && url.startsWith("https://") ? createClient(url, anonKey) : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
