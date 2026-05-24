import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, type PlanId } from "@/lib/auth";
import { plans } from "@/data/site";
import { formatPYG } from "@/lib/format";

interface RegistroSearch {
  plan?: PlanId;
  next?: string;
}

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: "Crear cuenta — Lucía Rojas Studio" }] }),
  validateSearch: (search: Record<string, unknown>): RegistroSearch => ({
    plan: (search.plan as PlanId | undefined),
    next: (search.next as string | undefined),
  }),
  component: RegistroPage,
});

type PlanChoice = PlanId | "free";

function RegistroPage() {
  const { register, subscribe, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<PlanChoice>(search.plan ?? "free");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = plans.find((p) => p.id === plan);
  const isIndividualCheckout = !!search.next && !search.plan;

  // Usuario ya autenticado: pasamos directo al cobro o al panel
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      if (search.plan && search.plan !== "individual" && search.plan !== "free") {
        await subscribe(search.plan);
      }
      if (search.next) window.location.href = search.next;
      else navigate({ to: "/panel" });
    })();
  }, [isAuthenticated, search.plan, search.next, subscribe, navigate]);

  return (
    <PublicLayout>
      <section className="bg-gradient-cream py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg">Lucía Rojas Studio</span>
            </div>
            <h1 className="mt-6 font-serif text-3xl sm:text-4xl">
              {isIndividualCheckout ? "Creá tu cuenta para continuar" : "Unite a la academia"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isIndividualCheckout
                ? "Necesitás una cuenta para comprar cursos individuales y acceder a tus clases protegidas."
                : "Creá tu cuenta y empezá hoy mismo. Cancelás cuando quieras."}
            </p>

            <div className="mt-6 space-y-3" hidden={isIndividualCheckout}>
              {plans.filter((p) => p.id !== "individual").map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id as PlanId)}
                  className={"flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition-all " + (plan === p.id ? "border-primary bg-card shadow-elegant" : "border-border bg-card/60 hover:bg-card")}
                >
                  <div>
                    <p className="font-serif text-base">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl">{formatPYG(p.price)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.period}</p>
                  </div>
                </button>
              ))}
              {/* Opción sin pago */}
              <button
                type="button"
                onClick={() => setPlan("free")}
                className={"flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition-all " + (plan === "free" ? "border-primary bg-card shadow-elegant" : "border-border bg-card/60 hover:bg-card")}
              >
                <div>
                  <p className="font-serif text-base">Solo crear cuenta</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sin membresía. Explorá la plataforma y comprá cursos cuando quieras.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif text-xl">Gratis</p>
                </div>
              </button>
            </div>
          </div>

          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-elegant"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name || !email || !password) return;
              setError(null);
              setLoading(true);
              const { error: regError } = await register(email, name, password);
              if (regError) { setLoading(false); setError(regError); return; }
              if (plan !== "free" && plan !== "individual") {
                const { error: subError } = await subscribe(plan as Exclude<PlanId, "individual">);
                if (subError) { setLoading(false); setError(subError); return; }
              }
              setLoading(false);
              if (search.next) window.location.href = search.next;
              else navigate({ to: "/panel" });
            }}
          >
            <h2 className="font-serif text-xl">Crear tu cuenta</h2>
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
                <label className="text-xs text-muted-foreground">Contraseña (mínimo 6)</label>
                <Input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
            </div>

            {!isIndividualCheckout && (
              <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                {selectedPlan ? (
                  <>
                    <p className="font-medium">{selectedPlan.name} · {formatPYG(selectedPlan.price)}{selectedPlan.period}</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {selectedPlan.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> {f}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Sin membresía</p>
                    <p className="mt-1 text-xs text-muted-foreground">Podés suscribirte desde tu panel en cualquier momento.</p>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
              </div>
            )}

            <Button type="submit" variant="gold" className="mt-6 w-full" disabled={loading}>
              {loading ? "Procesando…" : isIndividualCheckout ? "Crear cuenta y continuar" : plan === "free" ? "Crear cuenta gratis" : "Crear cuenta y empezar"}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              ¿Ya sos alumna? <Link to="/login" className="text-primary underline">Ingresar</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
