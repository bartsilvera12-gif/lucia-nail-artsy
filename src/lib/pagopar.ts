/**
 * pagopar.ts — Frontend client for Pagopar API endpoints
 *
 * All calls go through our own server (/api/pagopar/*).
 * The private token NEVER leaves the server.
 *
 * Used only in Lucía Rojas Studio flows — completely isolated from
 * any other payment provider.
 */

export interface PagoparComprador {
  nombre: string;
  apellido: string;
  documento_identidad: string;
  email: string;
  celular: string;
  ciudad: string;
  departamento: string;
  direccion: string;
}

export interface PagoparProducto {
  nombre: string;
  cantidad: number;
  precio_pyg: number;        // Monto en Guaraníes (PYG), entero, sin conversión
  descripcion: string;
  categoria_pagopar: string; // e.g. "Servicios" or "Cursos online"
  url_imagen?: string;
}

export interface IniciarPayload {
  monto_pyg: number;         // Monto total en Guaraníes (PYG), entero positivo, sin conversión
  descripcion: string;
  comprador: PagoparComprador;
  productos: PagoparProducto[];
  user_id: string;
  curso_id: string;          // Pagopar solo aplica para compra de cursos individuales
}

export interface IniciarResult {
  hash_pedido: string;
  url_pago: string;
  id_pedido: string;
}

/**
 * Formato real de la API /pedidos/1.1/traer de Pagopar:
 *   { respuesta: true, resultado: [{ pagado: true, hash_pedido: "...", ... }] }
 * `respuesta` es boolean; los datos del pago están en `resultado[0]`.
 */
export interface EstadoResult {
  respuesta: boolean;
  resultado: Array<{
    pagado: boolean;
    hash_pedido?: string;
    numero_pedido?: string;
    monto?: string;
    fecha_pago?: string | null;
    forma_pago?: string;
    cancelado?: boolean;
    [key: string]: unknown;
  }> | string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Initiates a Pagopar transaction.
 * Requires a valid Supabase JWT in the Authorization header (user must be logged in).
 */
export async function pagoparIniciar(
  payload: IniciarPayload,
  supabaseJwt: string,
): Promise<{ data: IniciarResult | null; error: string | null }> {
  try {
    const res = await fetch("/api/pagopar/iniciar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseJwt}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      // Build a human-readable error that includes Pagopar's own message when available
      let msg = json.error || `Error ${res.status}`;
      const raw = json.pagopar_raw_message || json.pagopar_mensaje;
      if (raw && typeof raw === "string") {
        msg = `${msg} — Pagopar dice: "${raw}"`;
      } else if (json.pagopar_respuesta !== undefined) {
        msg = `${msg} — Pagopar respuesta=${JSON.stringify(json.pagopar_respuesta)}`;
      }
      return { data: null, error: msg };
    }
    return { data: json as IniciarResult, error: null };
  } catch (e) {
    return { data: null, error: "No se pudo conectar con el servidor de pagos" };
  }
}

/**
 * Queries the real payment status from Pagopar.
 * Safe to call from the result page (private token stays server-side).
 */
export async function pagoparEstado(
  hash_pedido: string,
): Promise<{ data: EstadoResult | null; error: string | null }> {
  try {
    const res = await fetch("/api/pagopar/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash_pedido }),
    });

    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error || `Error ${res.status}` };
    return { data: json as EstadoResult, error: null };
  } catch (e) {
    return { data: null, error: "No se pudo consultar el estado del pago" };
  }
}

// ── SessionStorage context ────────────────────────────────────────────────────
// Stores purchase context so the result page knows what to grant access to.

export interface PagoparContext {
  tipo: "course";        // Pagopar solo para cursos individuales
  curso_id: string;
  curso_slug?: string;
  precio_pyg: number;   // monto en Guaraníes, sin conversión
  hash_pedido: string;
}

const STORAGE_KEY = "lrs_pagopar_ctx";

export function savePagoparContext(ctx: PagoparContext) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch { /* ignore */ }
}

export function loadPagoparContext(): PagoparContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PagoparContext) : null;
  } catch {
    return null;
  }
}

export function clearPagoparContext() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
