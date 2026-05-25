import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, Star, Calendar, BookOpen, ArrowRight, CheckCircle2,
  Bell, Lock, Send, Loader2, MessageSquare, ChevronDown, ChevronUp,
  Star as StarIcon, X, AlertCircle, Pin, Sparkles,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { BrandSelect } from "@/components/BrandSelect";
import { useConfirm } from "@/components/ConfirmDialog";
import { AnimateIn } from "@/components/AnimateIn";
import { useAuth } from "@/lib/auth";
import { useCourses } from "@/hooks/useCourses";
import {
  useStudentQuestions,
  useMyQuestionsToday,
  useCreateQuestion,
  useAnswerQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  STATUS_LABELS,
  STATUS_COLORS,
  PAGE_SIZE,
  type StudentQuestion,
  type QuestionStatus,
} from "@/hooks/useStudentQuestions";
import aboutImg from "@/assets/about-studio.jpg";

export const Route = createFileRoute("/comunidad")({
  head: () => ({
    meta: [
      { title: "Espacio de Alumnas — Lucía Rojas Studio" },
      {
        name: "description",
        content:
          "Un espacio exclusivo para alumnas con membresía: consultá a la docente, recibí respuestas oficiales y acompañamiento real durante tu aprendizaje.",
      },
    ],
  }),
  component: EspacioAlumnasPage,
});

// ─── Page ──────────────────────────────────────────────────────────────────────

function EspacioAlumnasPage() {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const { data: courses = [] } = useCourses();

  const [statusFilter, setStatusFilter] = useState<QuestionStatus | "all">("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const canRead = isAuthenticated;
  const canPost = isAuthenticated;

  const { data: questionsData, isLoading: questionsLoading } = useStudentQuestions({
    status: statusFilter,
    courseId: courseFilter || undefined,
    page,
    enabled: canRead,
  });

  const { data: todayCount = 0 } = useMyQuestionsToday(canPost);

  const questions = questionsData?.questions ?? [];
  const totalCount = questionsData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleFilterChange = (s: QuestionStatus | "all") => {
    setStatusFilter(s);
    setPage(0);
  };

  return (
    <PublicLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream py-12">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />

        <AnimateIn direction="up" className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            {/* Banner image */}
            <div className="relative aspect-[16/6] w-full bg-gradient-gold">
              <img
                src={aboutImg}
                alt="Espacio de Alumnas"
                className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                    Acceso exclusivo · Alumnas activas
                  </p>
                  <h1 className="font-serif text-2xl sm:text-3xl">Espacio de Alumnas</h1>
                </div>
                <StatChip label="Alumnas" value="2.4k" />
              </div>
            </div>

            {/* Content + sidebar */}
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_300px] sm:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 2,431 alumnas</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> 4.9 / 5</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> 6 cursos</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Consultas semanales</span>
                </div>

                <h2 className="mt-5 font-serif text-2xl sm:text-3xl">
                  Consultas, acompañamiento y respuestas oficiales de la docente
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Este espacio es exclusivo para alumnas activas. Podés dejar tus consultas por escrito
                  y recibir una respuesta oficial de la docente. No es una red social — es un canal
                  directo de acompañamiento.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    "Preguntas solo en texto, sin archivos",
                    "Respuesta oficial de la docente",
                    "Máximo 3 consultas por día",
                    "Historial de preguntas respondidas",
                    "Filtro por estado y curso",
                    "Acompañamiento durante todo el proceso",
                  ].map((f) => (
                    <p key={f} className="inline-flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {f}
                    </p>
                  ))}
                </div>
              </div>

              {/* Sidebar card — adapts to auth state */}
              <HeroSidebar
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                loading={loading}
                userName={user?.name}
                todayCount={todayCount}
                onNewQuestion={() => setShowForm(true)}
              />
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ── Q&A System ───────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

          {/* Not authenticated */}
          {!isAuthenticated && !loading && <NonAuthBanner />}

          {/* Authenticated */}
          {isAuthenticated && (
            <>
              {/* New question form */}
              {canPost && showForm && (
                <AnimateIn direction="up">
                  <NewQuestionForm
                    userId={user!.id}
                    courses={courses}
                    todayCount={todayCount}
                    onSuccess={() => setShowForm(false)}
                    onCancel={() => setShowForm(false)}
                  />
                </AnimateIn>
              )}

              {/* No membership banner */}
              {!canPost && (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-primary/30 bg-secondary/40 p-5">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Iniciá sesión para participar en la comunidad.</p>
                  </div>
                  <Button variant="gold" size="sm" asChild>
                    <Link to="/login">Iniciar sesión</Link>
                  </Button>
                </div>
              )}

              {/* Filters */}
              <AnimateIn direction="up" delay={100}>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(["all", "pending", "answered", "closed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleFilterChange(s)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          statusFilter === s
                            ? "border-primary bg-gradient-gold text-foreground shadow-gold"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>

                  {courses.length > 0 && (
                    <BrandSelect
                      value={courseFilter}
                      onChange={(v) => { setCourseFilter(v); setPage(0); }}
                      placeholder="Todos los cursos"
                      className="w-56"
                      options={[
                        { value: "", label: "Todos los cursos" },
                        ...courses.map((c) => ({ value: c.id, label: c.title })),
                      ]}
                    />
                  )}

                  <span className="ml-auto text-xs text-muted-foreground">
                    {totalCount} consulta{totalCount !== 1 ? "s" : ""}
                  </span>

                  {canPost && !showForm && (
                    <Button variant="gold" size="sm" onClick={() => setShowForm(true)}>
                      <Send className="h-4 w-4" /> Nueva consulta
                    </Button>
                  )}
                </div>
              </AnimateIn>

              {/* List */}
              {questionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : questions.length === 0 ? (
                <EmptyState
                  statusFilter={statusFilter}
                  canPost={canPost}
                  onNewQuestion={() => setShowForm(true)}
                />
              ) : (
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <AnimateIn key={q.id} direction="up" delay={i * 50}>
                      <QuestionCard
                        question={q}
                        isAdmin={isAdmin}
                        currentUserId={user?.id}
                      />
                    </AnimateIn>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="outlineGold"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outlineGold"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── CTA final — solo para no autenticadas ────────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <GoldBadge><Sparkles className="h-3 w-3" /> Comunidad de alumnas</GoldBadge>
            <h2 className="mt-5 font-serif text-3xl sm:text-4xl">Unite al espacio de alumnas</h2>
            <p className="mt-4 text-base text-muted-foreground">
              Hacé preguntas, compartí tu progreso y recibí acompañamiento real de la docente.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/registro">Crear cuenta gratis <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outlineGold" size="xl" asChild>
                <Link to="/cursos">Ver cursos</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}

// ─── Hero sidebar ──────────────────────────────────────────────────────────────

function HeroSidebar({
  isAuthenticated, isAdmin, loading, userName, todayCount, onNewQuestion,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  userName?: string;
  todayCount: number;
  onNewQuestion: () => void;
}) {
  if (loading) {
    return (
      <aside className="rounded-xl border border-border bg-secondary/40 p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </aside>
    );
  }

  if (!isAuthenticated) {
    return (
      <aside className="rounded-xl border border-border bg-secondary/40 p-5">
        <p className="font-serif text-lg">Comunidad de alumnas</p>
        <p className="mt-1 text-xs text-muted-foreground">Iniciá sesión para participar en la comunidad.</p>
        <Button variant="gold" className="mt-5 w-full" asChild>
          <Link to="/login"><Lock className="h-4 w-4" /> Iniciar sesión</Link>
        </Button>
        <Button variant="ghost" className="mt-2 w-full" asChild>
          <Link to="/registro">Crear cuenta gratis</Link>
        </Button>
      </aside>
    );
  }

  const remaining = Math.max(0, 3 - todayCount);

  return (
    <aside className="rounded-xl border border-primary/40 bg-secondary/40 p-5">
      <GoldBadge><Sparkles className="h-3 w-3" /> {isAdmin ? "Docente / Admin" : "Alumna"}</GoldBadge>
      <p className="mt-3 font-serif text-lg">
        Bienvenida{userName ? `, ${userName.split(" ")[0]}` : ""}
      </p>
      {!isAdmin && (
        <p className="mt-1 text-xs text-muted-foreground">
          {remaining > 0
            ? `Podés enviar ${remaining} consulta${remaining !== 1 ? "s" : ""} más hoy.`
            : "Alcanzaste el límite de 3 consultas por día."}
        </p>
      )}
      {isAdmin && (
        <p className="mt-1 text-xs text-muted-foreground">
          Podés responder y gestionar todas las consultas.
        </p>
      )}
      <Button
        variant="gold"
        className="mt-5 w-full"
        onClick={onNewQuestion}
        disabled={!isAdmin && remaining === 0}
      >
        <Send className="h-4 w-4" /> Nueva consulta
      </Button>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Bell className="h-3.5 w-3.5" />
        Respondemos durante la semana
      </div>
    </aside>
  );
}

// ─── Non-auth banner ───────────────────────────────────────────────────────────

function NonAuthBanner() {
  return (
    <AnimateIn direction="up">
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h3 className="mt-5 font-serif text-xl">Contenido exclusivo para alumnas</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Iniciá sesión o creá tu cuenta gratuita para ver las consultas y enviar las tuyas.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="gold" asChild>
            <Link to="/login">Iniciar sesión <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button variant="outlineGold" asChild>
            <Link to="/registro">Crear cuenta gratis</Link>
          </Button>
        </div>
      </div>
    </AnimateIn>
  );
}

// ─── New question form ─────────────────────────────────────────────────────────

const MAX_TITLE = 120;
const MAX_BODY = 2000;

function NewQuestionForm({
  userId,
  courses,
  todayCount,
  onSuccess,
  onCancel,
}: {
  userId: string;
  courses: Array<{ id: string; title: string }>;
  todayCount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");

  const { mutateAsync, isPending } = useCreateQuestion();
  const remaining = Math.max(0, 3 - todayCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const t = title.trim();
    const b = body.trim();

    if (!t) return setError("El título no puede estar vacío.");
    if (t.length > MAX_TITLE) return setError(`El título supera los ${MAX_TITLE} caracteres.`);
    if (!b) return setError("La consulta no puede estar vacía.");
    if (b.length > MAX_BODY) return setError(`La consulta supera los ${MAX_BODY} caracteres.`);
    if (remaining === 0) return setError("Alcanzaste el límite de 3 consultas por día.");

    try {
      await mutateAsync({ userId, title: t, body: b, courseId: courseId || undefined });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar la consulta.";
      // RLS rate limit error
      if (msg.includes("row-level") || msg.includes("policy")) {
        setError("Alcanzaste el límite de 3 consultas diarias.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-2xl border border-primary/30 bg-card p-6 shadow-elegant"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">Nueva consulta</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {remaining > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Podés enviar {remaining} consulta{remaining !== 1 ? "s" : ""} más hoy.
          Solo texto — sin imágenes ni archivos.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Título de la consulta *</label>
            <span className={`text-[10px] ${title.length > MAX_TITLE ? "text-destructive" : "text-muted-foreground"}`}>
              {title.length}/{MAX_TITLE}
            </span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE + 10}
            placeholder="Ej: ¿Cómo evitar el levantamiento en el borde libre?"
            className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary/60"
            required
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Descripción detallada *</label>
            <span className={`text-[10px] ${body.length > MAX_BODY ? "text-destructive" : "text-muted-foreground"}`}>
              {body.length}/{MAX_BODY}
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_BODY + 20}
            rows={5}
            placeholder="Describí tu consulta con el mayor detalle posible. Contá qué técnica usás, qué producto, en qué etapa surge el problema..."
            className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground"
            required
          />
        </div>

        {/* Course selector */}
        {courses.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Curso relacionado (opcional)</label>
            <div className="mt-1">
              <BrandSelect
                value={courseId}
                onChange={(v) => setCourseId(v)}
                placeholder="Sin curso específico"
                options={[
                  { value: "", label: "Sin curso específico" },
                  ...courses.map((c) => ({ value: c.id, label: c.title })),
                ]}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="gold"
            size="sm"
            disabled={isPending || remaining === 0}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar consulta
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  isAdmin,
  currentUserId,
}: {
  question: StudentQuestion;
  isAdmin: boolean;
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const answer = question.student_question_answers?.[0];
  const isOwn = currentUserId === question.user_id;
  const colors = STATUS_COLORS[question.status];

  // Owner (no admin) puede borrar su propia consulta
  const { mutateAsync: deleteOwn, isPending: deletingOwn } = useDeleteQuestion();
  const canOwnerDelete = isOwn && !isAdmin;
  const { confirm, dialog: confirmDialog } = useConfirm();

  return (
    <div className={`rounded-xl border bg-card shadow-soft transition-shadow hover:shadow-elegant ${
      question.is_featured ? "border-primary/40" : "border-border"
    }`}>
      <div className="p-5">
        {/* Header row */}
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {question.is_featured && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Pin className="h-3 w-3" /> Destacada
                </span>
              )}
              <span>{question.author?.name ?? "Alumna"}</span>
              {question.course && (
                <>
                  <span>·</span>
                  <span className="text-primary">{question.course.title}</span>
                </>
              )}
              <span>·</span>
              <span>{new Date(question.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</span>
              {isOwn && <span className="rounded bg-secondary px-1.5 py-0.5">Tu consulta</span>}
            </div>
            <p className="mt-1.5 font-serif text-base">{question.title}</p>
          </div>

          {/* Status badge */}
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${colors.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
            {STATUS_LABELS[question.status]}
          </span>
        </div>

        {/* Body (expandable) */}
        <div className={`mt-3 text-sm text-muted-foreground ${!expanded ? "line-clamp-3" : ""}`}>
          {question.body}
        </div>
        {question.body.length > 200 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Ver menos</> : <><ChevronDown className="h-3 w-3" /> Ver completa</>}
          </button>
        )}

        {/* Official answer */}
        {answer ? (
          <div className="mt-4 rounded-lg border border-primary/30 bg-gradient-cream p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <MessageSquare className="h-3.5 w-3.5" /> Respuesta oficial de la docente
              <span className="ml-auto font-normal normal-case tracking-normal text-muted-foreground">
                {new Date(answer.updated_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{answer.body}</p>
          </div>
        ) : question.status === "answered" ? (
          <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-900">
            <p className="font-medium">⚠ Esta consulta está marcada como "Respondida" pero no tiene texto guardado.</p>
            {isAdmin ? (
              <p className="mt-1">Como admin: hacé click en <strong>Responder</strong> abajo, escribí la respuesta y guardá. Eso la hará visible para todas las alumnas.</p>
            ) : (
              <p className="mt-1">La docente todavía no escribió la respuesta oficial. Recargá la página en unos segundos.</p>
            )}
          </div>
        ) : null}

        {/* Admin controls */}
        {isAdmin && (
          <AdminControls
            question={question}
            answer={answer}
            showAnswerForm={showAnswerForm}
            onToggleAnswerForm={() => setShowAnswerForm((v) => !v)}
          />
        )}

        {/* Owner controls — alumna que cargó la consulta puede borrarla */}
        {canOwnerDelete && (
          <div className="mt-4 flex justify-end border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={deletingOwn}
              className="text-destructive hover:text-destructive"
              onClick={async () => {
                if (await confirm("¿Eliminar tu consulta? Esta acción no se puede deshacer.", { title: "Eliminar consulta", confirmLabel: "Eliminar" })) {
                  deleteOwn(question.id).catch((err: unknown) => {
                    alert(err instanceof Error ? err.message : "No se pudo eliminar la consulta.");
                  });
                }
              }}
            >
              {deletingOwn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Eliminar mi consulta
            </Button>
          </div>
        )}
        {confirmDialog}
      </div>
    </div>
  );
}

// ─── Admin controls ────────────────────────────────────────────────────────────

function AdminControls({
  question,
  answer,
  showAnswerForm,
  onToggleAnswerForm,
}: {
  question: StudentQuestion;
  answer?: StudentQuestion["student_question_answers"][0];
  showAnswerForm: boolean;
  onToggleAnswerForm: () => void;
}) {
  const [answerBody, setAnswerBody] = useState(answer?.body ?? "");
  const [answerError, setAnswerError] = useState("");

  const { mutateAsync: answerQ, isPending: answeringQ } = useAnswerQuestion();
  const { mutateAsync: updateQ, isPending: updatingQ } = useUpdateQuestion();
  const { mutateAsync: deleteQ, isPending: deletingQ } = useDeleteQuestion();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const { user } = useAuth();

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnswerError("");
    const b = answerBody.trim();
    if (!b) return setAnswerError("La respuesta no puede estar vacía.");
    if (b.length > 2000) return setAnswerError("Máximo 2000 caracteres.");
    try {
      await answerQ({ questionId: question.id, teacherId: user!.id, body: b });
      onToggleAnswerForm();
    } catch (err: unknown) {
      setAnswerError(err instanceof Error ? err.message : "Error al guardar la respuesta.");
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Admin:</span>

        <Button
          variant="outlineGold"
          size="sm"
          onClick={onToggleAnswerForm}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {answer ? "Editar respuesta" : "Responder"}
        </Button>

        {question.status !== "closed" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={updatingQ}
            onClick={() => updateQ({ questionId: question.id, status: "closed" })}
          >
            {updatingQ ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cerrar"}
          </Button>
        )}
        {question.status === "closed" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={updatingQ}
            onClick={() => updateQ({ questionId: question.id, status: "pending" })}
          >
            {updatingQ ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reabrir"}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={updatingQ}
          onClick={() => updateQ({ questionId: question.id, isFeatured: !question.is_featured })}
          title={question.is_featured ? "Quitar destacada" : "Marcar como destacada"}
        >
          <StarIcon className={`h-3.5 w-3.5 ${question.is_featured ? "fill-primary text-primary" : ""}`} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={deletingQ}
          className="ml-auto text-destructive hover:text-destructive"
          onClick={async () => {
            if (await confirm("¿Eliminar esta consulta? Esta acción no se puede deshacer.", { title: "Eliminar consulta", confirmLabel: "Eliminar" })) {
              deleteQ(question.id);
            }
          }}
        >
          {deletingQ ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        </Button>
        {confirmDialog}
      </div>

      {/* Answer form */}
      {showAnswerForm && (
        <form onSubmit={handleAnswer} className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                {answer ? "Editar respuesta oficial" : "Respuesta oficial de la docente"}
              </label>
              <span className={`text-[10px] ${answerBody.length > 2000 ? "text-destructive" : "text-muted-foreground"}`}>
                {answerBody.length}/2000
              </span>
            </div>
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows={4}
              maxLength={2020}
              placeholder="Escribí la respuesta oficial para esta consulta..."
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground"
            />
          </div>
          {answerError && (
            <p className="text-xs text-destructive">{answerError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onToggleAnswerForm}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={answeringQ}>
              {answeringQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {answer ? "Actualizar respuesta" : "Publicar respuesta"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  statusFilter,
  canPost,
  onNewQuestion,
}: {
  statusFilter: QuestionStatus | "all";
  canPost: boolean;
  onNewQuestion: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-4 font-serif text-lg">No hay consultas</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {statusFilter !== "all"
          ? `No hay consultas con estado "${STATUS_LABELS[statusFilter]}".`
          : "Todavía no hay consultas publicadas."}
      </p>
      {canPost && (
        <Button variant="gold" className="mt-5" onClick={onNewQuestion}>
          <Send className="h-4 w-4" /> Hacer la primera consulta
        </Button>
      )}
    </div>
  );
}

// ─── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/40 px-3 py-2 text-right backdrop-blur">
      <p className="font-serif text-xl leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/70">{label}</p>
    </div>
  );
}
