import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface LoginSearch {
  next?: string;
  email?: string;
}

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Ingresar — Lucía Rojas Studio" }] }),
  // Soporta ?next=/checkout/foo&email=alguien@example.com para que el flujo
  // de checkout pueda mandar a login y volver al mismo punto sin perder el
  // curso. next sólo se acepta como path interno (empieza con "/") para
  // evitar open redirect a dominios externos.
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    next:  typeof s.next  === "string" && s.next.startsWith("/")    ? s.next  : undefined,
    email: typeof s.email === "string" && s.email.includes("@")     ? s.email : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
            <h1 className="mt-6 font-serif text-2xl">Ingresá a tu cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">Accedé a tus cursos, espacio de alumnos y panel.</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                const { error } = await login(email, password);
                setLoading(false);
                if (error) { setError(error); return; }
                // Si vinimos desde un flujo que necesita volver a un destino
                // específico (ej: /checkout/:slug), respetar next. Sólo paths
                // internos pasaron la validación de validateSearch.
                if (search.next) {
                  window.location.href = search.next;
                  return;
                }
                navigate({ to: "/panel" });
              }}
            >
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="vos@email.com" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Contraseña</label>
                  <Link
                    to="/olvide-password"
                    className="text-xs text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
                </div>
              )}
              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              ¿No tenés cuenta? <Link to="/registro" className="text-primary underline">Crear cuenta</Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
