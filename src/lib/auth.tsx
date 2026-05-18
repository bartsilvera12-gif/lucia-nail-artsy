import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PlanId = "monthly" | "yearly" | "individual";

export interface AuthUser {
  email: string;
  name: string;
  plan: PlanId | null;
  /** ISO string del último pago de la membresía */
  subscriptionStartedAt: string | null;
  /** ISO string en el que vence la membresía actual */
  subscriptionExpiresAt: string | null;
  /** Slugs de cursos comprados individualmente (acceso permanente) */
  individualCourses: string[];
  joinedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasMembership: boolean;
  isMembershipExpired: boolean;
  daysUntilExpiry: number | null;
  hasAccessTo: (courseSlug: string, includedInMembership: boolean) => boolean;
  login: (email: string, name?: string) => void;
  register: (email: string, name: string) => void;
  subscribe: (plan: Exclude<PlanId, "individual">) => void;
  purchaseCourse: (slug: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "lrs-auth-user";
const AuthContext = createContext<AuthContextValue | null>(null);

const PLAN_DURATION_DAYS: Record<Exclude<PlanId, "individual">, number> = {
  monthly: 30,
  yearly: 365,
};

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function read(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    // Migración suave para usuarios viejos sin los nuevos campos
    return {
      email: parsed.email ?? "",
      name: parsed.name ?? "",
      plan: parsed.plan ?? null,
      subscriptionStartedAt: parsed.subscriptionStartedAt ?? null,
      subscriptionExpiresAt: parsed.subscriptionExpiresAt ?? null,
      individualCourses: parsed.individualCourses ?? [],
      joinedAt: parsed.joinedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function write(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    setUser(read());
  }, []);

  // Re-render cada minuto para reflejar vencimiento de membresía en vivo
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const persist = useCallback((next: AuthUser | null) => {
    write(next);
    setUser(next);
  }, []);

  const login = useCallback((email: string, name?: string) => {
    const existing = read();
    if (existing && existing.email === email) {
      persist(existing);
      return;
    }
    persist({
      email,
      name: name ?? email.split("@")[0],
      plan: null,
      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,
      individualCourses: [],
      joinedAt: new Date().toISOString(),
    });
  }, [persist]);

  const register = useCallback((email: string, name: string) => {
    // El registro NO activa la membresía. Recién se activa al pagar (subscribe / purchaseCourse).
    persist({
      email,
      name,
      plan: null,
      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,
      individualCourses: [],
      joinedAt: new Date().toISOString(),
    });
  }, [persist]);

  const subscribe = useCallback((plan: Exclude<PlanId, "individual">) => {
    const u = read();
    if (!u) return;
    const now = new Date().toISOString();
    persist({
      ...u,
      plan,
      subscriptionStartedAt: now,
      subscriptionExpiresAt: addDays(now, PLAN_DURATION_DAYS[plan]),
    });
  }, [persist]);

  const purchaseCourse = useCallback((slug: string) => {
    const u = read();
    if (!u) return;
    if (u.individualCourses.includes(slug)) return;
    persist({ ...u, individualCourses: [...u.individualCourses, slug] });
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthContextValue>(() => {
    const now = Date.now();
    const expiresAt = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).getTime() : null;
    const hasMembership =
      !!user &&
      (user.plan === "monthly" || user.plan === "yearly") &&
      !!expiresAt &&
      expiresAt > now;
    const isMembershipExpired =
      !!user &&
      (user.plan === "monthly" || user.plan === "yearly") &&
      !!expiresAt &&
      expiresAt <= now;
    const daysUntilExpiry = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 86_400_000)) : null;

    return {
      user,
      isAuthenticated: !!user,
      hasMembership,
      isMembershipExpired,
      daysUntilExpiry,
      hasAccessTo: (slug, included) => {
        if (!user) return false;
        if (hasMembership && included) return true;
        return user.individualCourses.includes(slug);
      },
      login,
      register,
      subscribe,
      purchaseCourse,
      logout,
    };
  }, [user, login, register, subscribe, purchaseCourse, logout]);

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
