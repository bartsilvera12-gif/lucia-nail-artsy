import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Crea el profile en lucianails.profiles si no existe, o lo marca como
// 'lucianails' si ya estaba sin source. Lo llamamos desde register() para
// no depender del trigger global de auth.users (que mezclaba usuarios de
// otros proyectos del mismo Supabase compartido).
async function ensureLuciaProfile(userId: string, email: string, name: string) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, source")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      role: "student",
      source: "lucianails",
    });
    return;
  }
  if (!existing.source) {
    await supabase.from("profiles").update({ source: "lucianails" }).eq("id", userId);
  }
}

export type PlanId = "monthly" | "yearly" | "individual";
export type UserRole = "student" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: Exclude<PlanId, "individual"> | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  individualCourses: string[];
  joinedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasMembership: boolean;
  isMembershipExpired: boolean;
  daysUntilExpiry: number | null;
  hasAccessTo: (courseId: string, includedInMembership: boolean) => boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ error?: string }>;
  subscribe: (plan: Exclude<PlanId, "individual">) => Promise<{ error?: string }>;
  purchaseCourse: (courseId: string, price: number) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  joined_at: string;
}

interface SubscriptionRow {
  id: string;
  plan: "monthly" | "yearly";
  started_at: string;
  expires_at: string;
  status: "active" | "expired" | "canceled";
}

interface PurchaseRow {
  course_id: string;
}

async function loadUser(session: Session): Promise<AuthUser | null> {
  const userId = session.user.id;
  const [{ data: profile }, { data: sub }, { data: purchases }] = await Promise.all([
    supabase.from("profiles").select("id,email,name,role,joined_at").eq("id", userId).maybeSingle<ProfileRow>(),
    supabase
      .from("subscriptions")
      .select("id,plan,started_at,expires_at,status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle<SubscriptionRow>(),
    supabase.from("course_purchases").select("course_id").eq("user_id", userId),
  ]);

  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || profile.email.split("@")[0],
    role: profile.role,
    plan: sub?.plan ?? null,
    subscriptionStartedAt: sub?.started_at ?? null,
    subscriptionExpiresAt: sub?.expires_at ?? null,
    individualCourses: (purchases as PurchaseRow[] | null)?.map((p) => p.course_id) ?? [],
    joinedAt: profile.joined_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setUser(null); setLoading(false); return; }
    const u = await loadUser(data.session);
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) { setUser(null); return; }
      loadUser(session).then(setUser);
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  // re-render para reflejar vencimiento sin reload
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  void tick;

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, app: "lucianails" } },
    });

    // Caso 1: el email ya existia en auth.users (Supabase auth es global
    // por proyecto). Intentamos loguear con el password ingresado: si
    // matchea, es la misma persona registrandose otra vez con su mismo
    // password; si no, devolvemos error.
    if (error) {
      const msg = (error.message || "").toLowerCase();
      const alreadyExists = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
      if (!alreadyExists) return { error: error.message };

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr || !signInData.session) {
        return { error: "Ya existe una cuenta con ese email. Iniciá sesión con tu contraseña." };
      }
      await ensureLuciaProfile(signInData.session.user.id, email, name);
      await refresh();
      return {};
    }

    // Caso 2: signUp OK. Logueamos (necesario si autoconfirm esta off
    // tira sesion null, pero igual el siguiente login andara una vez
    // confirmen el email) y aseguramos el profile en Lucia.
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
    const userId = signInData?.session?.user.id ?? signUpData.user?.id;
    if (userId) await ensureLuciaProfile(userId, email, name);
    await refresh();
    return {};
  }, [refresh]);

  const subscribe = useCallback(async (plan: Exclude<PlanId, "individual">) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { error: "No autenticado" };

    // Toma la duración del plan
    const { data: planRow } = await supabase
      .from("plans")
      .select("price,duration_days")
      .eq("id", plan)
      .maybeSingle<{ price: number; duration_days: number }>();
    if (!planRow) return { error: "Plan no encontrado" };

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + planRow.duration_days);

    // Cancelar suscripciones activas previas
    await supabase
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("user_id", userId)
      .eq("status", "active");

    const { data: newSub, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan,
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
        status: "active",
        payment_method: "manual",
      })
      .select("id")
      .single<{ id: string }>();
    if (error) return { error: error.message };

    await supabase.from("payments").insert({
      user_id: userId,
      amount: planRow.price,
      type: "subscription",
      status: "succeeded",
      reference_id: newSub.id,
      method: "manual",
    });

    await refresh();
    return {};
  }, [refresh]);

  const purchaseCourse = useCallback(async (courseId: string, price: number) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { error: "No autenticado" };

    const { data: purchase, error } = await supabase
      .from("course_purchases")
      .insert({ user_id: userId, course_id: courseId, price_paid: price, payment_method: "manual" })
      .select("id")
      .single<{ id: string }>();
    if (error) return { error: error.message };

    await supabase.from("payments").insert({
      user_id: userId,
      amount: price,
      type: "course_purchase",
      status: "succeeded",
      reference_id: purchase.id,
      method: "manual",
    });

    await refresh();
    return {};
  }, [refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const now = Date.now();
    const expiresAt = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).getTime() : null;
    const hasMembership = !!user && !!user.plan && !!expiresAt && expiresAt > now;
    const isMembershipExpired = !!user && !!user.plan && !!expiresAt && expiresAt <= now;
    const daysUntilExpiry = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 86_400_000)) : null;

    return {
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      hasMembership,
      isMembershipExpired,
      daysUntilExpiry,
      hasAccessTo: (courseId, included) => {
        if (!user) return false;
        if (user.role === "admin") return true;
        if (hasMembership && included) return true;
        return user.individualCourses.includes(courseId);
      },
      login,
      register,
      subscribe,
      purchaseCourse,
      refresh,
      logout,
    };
  }, [user, loading, login, register, subscribe, purchaseCourse, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function formatExpiry(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
