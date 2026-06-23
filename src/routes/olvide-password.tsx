import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
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

            {!done ? (
              <>
                <h1 className="mt-6 font-serif text-2xl">Cambiar contraseña</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresá tu email y elegí una contraseña nueva. Por seguridad solo podés
                  hacerlo una vez por día.
                </p>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError(null);

                    if (password.length < 6) {
                      setError("La contraseña debe tener al menos 6 caracteres.");
                      return;
                    }
                    if (password !== confirm) {
                      setError("Las contraseñas no coinciden.");
                      return;
                    }

                    setLoading(true);
                    const { data, error: rpcErr } = await supabase.rpc("self_reset_password", {
                      p_email: email,
                      p_new_password: password,
                    });
                    setLoading(false);

                    if (rpcErr) {
                      setError("No pudimos procesar tu pedido. Intentá de nuevo en unos segundos.");
                      return;
                    }

                    const row = data as { ok: boolean; reason?: string; hours_remaining?: number } | null;
                    if (!row?.ok) {
                      if (row?.reason === "rate_limited") {
                        const hs = row.hours_remaining ?? 24;
                        setError(
                          `Ya cambiaste tu contraseña recientemente. Podés volver a intentarlo en ${hs} ${hs === 1 ? "hora" : "horas"}.`,
                        );
                      } else if (row?.reason === "password_too_short") {
                        setError("La contraseña debe tener al menos 6 caracteres.");
                      } else if (row?.reason === "invalid_email") {
                        setError("Email inválido.");
                      } else {
                        setError("No pudimos cambiar tu contraseña. Probá de nuevo.");
                      }
                      return;
                    }

                    setDone(true);
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
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Nueva contraseña</label>
                    <div className="relative mt-1">
                      <Input
                        required
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Confirmar contraseña</label>
                    <Input
                      required
                      type={showPwd ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      minLength={6}
                      className="mt-1"
                      placeholder="Repetí la contraseña"
                      autoComplete="new-password"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    {loading ? "Cambiando…" : "Cambiar contraseña"}
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
                  <CheckCircle2 className="h-7 w-7 text-foreground" />
                </div>
                <h1 className="mt-5 font-serif text-2xl text-center">Contraseña cambiada</h1>
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  Si <span className="text-foreground">{email}</span> está registrado, ya
                  podés iniciar sesión con la nueva contraseña.
                </p>
                <Button asChild variant="gold" className="mt-6 w-full">
                  <Link to="/login">Ir a iniciar sesión</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
