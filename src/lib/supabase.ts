import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── WebSocket polyfill para Node.js < 22 ────────────────────────────────────
// Supabase Realtime requiere WebSocket. Node 22+ lo tiene nativo.
// En Node 20 (Hostinger) no existe, así que lo proveemos con el paquete "ws".
//
// import.meta.env.SSR es reemplazado por Vite en tiempo de compilación:
//   • SSR bundle (prerender) → true  → el polyfill se activa
//   • Client bundle (browser) → false → este bloque es eliminado (tree-shaken)
//   → el paquete "ws" NO llega al bundle del navegador.
if (import.meta.env.SSR && typeof globalThis.WebSocket === "undefined") {
  const { WebSocket: WS } = await import("ws");
  (globalThis as typeof globalThis & { WebSocket: typeof WS }).WebSocket = WS;
}
// ─────────────────────────────────────────────────────────────────────────────

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
