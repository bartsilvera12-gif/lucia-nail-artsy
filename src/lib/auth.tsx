import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PlanId = "monthly" | "yearly" | "individual";

export interface AuthUser {
  email: string;
  name: string;
  plan: PlanId | null;
  individualCourses: string[];
  joinedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasMembership: boolean;
  hasAccessTo: (courseSlug: string, includedInMembership: boolean) => boolean;
  login: (email: string, name?: string) => void;
  register: (email: string, name: string, plan?: PlanId) => void;
  subscribe: (plan: PlanId) => void;
  purchaseCourse: (slug: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "lrs-auth-user";
const AuthContext = createContext<AuthContextValue | null>(null);

function read(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
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

  useEffect(() => {
    setUser(read());
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
      individualCourses: [],
      joinedAt: new Date().toISOString(),
    });
  }, [persist]);

  const register = useCallback((email: string, name: string, plan: PlanId = "monthly") => {
    persist({
      email,
      name,
      plan,
      individualCourses: [],
      joinedAt: new Date().toISOString(),
    });
  }, [persist]);

  const subscribe = useCallback((plan: PlanId) => {
    const u = read();
    if (!u) return;
    persist({ ...u, plan });
  }, [persist]);

  const purchaseCourse = useCallback((slug: string) => {
    const u = read();
    if (!u) return;
    if (u.individualCourses.includes(slug)) return;
    persist({ ...u, individualCourses: [...u.individualCourses, slug] });
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    hasMembership: !!user && (user.plan === "monthly" || user.plan === "yearly"),
    hasAccessTo: (slug, included) => {
      if (!user) return false;
      if (user.plan === "monthly" || user.plan === "yearly") return included;
      return user.individualCourses.includes(slug);
    },
    login,
    register,
    subscribe,
    purchaseCourse,
    logout,
  }), [user, login, register, subscribe, purchaseCourse, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
