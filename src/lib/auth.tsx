import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      // Caso especial: el email ya existe en `auth.users` (Supabase auth es
      // global por proyecto, asi que un admin de otro esquema en el mismo
      // proyecto Supabase aparece como "ya registrado" aunque no tenga
      // perfil en lucianails.profiles). Intentamos loguearla con el password
      // que ingreso:
      //  - si matchea => existia en auth pero no en profiles. Creamos el
      //    profile a mano (el trigger no corrio para esta usuaria porque no
      //    hubo signUp nuevo) y la dejamos adentro.
      //  - si no matchea => la cuenta es de otra persona o el password esta
      //    mal. Le pedimos que vaya a /login.
      const msg = (error.message || "").toLowerCase();
      const alreadyExists = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
      if (!alreadyExists) return { error: error.message };

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr || !signInData.session) {
        return { error: "Ya existe una cuenta con ese email. Iniciá sesión con tu contraseña." };
      }

      // Asegurar que exista la fila en lucianails.profiles. Si ya existe la
      // dejamos como esta (no pisamos nombre/rol de un admin existente).
      const userId = signInData.session.user.id;
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: userId,
          email,
          name,
          role: "student",
        });
      }
      await refresh();
      return {};
    }
    // Inicia sesión automáticamente si autoconfirm está activo
    await supabase.auth.signInWithPassword({ email, password });
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
