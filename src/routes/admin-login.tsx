import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import logoUrl from "@/assets/logo/logo.png";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Acceso administrador — Lucía Rojas Studio" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { isAuthenticated, isAdmin, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && !isAdmin) return <Navigate to="/panel" />;

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  return (
    /* ── dark wrapper: activa todos los tokens CSS del modo oscuro ── */
    <div className="dark">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">

        {/* ── Aura dorada de fondo ─────────────────────────────────── */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-gold opacity-[0.06] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-primary opacity-[0.08] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-primary opacity-[0.06] blur-3xl" />

        {/* ── Patrón de puntos sutil ───────────────────────────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* ── Card principal ───────────────────────────────────────── */}
        <div className="relative z-10 w-full max-w-sm">

          {/* Logo centrado */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative">
              {/* Halo dorado detrás del logo */}
              <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-full bg-gradient-gold opacity-20 blur-xl" />
              <img
                src={logoUrl}
                alt="Lucía Rojas Studio"
                className="h-20 w-auto drop-shadow-lg"
              />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Área privada
              </p>
              <h1 className="mt-1 font-serif text-2xl text-foreground">
                Panel de administración
              </h1>
            </div>
          </div>

          {/* Divider dorado */}
          <div aria-hidden className="mb-7 h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Formulario */}
          <div className="rounded-2xl border border-border/60 bg-card/80 p-7 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">

            {/* Icono + título dentro de la card */}
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <ShieldCheck className="h-4 w-4 text-foreground" strokeWidth={2} />
              </span>
              <div>
                <p className="text-xs font-medium text-foreground">Administrador</p>
                <p className="text-[11px] text-muted-foreground">Acceso restringido al equipo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="admin@luciarojasstudio.com"
                  className="flex h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="flex h-10 w-full rounded-lg border border-border bg-background/60 px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={busy}
                className="relative mt-1 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-gold font-medium text-sm text-foreground shadow-gold transition-all hover:opacity-90 disabled:opacity-60"
              >
                {/* Shimmer al hover */}
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 hover:translate-x-full" />
                {busy
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{checking ? "Verificando permisos…" : "Ingresando…"}</>
                  : <><ShieldCheck className="h-4 w-4" />Ingresar</>
                }
              </button>
            </form>

            {/* Sesión activa como otro usuario */}
            {user && !isAdmin && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border/50 bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
                <span>Sesión: <span className="text-foreground">{user.email}</span></span>
                <button onClick={logout} className="text-primary hover:underline">Salir</button>
              </div>
            )}
          </div>

          {/* Footer de la card */}
          <p className="mt-6 text-center text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">
            Lucía Rojas Studio · La sesión se mantiene activa por 8 horas
          </p>
        </div>
      </div>
    </div>
  );
}
