import { createFileRoute, useNavigate, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Acceso administrador — Lucía Rojas Studio" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { isAuthenticated, isAdmin, loading, logout, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-cream text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && !isAdmin) return <Navigate to="/panel" />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-cream px-4 py-10">
      {/* Decoración */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al sitio
        </Link>

        <div className="rounded-2xl border border-border bg-card/95 p-8 shadow-elegant backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <Shield className="h-5 w-5 text-foreground" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lucía Rojas Studio</p>
              <h1 className="font-serif text-xl">Acceso administrador</h1>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Esta área es exclusiva del equipo de administración. Si sos alumna,{" "}
            <Link to="/login" className="text-primary hover:underline">ingresá por acá</Link>.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBusy(true);

              const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
              if (signErr) { setBusy(false); setError(signErr.message); return; }

              setChecking(true);
              const { data: sessionData } = await supabase.auth.getSession();
              const uid = sessionData.session?.user.id;
              if (!uid) { setBusy(false); setChecking(false); setError("No se pudo iniciar sesión"); return; }

              const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", uid)
                .maybeSingle<{ role: string }>();

              if (profile?.role !== "admin") {
                await supabase.auth.signOut();
                setBusy(false);
                setChecking(false);
                setError("Esta cuenta no tiene permisos de administrador.");
                return;
              }

              setBusy(false);
              setChecking(false);
              navigate({ to: "/admin" });
            }}
          >
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email administrador</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="admin@luciarojasstudio.com"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contraseña</label>
              <div className="relative mt-1.5">
                <input
                  required
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-1 pr-10 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gradient-gold font-medium text-foreground shadow-gold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {checking ? "Verificando permisos…" : busy ? "Ingresando…" : "Ingresar al panel"}
            </button>
          </form>

          {user && (
            <div className="mt-5 flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
              <span>Sesión activa como <span className="text-foreground">{user.email}</span></span>
              <button onClick={logout} className="text-primary hover:underline">Cerrar sesión</button>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Lucía Rojas Studio · Panel de administración
        </p>
      </div>
    </div>
  );
}
