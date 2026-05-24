import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface RegistroSearch {
  next?: string;
}

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: "Crear cuenta — Lucía Rojas Studio" }] }),
  validateSearch: (search: Record<string, unknown>): RegistroSearch => ({
    next: (search.next as string | undefined),
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Usuario ya autenticado
  useEffect(() => {
    if (!isAuthenticated) return;
    if (search.next) window.location.href = search.next;
    else navigate({ to: "/panel" });
  }, [isAuthenticated, search.next, navigate]);

  return (
    <PublicLayout>
      <section className="bg-gradient-cream py-16 min-h-[80vh] flex items-center">
        <div className="mx-auto grid max-w-4xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 w-full">

          {/* Lado izquierdo — propuesta de valor */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg">Lucía Rojas Studio</span>
            </div>
            <h1 className="mt-6 font-serif text-3xl sm:text-4xl">
              {search.next ? "Creá tu cuenta para continuar" : "Empezá a aprender hoy"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {search.next
                ? "Necesitás una cuenta para comprar cursos y acceder a tu contenido."
                : "Creá tu cuenta gratis y accedé al catálogo de cursos online de uñas profesionales."}
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Acceso inmediato tras la compra",
                "Clases grabadas — aprendé a tu ritmo",
                "Certificado digital al completar",
                "Comunidad de alumnas incluida",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                    <Sparkles className="h-3 w-3 text-foreground" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Formulario */}
          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-elegant"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name || !email || !password) return;
              setError(null);
              setLoading(true);
              const { error: regError } = await register(email, name, password);
              if (regError) { setLoading(false); setError(regError); return; }
              setLoading(false);
              if (search.next) window.location.href = search.next;
              else navigate({ to: "/panel" });
            }}
          >
            <h2 className="font-serif text-xl">Crear tu cuenta</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sin tarjeta de crédito. Gratis.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nombre</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="vos@email.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Contraseña (mínimo 6 caracteres)</label>
                <Input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
              </div>
            )}

            <Button type="submit" variant="gold" className="mt-6 w-full" disabled={loading}>
              {loading ? "Creando cuenta…" : "Crear cuenta gratis"}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              ¿Ya tenés cuenta? <Link to="/login" className="text-primary underline">Iniciar sesión</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
