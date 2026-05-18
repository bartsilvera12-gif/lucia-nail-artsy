import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Ingresar — Lucía Rojas Studio" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            <p className="mt-2 text-sm text-muted-foreground">Accedé a tus cursos, comunidad y panel.</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return;
                login(email);
                navigate({ to: "/panel" });
              }}
            >
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="vos@email.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Contraseña</label>
                <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
              <Button type="submit" variant="gold" className="w-full">Ingresar</Button>
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
