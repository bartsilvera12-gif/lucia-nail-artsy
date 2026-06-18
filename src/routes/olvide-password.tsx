import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, AlertCircle, MailCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/olvide-password")({
  head: () => ({ meta: [{ title: "Recuperar contraseña — Lucía Rojas Studio" }] }),
  component: OlvidePasswordPage,
});

function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <PublicLayout>
      <section className="flex min-h-[70vh] items-center bg-gradient-cream py-16">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg">Lucía Rojas Studio</span>
            </div>

            {!sent ? (
              <>
                <h1 className="mt-6 font-serif text-2xl">Recuperar contraseña</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresá el email con el que te registraste y te enviamos un link para
                  crear una nueva contraseña.
                </p>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError(null);
                    setLoading(true);

                    // 1. Verificar rate limit (1 por dia por email).
                    const { data: rateData, error: rateErr } = await supabase.rpc(
                      "request_password_reset",
                      { p_email: email },
                    );

                    if (rateErr) {
                      setLoading(false);
                      setError("No pudimos procesar tu pedido. Intentá de nuevo en unos segundos.");
                      return;
                    }

                    // rateData es array porque la RPC devuelve TABLE.
                    const row = Array.isArray(rateData) ? rateData[0] : rateData;
                    if (!row?.allowed) {
                      setLoading(false);
                      const hs = row?.hours_remaining ?? 24;
                      setError(
                        `Ya pediste recuperar tu contraseña recientemente. ` +
                        `Podés volver a intentarlo en ${hs} ${hs === 1 ? "hora" : "horas"}.`,
                      );
                      return;
                    }

                    // 2. Disparar email de reset. resetPasswordForEmail es idempotente
                    //    y NO revela si el email existe — devuelve OK siempre.
                    const redirectTo =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/restablecer-password`
                        : undefined;

                    await supabase.auth.resetPasswordForEmail(email, { redirectTo });

                    setLoading(false);
                    setSent(true);
                  }}
                >
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                      placeholder="vos@email.com"
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}
                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    {loading ? "Enviando…" : "Enviar link de recuperación"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  ¿Recordaste tu contraseña?{" "}
                  <Link to="/login" className="text-primary underline">Iniciar sesión</Link>
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                  <MailCheck className="h-7 w-7 text-foreground" />
                </div>
                <h1 className="mt-5 font-serif text-2xl text-center">Revisá tu email</h1>
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  Si <span className="text-foreground">{email}</span> está registrado, te
                  enviamos un link para crear una nueva contraseña. Puede tardar unos
                  minutos en llegar — revisá también la carpeta de spam.
                </p>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to="/login">Volver al login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
