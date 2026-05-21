import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string) || "https://placeholder.supabase.co";
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("[supabase] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas. La app no se conectará a Supabase.");
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  db: { schema: "lucianails" },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "lrs-sb-auth",
  },
});

export type Database = unknown;
