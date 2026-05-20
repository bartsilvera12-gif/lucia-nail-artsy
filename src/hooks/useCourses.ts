import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Resolución de imágenes locales: image_path se trata como un nombre
 * de archivo dentro de src/assets/. Si más adelante se sube a Storage,
 * la URL completa se devuelve tal cual.
 */
const courseImages = import.meta.glob("@/assets/course-*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function resolveCourseImage(imagePath: string | null | undefined): string | undefined {
  if (!imagePath) return undefined;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const match = Object.entries(courseImages).find(([k]) => k.endsWith("/" + imagePath));
  return match?.[1];
}

export interface CourseRow {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  category: "Principiante" | "Intermedio" | "Avanzado" | "Negocio" | "Nail Art";
  level: "Principiante" | "Intermedio" | "Avanzado" | "Negocio";
  image_path: string | null;
  price: number;
  duration: string;
  included_in_membership: boolean;
  status: "draft" | "available" | "coming_soon";
  learnings: string[];
  audience: string[];
  bonuses: string[];
  sort_order: number;
}

export interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  position: number;
}

export interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  description: string;
  position: number;
  duration_seconds: number;
  is_free_preview: boolean;
  video_path: string | null;
}

export function useCourses(opts: { includeDrafts?: boolean } = {}) {
  return useQuery({
    queryKey: ["courses", opts.includeDrafts ?? false],
    queryFn: async () => {
      let q = supabase.from("courses").select("*").order("sort_order");
      if (!opts.includeDrafts) q = q.neq("status", "draft");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CourseRow[];
    },
  });
}

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle<CourseRow>();
      if (error) throw error;
      if (!course) return null;

      const { data: modules } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", course.id)
        .order("position");

      const moduleIds = (modules ?? []).map((m) => m.id);
      const { data: lessons } = moduleIds.length
        ? await supabase
            .from("lessons")
            .select("*")
            .in("module_id", moduleIds)
            .order("position")
        : { data: [] as LessonRow[] };

      return {
        course,
        modules: (modules ?? []) as ModuleRow[],
        lessons: (lessons ?? []) as LessonRow[],
      };
    },
  });
}

export function useAllStudents() {
  return useQuery({
    queryKey: ["admin", "students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, profiles:user_id(name,email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, profiles:user_id(name,email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, author:author_id(name,email)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------- mutaciones admin ----------

export function useCourseUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: Partial<CourseRow> & { id?: string }) => {
      const payload = { ...course };
      const { data, error } = course.id
        ? await supabase.from("courses").update(payload).eq("id", course.id).select().single()
        : await supabase.from("courses").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["course"] });
    },
  });
}

export function useCourseDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useGrantSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { userId: string; plan: "monthly" | "yearly"; days: number; note?: string }) => {
      const now = new Date();
      const exp = new Date(now); exp.setDate(exp.getDate() + args.days);

      await supabase.from("subscriptions").update({ status: "canceled" })
        .eq("user_id", args.userId).eq("status", "active");

      const { data, error } = await supabase.from("subscriptions").insert({
        user_id: args.userId,
        plan: args.plan,
        started_at: now.toISOString(),
        expires_at: exp.toISOString(),
        status: "active",
        payment_method: "admin_grant",
        notes: args.note ?? null,
      }).select("id").single<{ id: string }>();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin", "students"] });
    },
  });
}

export function useRevokeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase.from("subscriptions")
        .update({ status: "canceled", expires_at: new Date().toISOString() })
        .eq("id", subscriptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin", "students"] });
    },
  });
}

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { userId: string; role: "student" | "admin" }) => {
      const { error } = await supabase.from("profiles").update({ role: args.role }).eq("id", args.userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "students"] }),
  });
}

export function usePostUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: { id?: string; author_id: string; title: string; body: string; category: "announcement" | "student_work" | "question" | "general"; pinned?: boolean }) => {
      const { data, error } = post.id
        ? await supabase.from("posts").update(post).eq("id", post.id).select().single()
        : await supabase.from("posts").insert(post).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function usePostDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

// ---------- módulos y lecciones (admin) ----------

export function useCourseStructure(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-structure", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data: modules, error: e1 } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId!)
        .order("position");
      if (e1) throw e1;

      const ids = (modules ?? []).map((m) => m.id);
      const { data: lessons, error: e2 } = ids.length
        ? await supabase.from("lessons").select("*").in("module_id", ids).order("position")
        : { data: [] as LessonRow[], error: null };
      if (e2) throw e2;

      return { modules: (modules ?? []) as ModuleRow[], lessons: (lessons ?? []) as LessonRow[] };
    },
  });
}

export function useModuleUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<ModuleRow> & { course_id: string; title: string }) => {
      const { data, error } = m.id
        ? await supabase.from("modules").update(m).eq("id", m.id).select().single()
        : await supabase.from("modules").insert(m).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["course-structure", vars.course_id] }),
  });
}

export function useModuleDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; courseId: string }) => {
      const { error } = await supabase.from("modules").delete().eq("id", args.id);
      if (error) throw error;
      return args;
    },
    onSuccess: (args) => qc.invalidateQueries({ queryKey: ["course-structure", args.courseId] }),
  });
}

export function useLessonUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (l: Partial<LessonRow> & { module_id: string; title: string; courseId: string }) => {
      const { courseId: _ignored, ...payload } = l;
      void _ignored;
      const { data, error } = l.id
        ? await supabase.from("lessons").update(payload).eq("id", l.id).select().single()
        : await supabase.from("lessons").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["course-structure", vars.courseId] }),
  });
}

export function useLessonDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; courseId: string; videoPath?: string | null }) => {
      if (args.videoPath) {
        await supabase.storage.from("course-videos").remove([args.videoPath]).catch(() => undefined);
      }
      const { error } = await supabase.from("lessons").delete().eq("id", args.id);
      if (error) throw error;
      return args;
    },
    onSuccess: (args) => qc.invalidateQueries({ queryKey: ["course-structure", args.courseId] }),
  });
}

/** Sube un archivo de video y devuelve la ruta dentro del bucket. */
export async function uploadLessonVideo(courseSlug: string, lessonId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${courseSlug}/${lessonId}.${ext}`;
  const { error } = await supabase.storage.from("course-videos").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

/** Genera una URL firmada para reproducir un video. (Storage legacy) */
export async function getLessonVideoSignedUrl(videoPath: string, expiresInSeconds = 7200): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("course-videos")
    .createSignedUrl(videoPath, expiresInSeconds);
  if (error) {
    console.error("signed url error", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Pide al backend un OTP de VdoCipher para reproducir una lección. */
export async function getVdoCipherOtp(lessonId: string): Promise<{ otp: string; playbackInfo: string } | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  const res = await fetch("/api/vdocipher-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lessonId }),
  });
  if (!res.ok) {
    console.error("vdocipher otp error", res.status, await res.text());
    return null;
  }
  return (await res.json()) as { otp: string; playbackInfo: string };
}
