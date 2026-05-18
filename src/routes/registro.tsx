import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, type PlanId } from "@/lib/auth";
import { plans } from "@/data/site";

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

function RegistroPage() {
  const { register, subscribe, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<PlanId>(search.plan ?? "monthly");

  const selectedPlan = plans.find((p) => p.id === plan);
  const isIndividualCheckout = !!search.next && !search.plan;

  // Si ya está autenticado y vino con ?plan=X, simulamos el cobro y mandamos al panel.
  useEffect(() => {
    if (isAuthenticated && search.plan && search.plan !== "individual") {
      subscribe(search.plan);
      navigate({ to: "/panel" });
    } else if (isAuthenticated && search.next) {
      window.location.href = search.next;
    }
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
                    <p className="font-serif text-xl">USD {p.price}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.period}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-elegant"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name || !email) return;
              register(email, name);
              // Si vino con plan, simulamos cobro de la membresía
              if (search.plan && search.plan !== "individual") {
                subscribe(plan as Exclude<PlanId, "individual">);
              }
              if (search.next) {
                window.location.href = search.next;
              } else {
                navigate({ to: "/panel" });
              }
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
                <label className="text-xs text-muted-foreground">Contraseña</label>
                <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
            </div>

            {selectedPlan && !isIndividualCheckout && (
              <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                <p className="font-medium">{selectedPlan.name} · USD {selectedPlan.price}{selectedPlan.period}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {selectedPlan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> {f}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" variant="gold" className="mt-6 w-full">
              {isIndividualCheckout ? "Crear cuenta y continuar" : "Crear cuenta y pagar"}
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
