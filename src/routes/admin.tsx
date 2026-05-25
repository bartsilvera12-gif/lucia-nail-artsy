import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Users, CreditCard, MessageSquare, LogOut, Sparkles,
  Plus, Pencil, Trash2, Pin, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatPYG } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCourses, useCourseUpsert, useCourseDelete, useAllStudents,
  usePayments,
  useSetRole, usePosts, usePostUpsert, usePostDelete,
  useCourseStructure, useModuleUpsert, useModuleDelete,
  useLessonUpsert, useLessonDelete,
  resolveCourseImage, type CourseRow, type ModuleRow, type LessonRow,
} from "@/hooks/useCourses";
import { Video, Film, GripVertical, FolderPlus, FilePlus } from "lucide-react";
import logoUrl from "@/assets/logo/lucia_rojas_logo_transparente_web.webp";

type Tab = "dashboard" | "cursos" | "alumnas" | "pagos" | "comunidad";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Lucía Rojas Studio" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gradient-cream text-muted-foreground"><p>Cargando…</p></div>;
  }
  if (!user) return <Navigate to="/admin-login" />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-cream px-4 text-center">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="font-serif text-2xl">Acceso restringido</h1>
        <p className="max-w-md text-sm text-muted-foreground">Necesitás permisos de administrador para entrar a esta sección.</p>
        <div className="flex gap-2">
          <Button asChild variant="gold"><Link to="/panel">Volver a mi panel</Link></Button>
          <Button asChild variant="ghost" onClick={logout}><Link to="/admin-login">Cambiar de cuenta</Link></Button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; hint?: string }[] = [
    { id: "dashboard", label: "Resumen",   icon: LayoutDashboard, hint: "Vista general" },
    { id: "cursos",    label: "Cursos",    icon: BookOpen,        hint: "Catálogo y clases" },
    { id: "alumnas",   label: "Alumnas",   icon: Users,           hint: "Cuentas y accesos" },
    { id: "pagos",     label: "Pagos",     icon: CreditCard,      hint: "Transacciones" },
    { id: "comunidad", label: "Comunidad", icon: MessageSquare,   hint: "Posts y anuncios" },
  ];

  const currentTab = tabs.find((t) => t.id === tab);

  return (
    <div className="flex min-h-screen bg-secondary/40">
      {/* Sidebar claro */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold font-serif text-sm text-foreground shadow-gold">LR</span>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Panel</p>
            <p className="text-sm font-medium">Administración</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {tabs.map(({ id, label, icon: Icon, hint }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors " +
                  (active
                    ? "bg-gradient-gold text-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                }
              >
                <Icon className={"h-4 w-4 " + (active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{label}</span>
                {!active && hint && <span className="text-[10px] text-muted-foreground/60">{hint.split(" ")[0]}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-xs font-medium text-foreground shadow-gold">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-medium">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <Button size="sm" variant="ghost" asChild className="h-8 justify-center text-[11px]">
              <Link to="/panel">Mi panel</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={logout} className="h-8 justify-center text-[11px]">
              <LogOut className="h-3.5 w-3.5" /> Salir
            </Button>
          </div>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-gold font-serif text-sm text-foreground">LR</span>
            <select
              value={tab}
              onChange={(e) => setTab(e.target.value as Tab)}
              className="rounded-md border border-border bg-background px-3 py-1 text-sm"
            >
              {tabs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground">{currentTab?.label}</span>
            {currentTab?.hint && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>{currentTab.hint}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-secondary/40 p-6 text-foreground lg:p-10">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "cursos" && <CoursesTab />}
          {tab === "alumnas" && <StudentsTab />}
          {tab === "pagos" && <PaymentsTab />}
          {tab === "comunidad" && <CommunityTab />}
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Dashboard
// ============================================================
function DashboardTab() {
  const { data: courses = [] } = useCourses({ includeDrafts: true });
  const { data: students = [] } = useAllStudents();
  const { data: payments = [] } = usePayments();

  const revenue = payments.filter((p) => p.status === "succeeded").reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div>
      <h1 className="font-serif text-3xl">Resumen</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Cursos" value={courses.length} />
        <Stat label="Alumnas" value={students.length} />
        <Stat label="Ingresos totales" value={formatPYG(Math.round(revenue))} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card title="Últimos pagos">
          {payments.slice(0, 5).map((p) => {
            const prof = (p as { profiles?: { name?: string; email?: string } }).profiles;
            return (
              <div key={p.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
                <div>
                  <p className="font-medium">{prof?.name ?? prof?.email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Curso individual · {new Date(p.created_at).toLocaleString()}</p>
                </div>
                <span className="font-medium">{formatPYG(p.amount)}</span>
              </div>
            );
          })}
          {payments.length === 0 && <p className="text-sm text-muted-foreground">Sin pagos todavía.</p>}
        </Card>

        <Card title="Últimas altas">
          {students.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
              <div>
                <p className="font-medium">{s.name || s.email}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-muted-foreground">Sin alumnas registradas.</p>}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ============================================================
// Cursos
// ============================================================
function CoursesTab() {
  const { data: courses = [], isLoading } = useCourses({ includeDrafts: true });
  const upsert = useCourseUpsert();
  const del = useCourseDelete();
  const [editing, setEditing] = useState<Partial<CourseRow> | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Cursos</h1>
        <Button variant="gold" onClick={() => setEditing({ status: "draft", level: "Principiante", category: "Principiante", sort_order: 100 })}>
          <Plus className="h-4 w-4" /> Nuevo curso
        </Button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Cargando…</td></tr>}
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {resolveCourseImage(c.image_path) && <img src={resolveCourseImage(c.image_path)} alt="" className="h-10 w-14 rounded object-cover" />}
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground">{c.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{c.category}</td>
                <td className="px-4 py-3">{formatPYG(c.price)}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 text-[10px] " + (c.status === "available" ? "bg-primary/15 text-primary" : c.status === "draft" ? "bg-muted text-muted-foreground" : "bg-secondary")}>
                    {c.status === "available" ? "Publicado" : c.status === "draft" ? "Borrador" : "Próximo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`¿Borrar "${c.title}"?`)) del.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <CourseEditor
          course={editing}
          onClose={() => setEditing(null)}
          onSave={async (next) => {
            await upsert.mutateAsync(next);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CourseEditor({ course, onClose, onSave }: { course: Partial<CourseRow>; onClose: () => void; onSave: (c: Partial<CourseRow>) => void | Promise<void> }) {
  const [c, setC] = useState<Partial<CourseRow>>(course);
  const [tab, setTab] = useState<"data" | "curriculum">("data");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-elegant">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-serif text-xl">{course.id ? "Editar curso" : "Nuevo curso"}</h2>
            {course.title && <p className="text-xs text-muted-foreground">{course.title}</p>}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex gap-1 border-b border-border px-6">
          {([
            { id: "data", label: "Datos del curso" },
            { id: "curriculum", label: "Lecciones y videos" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              disabled={t.id === "curriculum" && !c.id}
              className={
                "border-b-2 px-3 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
                (tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "data" ? (
            <CourseDataForm c={c} setC={setC} />
          ) : (
            c.id && c.slug && <CurriculumEditor courseId={c.id} courseSlug={c.slug} />
          )}
        </div>

        {tab === "data" && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-xs text-muted-foreground">
              {course.id ? "Tip: guardá los datos y después abrí la pestaña Lecciones para subir videos." : "Guardá el curso para empezar a cargar módulos y videos."}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="gold" onClick={() => onSave(c)}>Guardar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseDataForm({ c, setC }: { c: Partial<CourseRow>; setC: (c: Partial<CourseRow>) => void }) {
  return (
    <div>
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug (url)">
            <Input value={c.slug ?? ""} onChange={(e) => setC({ ...c, slug: e.target.value })} />
          </Field>
          <Field label="Título">
            <Input value={c.title ?? ""} onChange={(e) => setC({ ...c, title: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <Select value={c.category ?? "Principiante"} onChange={(v) => setC({ ...c, category: v as CourseRow["category"] })} options={["Principiante", "Intermedio", "Avanzado", "Negocio", "Nail Art"]} />
          </Field>
          <Field label="Nivel">
            <Select value={c.level ?? "Principiante"} onChange={(v) => setC({ ...c, level: v as CourseRow["level"] })} options={["Principiante", "Intermedio", "Avanzado", "Negocio"]} />
          </Field>
          <Field label="Precio (Gs.)">
            <Input type="number" value={c.price ?? 0} onChange={(e) => setC({ ...c, price: Number(e.target.value) })} />
          </Field>
          <Field label="Duración (texto)">
            <Input value={c.duration ?? ""} onChange={(e) => setC({ ...c, duration: e.target.value })} placeholder="5h 40m" />
          </Field>
          <Field label="Imagen (nombre o URL)">
            <Input value={c.image_path ?? ""} onChange={(e) => setC({ ...c, image_path: e.target.value })} placeholder="course-acrilicas.jpg" />
          </Field>
          <Field label="Orden">
            <Input type="number" value={c.sort_order ?? 100} onChange={(e) => setC({ ...c, sort_order: Number(e.target.value) })} />
          </Field>
          <Field label="Estado">
            <Select value={c.status ?? "available"} onChange={(v) => setC({ ...c, status: v as CourseRow["status"] })} options={["draft", "available", "coming_soon"]} />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Descripción corta">
            <textarea value={c.short_description ?? ""} onChange={(e) => setC({ ...c, short_description: e.target.value })} rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          </Field>
          <Field label="Descripción completa">
            <textarea value={c.description ?? ""} onChange={(e) => setC({ ...c, description: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          </Field>
          <Field label="¿Qué vas a aprender? (uno por línea)">
            <textarea value={(c.learnings ?? []).join("\n")} onChange={(e) => setC({ ...c, learnings: e.target.value.split("\n").filter(Boolean) })} rows={4} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          </Field>
          <Field label="Para quién es (uno por línea)">
            <textarea value={(c.audience ?? []).join("\n")} onChange={(e) => setC({ ...c, audience: e.target.value.split("\n").filter(Boolean) })} rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          </Field>
          <Field label="Bonos (uno por línea)">
            <textarea value={(c.bonuses ?? []).join("\n")} onChange={(e) => setC({ ...c, bonuses: e.target.value.split("\n").filter(Boolean) })} rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Curriculum editor: módulos + lecciones + upload de video
// ============================================================
function CurriculumEditor({ courseId, courseSlug }: { courseId: string; courseSlug: string }) {
  const { data, isLoading } = useCourseStructure(courseId);
  const upsertMod = useModuleUpsert();
  const delMod = useModuleDelete();
  const upsertLes = useLessonUpsert();
  const delLes = useLessonDelete();

  const [newModule, setNewModule] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando estructura…</p>;
  const modules = data?.modules ?? [];
  const lessons = data?.lessons ?? [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-secondary/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FolderPlus className="h-4 w-4 text-primary" />
          <Input
            placeholder="Nuevo módulo (ej: Día 1 — Teoría)"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            className="flex-1 min-w-[200px] bg-white"
          />
          <Button
            variant="gold"
            size="sm"
            onClick={async () => {
              if (!newModule.trim()) return;
              await upsertMod.mutateAsync({
                course_id: courseId,
                title: newModule.trim(),
                position: (modules.at(-1)?.position ?? 0) + 1,
              });
              setNewModule("");
            }}
          >
            <Plus className="h-4 w-4" /> Agregar módulo
          </Button>
        </div>
      </div>

      {modules.length === 0 && (
        <p className="rounded-md border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
          Todavía no hay módulos. Creá el primero arriba.
        </p>
      )}

      {modules.map((m) => (
        <ModuleBlock
          key={m.id}
          module={m}
          lessons={lessons.filter((l) => l.module_id === m.id)}
          onRenameModule={(title) => upsertMod.mutate({ id: m.id, course_id: courseId, title })}
          onDeleteModule={() => { if (confirm(`¿Borrar módulo "${m.title}" y todas sus lecciones?`)) delMod.mutate({ id: m.id, courseId }); }}
          onAddLesson={(title) => upsertLes.mutate({
            module_id: m.id,
            courseId,
            title,
            description: "",
            position: 0,
            duration_seconds: 0,
            is_free_preview: false,
            video_path: null,
          })}
          onUpdateLesson={(l) => upsertLes.mutate({ ...l, courseId })}
          onDeleteLesson={(l) => { if (confirm(`¿Borrar lección "${l.title}"?`)) delLes.mutate({ id: l.id, courseId, videoPath: l.video_path }); }}
          courseSlug={courseSlug}
        />
      ))}
    </div>
  );
}

function ModuleBlock({
  module: mod, lessons, onRenameModule, onDeleteModule,
  onAddLesson, onUpdateLesson, onDeleteLesson, courseSlug,
}: {
  module: ModuleRow;
  lessons: LessonRow[];
  onRenameModule: (title: string) => void;
  onDeleteModule: () => void;
  onAddLesson: (title: string) => void;
  onUpdateLesson: (l: Partial<LessonRow> & { id: string; module_id: string; title: string }) => void;
  onDeleteLesson: (l: LessonRow) => void;
  courseSlug: string;
}) {
  const [title, setTitle] = useState(mod.title);
  const [newLesson, setNewLesson] = useState("");

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { if (title.trim() && title !== mod.title) onRenameModule(title.trim()); }}
          className="flex-1 border-transparent bg-transparent text-sm font-medium shadow-none focus:border-border"
        />
        <Button size="sm" variant="ghost" onClick={onDeleteModule}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>

      <div className="divide-y divide-border">
        {lessons.length === 0 && (
          <p className="px-4 py-3 text-xs text-muted-foreground">Sin lecciones todavía.</p>
        )}
        {lessons.map((l) => (
          <LessonRowItem
            key={l.id}
            lesson={l}
            courseSlug={courseSlug}
            onUpdate={(patch) => onUpdateLesson({ ...l, ...patch, module_id: mod.id })}
            onDelete={() => onDeleteLesson(l)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-secondary/60 px-4 py-3">
        <FilePlus className="h-4 w-4 text-primary" />
        <Input
          placeholder="Nueva lección…"
          value={newLesson}
          onChange={(e) => setNewLesson(e.target.value)}
          className="flex-1 bg-white"
        />
        <Button
          size="sm"
          variant="outlineGold"
          onClick={() => { if (newLesson.trim()) { onAddLesson(newLesson.trim()); setNewLesson(""); } }}
        >
          <Plus className="h-4 w-4" /> Lección
        </Button>
      </div>
    </div>
  );
}

function LessonRowItem({
  lesson, onUpdate, onDelete,
}: {
  lesson: LessonRow;
  courseSlug: string;
  onUpdate: (patch: Partial<LessonRow>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [editing, setEditing] = useState(false);
  const [videoId, setVideoId] = useState(lesson.video_path ?? "");

  const saveVideoId = () => {
    const v = videoId.trim();
    onUpdate({ video_path: v || null });
    setEditing(false);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { if (title.trim() && title !== lesson.title) onUpdate({ title: title.trim() }); }}
          className="flex-1 min-w-[180px] border-transparent bg-transparent text-sm shadow-none focus:border-border"
        />
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={lesson.is_free_preview}
            onChange={(e) => onUpdate({ is_free_preview: e.target.checked })}
          />
          Preview
        </label>

        {lesson.video_path ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700" title={lesson.video_path}>
            <Film className="h-3 w-3" /> VdoCipher · {lesson.video_path.slice(0, 16)}…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
            <Video className="h-3 w-3" /> Sin video
          </span>
        )}

        <Button size="sm" variant={lesson.video_path ? "ghost" : "outlineGold"} onClick={() => setEditing((v) => !v)}>
          <Video className="h-3.5 w-3.5" /> {lesson.video_path ? "Cambiar ID" : "Asignar video"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>

      {editing && (
        <div className="mt-2 space-y-2 rounded-md border border-border bg-secondary/40 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="VdoCipher Video ID (32 hex)"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="flex-1 min-w-[260px] bg-white font-mono text-xs"
            />
            <Button size="sm" variant="outlineGold" onClick={saveVideoId}>Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setVideoId(lesson.video_path ?? ""); }}>Cancelar</Button>
          </div>
          <a href="https://www.vdocipher.com/admin/videos" target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">
            Subir a VdoCipher ↗
          </a>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ============================================================
// Alumnas
// ============================================================
function StudentsTab() {
  const { data: students = [], isLoading } = useAllStudents();
  const setRole = useSetRole();
  const [q, setQ] = useState("");

  const filtered = students.filter((s) =>
    (s.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Alumnas</h1>
        <Input placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>
              <th className="px-4 py-3">Alumna</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Alta</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Cargando…</td></tr>}
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{s.name || s.email}</p>
                  <p className="text-[11px] text-muted-foreground">{s.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select value={s.role} onChange={(e) => setRole.mutate({ userId: s.id, role: e.target.value as "student" | "admin" })} className="rounded-md border border-input bg-transparent px-2 py-1 text-xs">
                    <option value="student">student</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Pagos
// ============================================================
function PaymentsTab() {
  const { data: payments = [], isLoading } = usePayments();
  const total = payments.filter((p) => p.status === "succeeded").reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Pagos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Histórico de cobros y reembolsos.</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-right shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total cobrado</p>
          <p className="font-serif text-2xl">{formatPYG(Math.round(total))}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Alumna</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Cargando…</td></tr>}
            {payments.map((p) => {
              const prof = (p as { profiles?: { name?: string; email?: string } }).profiles;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{prof?.name ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{prof?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">Curso individual</td>
                  <td className="px-4 py-3 text-xs">{p.method ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] " + (p.status === "succeeded" ? "bg-primary/15 text-primary" : p.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-secondary")}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatPYG(p.amount)}</td>
                </tr>
              );
            })}
            {!isLoading && payments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Sin pagos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Comunidad
// ============================================================
function CommunityTab() {
  const { user } = useAuth();
  const { data: posts = [], isLoading } = usePosts();
  const upsert = usePostUpsert();
  const del = usePostDelete();
  const [editing, setEditing] = useState<{ id?: string; title: string; body: string; category: "announcement" | "student_work" | "question" | "general"; pinned?: boolean } | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Comunidad</h1>
        <Button variant="gold" onClick={() => setEditing({ title: "", body: "", category: "announcement" })}>
          <Plus className="h-4 w-4" /> Nuevo post
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {posts.map((p) => {
          const author = (p as { author?: { name?: string; email?: string } }).author;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {p.pinned && <Pin className="h-3 w-3 text-primary" />}
                    <span className="uppercase tracking-wider text-primary">{p.category}</span>
                    <span>·</span>
                    <span>{author?.name ?? author?.email ?? "—"}</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 font-serif text-base">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ id: p.id, title: p.title, body: p.body, category: p.category, pinned: p.pinned })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("¿Borrar publicación?")) del.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          );
        })}
        {!isLoading && posts.length === 0 && <p className="text-sm text-muted-foreground">Sin publicaciones todavía.</p>}
      </div>

      {editing && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-elegant">
            <h2 className="font-serif text-xl">{editing.id ? "Editar" : "Nueva"} publicación</h2>
            <div className="mt-6 space-y-4">
              <Field label="Título">
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </Field>
              <Field label="Categoría">
                <Select value={editing.category} onChange={(v) => setEditing({ ...editing, category: v as typeof editing.category })} options={["announcement", "student_work", "question", "general"]} />
              </Field>
              <Field label="Contenido">
                <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={6} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </Field>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.pinned} onChange={(e) => setEditing({ ...editing, pinned: e.target.checked })} />
                Fijar al tope
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button variant="gold" onClick={async () => {
                await upsert.mutateAsync({ ...editing, author_id: user.id });
                setEditing(null);
              }}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
