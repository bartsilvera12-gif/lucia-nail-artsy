import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/restablecer-password")({
  head: () => ({ meta: [{ title: "Nueva contraseña — Lucía Rojas Studio" }] }),
  component: RestablecerPasswordPage,
});

/**
 * Pagina destino del link que Supabase manda por email.
 *
 * Flujo Supabase Auth: al hacer click en el link, Supabase pone el access_token
 * en el hash de la URL (#access_token=...&type=recovery) y dispara el evento
 * "PASSWORD_RECOVERY" en onAuthStateChange. A partir de ese momento hay una
 * sesion temporal valida solo para cambiar la password.
 *
 * Si la alumna llega aca SIN haber pasado por el email (link expirado, click
 * directo a la URL), el evento nunca se dispara y mostramos un mensaje.
 */
function RestablecerPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady]     = useState(false);   // ya recibimos el evento de recovery
  const [checking, setChecking] = useState(true);  // todavia escuchando por el evento
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si Supabase ya tiene una sesion (puede pasar si el SDK procesa el hash
    // antes de que se monte este componente), igual la tratamos como valida
    // — solo si el hash trae type=recovery.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecovery = hash.includes("type=recovery");

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    if (isRecovery) {
      setReady(true);
      setChecking(false);
    } else {
      // Damos un margen corto para que el SDK procese el hash y dispare el
      // evento. Si en 2s no pasa nada, asumimos que el link no es valido.
      const timer = window.setTimeout(() => setChecking(false), 2000);
      return () => {
        window.clearTimeout(timer);
        sub.subscription.unsubscribe();
      };
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  // Caso: el evento no llego (link invalido o expirado).
  if (!checking && !ready && !done) {
    return (
      <PublicLayout>
        <section className="flex min-h-[70vh] items-center bg-gradient-cream py-16">
          <div className="mx-auto w-full max-w-md px-4">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <h1 className="mt-5 font-serif text-2xl">Link inválido o expirado</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                El link de recuperación venció o ya fue usado. Pedí uno nuevo desde la
                pantalla de recuperar contraseña.
              </p>
              <div className="mt-6 space-y-2">
                <Button asChild variant="gold" className="w-full">
                  <Link to="/olvide-password">Pedir un nuevo link</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Volver al login</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

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
                <h1 className="mt-6 font-serif text-2xl">Nueva contraseña</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresá la contraseña que vas a usar para entrar a tu cuenta.
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
                    const { error: updErr } = await supabase.auth.updateUser({ password });
                    setLoading(false);

                    if (updErr) {
                      setError(updErr.message || "No pudimos actualizar la contraseña.");
                      return;
                    }
                    setDone(true);
                  }}
                >
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Nueva contraseña (mínimo 6 caracteres)
                    </label>
                    <Input
                      required
                      minLength={6}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Repetir contraseña</label>
                    <Input
                      required
                      minLength={6}
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="mt-1"
                      placeholder="••••••••"
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}
                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    {loading ? "Guardando…" : "Guardar nueva contraseña"}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                  <CheckCircle2 className="h-7 w-7 text-foreground" />
                </div>
                <h1 className="mt-5 font-serif text-2xl text-center">¡Listo!</h1>
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  Tu contraseña fue actualizada. Ya podés ingresar con la nueva.
                </p>
                <Button
                  variant="gold"
                  className="mt-6 w-full"
                  onClick={async () => {
                    // Cerrar la sesion temporal de recovery antes de ir a login.
                    await supabase.auth.signOut();
                    navigate({ to: "/login" });
                  }}
                >
                  Ir al login
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
