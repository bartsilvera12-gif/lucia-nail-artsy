import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionStatus = "pending" | "answered" | "closed";

export interface QuestionAuthor {
  name: string;
  email: string;
}

export interface QuestionCourse {
  title: string;
}

export interface QuestionAnswer {
  id: string;
  question_id: string;
  teacher_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface StudentQuestion {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  body: string;
  status: QuestionStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author: QuestionAuthor | null;
  course: QuestionCourse | null;
  student_question_answers: QuestionAnswer[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 10;

export const STATUS_LABELS: Record<QuestionStatus | "all", string> = {
  all: "Todas",
  pending: "Pendiente",
  answered: "Respondida",
  closed: "Cerrada",
};

export const STATUS_COLORS: Record<QuestionStatus, { badge: string; dot: string }> = {
  pending:  { badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400" },
  answered: { badge: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  closed:   { badge: "bg-gray-100 text-gray-500  border-gray-200",   dot: "bg-gray-400" },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Listado paginado de preguntas con autor, curso y respuesta. */
export function useStudentQuestions({
  status,
  courseId,
  page = 0,
  enabled = true,
}: {
  status?: QuestionStatus | "all";
  courseId?: string;
  page?: number;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ["student_questions", { status, courseId, page }],
    enabled,
    queryFn: async () => {
      // 1) Cargar preguntas (con autor y curso embebidos)
      let q = supabase
        .from("student_questions")
        .select(
          `*,
          author:user_id(name, email),
          course:course_id(title),
          student_question_answers(id, body, teacher_id, created_at, updated_at)`,
          { count: "exact" }
        )
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (status && status !== "all") q = q.eq("status", status);
      if (courseId) q = q.eq("course_id", courseId);

      const { data, error, count } = await q;
      if (error) throw error;

      const questions = (data ?? []) as StudentQuestion[];

      // 2) Cargar respuestas con una query separada y SIEMPRE mergear.
      //    El embed PostgREST en schemas custom (lucianails) a veces no
      //    detecta el FK y devuelve [] silenciosamente. Usamos esta query
      //    como fuente de verdad — si existe la respuesta en DB, se ve.
      const questionIds = questions.map((q) => q.id);
      if (questionIds.length > 0) {
        const { data: answers, error: answersErr } = await supabase
          .from("student_question_answers")
          .select("id, question_id, body, teacher_id, created_at, updated_at")
          .in("question_id", questionIds);

        if (answersErr) {
          console.error("[student_questions] error cargando respuestas:", answersErr);
        }

        const byQuestion = new Map<string, QuestionAnswer[]>();
        for (const a of (answers ?? []) as (QuestionAnswer & { question_id: string })[]) {
          const arr = byQuestion.get(a.question_id) ?? [];
          arr.push(a);
          byQuestion.set(a.question_id, arr);
        }
        // SIEMPRE asignar (incluso si el embed trajo algo) — esta query es
        // la fuente confiable. Si no hay respuesta para una pregunta, queda [].
        for (const q of questions) {
          q.student_question_answers = byQuestion.get(q.id) ?? [];
        }
      }

      return { questions, count: count ?? 0 };
    },
  });
}

/** Cantidad de preguntas que el usuario actual envió en las últimas 24 hs. */
export function useMyQuestionsToday(enabled = true) {
  return useQuery({
    queryKey: ["my_questions_today"],
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("student_questions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Crear una nueva pregunta (solo alumnas con membresía activa). */
export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      title,
      body,
      courseId,
    }: {
      userId: string;
      title: string;
      body: string;
      courseId?: string;
    }) => {
      const { error } = await supabase.from("student_questions").insert({
        user_id: userId,
        title: title.trim(),
        body: body.trim(),
        course_id: courseId || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student_questions"] });
      qc.invalidateQueries({ queryKey: ["my_questions_today"] });
    },
  });
}

/** Responder una pregunta (upsert — solo admin). */
export function useAnswerQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      teacherId,
      body,
    }: {
      questionId: string;
      teacherId: string;
      body: string;
    }) => {
      // Upsert respuesta (UNIQUE en question_id)
      const { error: answerErr } = await supabase
        .from("student_question_answers")
        .upsert(
          { question_id: questionId, teacher_id: teacherId, body: body.trim() },
          { onConflict: "question_id" }
        );
      if (answerErr) throw answerErr;

      // Marcar pregunta como respondida
      const { error: statusErr } = await supabase
        .from("student_questions")
        .update({ status: "answered" })
        .eq("id", questionId);
      if (statusErr) throw statusErr;
    },
    onSuccess: async () => {
      // Invalidar + refetch inmediato para que la respuesta nueva se vea sin esperar
      await qc.invalidateQueries({ queryKey: ["student_questions"] });
      await qc.refetchQueries({ queryKey: ["student_questions"] });
    },
  });
}

/** Cambiar estado o is_featured de una pregunta (solo admin). */
export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      status,
      isFeatured,
    }: {
      questionId: string;
      status?: QuestionStatus;
      isFeatured?: boolean;
    }) => {
      const patch: Record<string, unknown> = {};
      if (status !== undefined) patch.status = status;
      if (isFeatured !== undefined) patch.is_featured = isFeatured;
      const { error } = await supabase
        .from("student_questions")
        .update(patch)
        .eq("id", questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student_questions"] });
    },
  });
}

/** Eliminar una pregunta (solo admin). */
export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from("student_questions")
        .delete()
        .eq("id", questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student_questions"] });
    },
  });
}
