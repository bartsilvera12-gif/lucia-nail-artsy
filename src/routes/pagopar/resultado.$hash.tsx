/**
 * /pagopar/resultado/$hash
 *
 * Landing page after Pagopar redirects the user back.
 * Verifies payment status by calling our server-side /api/pagopar/estado
 * (the private token never leaves the server).
 *
 * If pagado=true AND the user is authenticated:
 *   - Creates the course_purchase or subscription record in Supabase
 *   - Refreshes auth context so the user sees access immediately
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, ArrowRight, Home } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { pagoparEstado, loadPagoparContext, clearPagoparContext } from "@/lib/pagopar";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pagopar/resultado/$hash")({
  head: () => ({ meta: [{ title: "Resultado del pago — Lucía Rojas Studio" }] }),
  component: ResultadoPagoPage,
});

type Status = "checking" | "success" | "pending" | "failed" | "error";

function ResultadoPagoPage() {
  const { hash } = Route.useParams();
  const { user, refresh } = useAuth();

  const [status, setStatus]   = useState<Status>("checking");
  const [message, setMessage] = useState<string>("");
  const [cursoSlug, setCursoSlug] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!hash) { setStatus("error"); setMessage("Hash de pedido no encontrado"); return; }

    let cancelled = false;

    async function verificar() {
      // 1. Query Pagopar for real payment status (server keeps private token)
      const { data, error } = await pagoparEstado(hash);

      if (cancelled) return;

      if (error || !data) {
        setStatus("error");
        setMessage(error || "No se pudo verificar el pago");
        return;
      }

      const respuesta = data.respuesta;
      const pagado =
        typeof respuesta === "object" && respuesta !== null
          ? respuesta.pagado === true
          : false;

      // 2. Recover purchase context stored before redirect
      const ctx = loadPagoparContext();

      if (pagado) {
        setStatus("success");
        setCursoSlug(ctx?.curso_slug ?? null);

        // 3. Grant access if we have auth context and purchase wasn't already granted
        if (user && ctx && !granted) {
          setGranted(true);
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user?.id;
          if (!userId) return;

          if (ctx.tipo === "course" && ctx.curso_id) {
            // Check if already has access (idempotent)
            const { data: existing } = await supabase
              .from("course_purchases")
              .select("id")
              .eq("user_id", userId)
              .eq("course_id", ctx.curso_id)
              .maybeSingle();

            if (!existing) {
              await supabase.from("course_purchases").insert({
                user_id:        userId,
                course_id:      ctx.curso_id,
                price_paid:     ctx.precio_usd,
                payment_method: "pagopar",
              });

              // Update the pending payment record to succeeded
              await supabase
                .from("payments")
                .update({ status: "succeeded" })
                .eq("user_id", userId)
                .eq("reference_id", ctx.hash_pedido)
                .eq("method", "pagopar");
            }
          } else if (ctx.tipo === "plan" && ctx.plan_id) {
            // Get plan duration
            const { data: planRow } = await supabase
              .from("plans")
              .select("price,duration_days")
              .eq("id", ctx.plan_id)
              .maybeSingle<{ price: number; duration_days: number }>();

            if (planRow) {
              const now = new Date();
              const expires = new Date(now);
              expires.setDate(expires.getDate() + planRow.duration_days);

              // Cancel previous active subscriptions
              await supabase
                .from("subscriptions")
                .update({ status: "canceled" })
                .eq("user_id", userId)
                .eq("status", "active");

              const { data: newSub } = await supabase
                .from("subscriptions")
                .insert({
                  user_id:        userId,
                  plan:           ctx.plan_id,
                  started_at:     now.toISOString(),
                  expires_at:     expires.toISOString(),
                  status:         "active",
                  payment_method: "pagopar",
                })
                .select("id")
                .single<{ id: string }>();

              if (newSub) {
                await supabase.from("payments").update({ status: "succeeded", reference_id: newSub.id })
                  .eq("user_id", userId)
                  .eq("reference_id", ctx.hash_pedido)
                  .eq("method", "pagopar");
              }
            }
          }

          // Refresh auth so the user sees their new access immediately
          await refresh();
          clearPagoparContext();
        }
      } else {
        // Determine if pending or actually failed
        const isPending =
          typeof respuesta === "object" && respuesta !== null
            ? (respuesta as Record<string, unknown>).estado === "pendiente" ||
              (respuesta as Record<string, unknown>).pagado === false
            : true; // default to pending if we can't determine

        setStatus(isPending ? "pending" : "failed");
      }
    }

    verificar();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  return (
    <PublicLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant text-center space-y-5">

          {/* ── Checking ─────────────────────────────────────────────────── */}
          {status === "checking" && (
            <>
              <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <h1 className="font-serif text-2xl">Verificando tu pago…</h1>
              <p className="text-sm text-muted-foreground">
                Estamos consultando el estado con Pagopar. No cierres esta página.
              </p>
            </>
          )}

          {/* ── Success ──────────────────────────────────────────────────── */}
          {status === "success" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                <CheckCircle2 className="h-8 w-8 text-foreground" />
              </div>
              <h1 className="font-serif text-2xl">¡Pago confirmado!</h1>
              <p className="text-sm text-muted-foreground">
                Tu compra fue procesada exitosamente. Ya tenés acceso al contenido.
              </p>
              <div className="flex flex-col gap-2">
                {cursoSlug ? (
                  <Button variant="gold" asChild>
                    <Link to="/curso/$slug" params={{ slug: cursoSlug }}>
                      <ArrowRight className="h-4 w-4" /> Ir al curso
                    </Link>
                  </Button>
                ) : (
                  <Button variant="gold" asChild>
                    <Link to="/cursos"><ArrowRight className="h-4 w-4" /> Ver mis cursos</Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/"><Home className="h-4 w-4" /> Inicio</Link>
                </Button>
              </div>
            </>
          )}

          {/* ── Pending ──────────────────────────────────────────────────── */}
          {status === "pending" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="font-serif text-2xl">Pago pendiente</h1>
              <p className="text-sm text-muted-foreground">
                Tu pago aún no fue confirmado. Pagopar puede demorar unos minutos en procesar la transacción.
                Si ya pagaste, el acceso se activará automáticamente.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Volver a verificar
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/"><Home className="h-4 w-4" /> Volver al inicio</Link>
                </Button>
              </div>
            </>
          )}

          {/* ── Failed ───────────────────────────────────────────────────── */}
          {status === "failed" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="font-serif text-2xl">Pago rechazado</h1>
              <p className="text-sm text-muted-foreground">
                El pago no pudo completarse. Podés intentarlo nuevamente o contactarnos si creés que es un error.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="gold" asChild>
                  <Link to="/cursos">Volver a cursos</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/contacto">Contactar soporte</Link>
                </Button>
              </div>
            </>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {status === "error" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="font-serif text-2xl">Error de verificación</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" asChild>
                <Link to="/"><Home className="h-4 w-4" /> Volver al inicio</Link>
              </Button>
            </>
          )}

          {/* Hash reference (small, for support purposes) */}
          {hash && (
            <p className="text-[10px] text-muted-foreground/50 break-all">
              Ref: {hash}
            </p>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
