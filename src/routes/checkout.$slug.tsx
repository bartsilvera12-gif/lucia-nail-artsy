/**
 * checkout.$slug.tsx — Checkout unificado de cursos.
 *
 * Reemplaza el flujo de 3 pantallas (curso → registro → curso → modal Pagopar)
 * por una sola: el formulario crea cuenta (o usa la sesión activa) y arranca
 * Pagopar con el mismo helper que ya existe. NO toca server.mjs, /api/pagopar/*,
 * payments ni course_purchases. El comportamiento backend es idéntico al modal
 * viejo PagoparCheckout.tsx.
 *
 * Se activa con la env VITE_UNIFIED_CHECKOUT_ENABLED='true' desde el botón
 * "Realizar compra" en src/routes/curso.$slug.tsx. Con la env apagada esta
 * pantalla queda colgada de la URL /checkout/:slug pero ningún CTA la enlaza.
 */
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles, CreditCard, AlertCircle, Loader2, ExternalLink,
  AlertTriangle, Copy, Check, ArrowRight,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { useCourseBySlug, resolveCourseImage } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { pagoparIniciar, savePagoparContext, type PagoparContext } from "@/lib/pagopar";
import { formatPYG } from "@/lib/format";
import { detectInAppBrowser, hostLabel } from "@/lib/inAppBrowser";

// ── Schemas ──────────────────────────────────────────────────────────────────
const buyerFields = {
  apellido:            z.string().min(2, "Apellido requerido"),
  documento_identidad: z.string().min(4, "Documento requerido"),
  celular:             z.string().min(6, "Celular requerido"),
  ciudad:              z.string().min(2, "Ciudad requerida"),
  departamento:        z.string().min(2, "Departamento requerido"),
  direccion:           z.string().min(5, "Dirección requerida"),
};

const guestSchema = z.object({
  nombre:   z.string().min(2, "Nombre requerido"),
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  ...buyerFields,
});
type GuestData = z.infer<typeof guestSchema>;

const memberSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email:  z.string().email("Email inválido"),
  ...buyerFields,
});
type MemberData = z.infer<typeof memberSchema>;

interface CheckoutSearch { email?: string }

export const Route = createFileRoute("/checkout/$slug")({
  validateSearch: (s: Record<string, unknown>): CheckoutSearch => ({
    email: typeof s.email === "string" && s.email.includes("@") ? s.email : undefined,
  }),
  head: ({ params }) => ({ meta: [{ title: `Comprar ${params.slug} — Lucía Rojas Studio` }] }),
  component: CheckoutPage,
});

const DEPARTAMENTOS = [
  "Capital", "Central", "Alto Paraná", "Itapúa", "Caaguazú",
  "San Pedro", "Guairá", "Caazapá", "Misiones", "Paraguarí",
  "Cordillera", "Ñeembucú", "Amambay", "Canindeyú",
  "Presidente Hayes", "Boquerón", "Alto Paraguay",
];

function CheckoutPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, isAuthenticated, hasAccessTo, register: doRegister } = useAuth();
  const { data, isLoading } = useCourseBySlug(slug);

  const [apiError, setApiError]           = useState<string | null>(null);
  const [accountExistsEmail, setAccount]  = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [urlCopied, setUrlCopied]         = useState(false);
  const browser = useMemo(() => detectInAppBrowser(), []);

  // Defaults para usuaria logueada
  const [defaultFirst, ...rest] = (user?.name ?? "").split(" ");
  const defaultLast = rest.join(" ");

  // Dos formularios separados — sólo se renderiza uno según el estado de auth.
  // Los hooks corren siempre para respetar las reglas de hooks de React; el
  // formulario no usado simplemente queda inerte.
  const guestForm = useForm<GuestData>({
    resolver: zodResolver(guestSchema),
    defaultValues: { email: search.email ?? "" },
  });
  const memberForm = useForm<MemberData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nombre:   defaultFirst || "",
      apellido: defaultLast  || "",
      email:    user?.email  || "",
    },
  });

  // Si el usuario loguea recién entrando, refrescamos defaults del miembro
  useEffect(() => {
    if (isAuthenticated && user) {
      memberForm.reset({
        nombre:              defaultFirst || "",
        apellido:            defaultLast  || "",
        email:               user.email,
        documento_identidad: memberForm.getValues("documento_identidad") || "",
        celular:             memberForm.getValues("celular")             || "",
        ciudad:              memberForm.getValues("ciudad")               || "",
        departamento:        memberForm.getValues("departamento")         || "",
        direccion:           memberForm.getValues("direccion")            || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // ── Render guard rails ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando curso…</p>
        </div>
      </PublicLayout>
    );
  }
  if (!data) throw notFound();
  const { course } = data;

  const alreadyHasAccess = isAuthenticated && hasAccessTo(course.id, course.included_in_membership);
  if (alreadyHasAccess) {
    return (
      <PublicLayout>
        <section className="bg-gradient-cream py-16">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
              <h1 className="font-serif text-2xl">Ya tenés acceso</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta compra ya está activa en tu cuenta.
              </p>
              <Button variant="gold" className="mt-6 w-full" asChild>
                <Link to="/curso/$slug" params={{ slug: course.slug }}>
                  Ir al curso <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const heroImg = resolveCourseImage(course.image_path);
  const imagen_url = heroImg
    ? (/^https?:\/\//i.test(heroImg)
        ? heroImg
        : (typeof window !== "undefined"
            ? `${window.location.origin}${heroImg.startsWith("/") ? "" : "/"}${heroImg}`
            : undefined))
    : undefined;

  // ── Pagopar launcher (idéntico al modal viejo) ─────────────────────────────
  async function startPagopar(buyer: {
    nombre: string; apellido: string; documento_identidad: string;
    email: string; celular: string; ciudad: string;
    departamento: string; direccion: string;
  }) {
    const { data: sessionData } = await supabase.auth.getSession();
    const jwt    = sessionData.session?.access_token;
    const userId = sessionData.session?.user?.id;
    if (!jwt || !userId) {
      setApiError("Sesión expirada. Volvé a entrar e intentá de nuevo.");
      return;
    }

    const montoInt = Math.round(Number(course.price));
    const payload = {
      monto_pyg:   montoInt,
      descripcion: `${course.title} — Lucía Rojas Studio`,
      user_id:     userId,
      curso_id:    course.id,
      comprador:   buyer,
      productos: [{
        nombre:            course.title,
        cantidad:          1,
        precio_pyg:        montoInt,
        descripcion:       course.short_description || course.title,
        categoria_pagopar: "Cursos online",
        ...(imagen_url && { url_imagen: imagen_url }),
      }],
    };

    const { data: result, error } = await pagoparIniciar(payload, jwt);
    if (error || !result) {
      setApiError(error || "No se pudo crear el pedido en Pagopar.");
      return;
    }
    const hashOk =
      typeof result.hash_pedido === "string" &&
      result.hash_pedido.length > 4 &&
      result.hash_pedido !== "false" &&
      result.hash_pedido !== "null" &&
      result.hash_pedido !== "undefined";
    if (!hashOk || !result.url_pago?.includes("/pagos/")) {
      setApiError("No se pudo crear el pedido en Pagopar.");
      return;
    }
    const ctx: PagoparContext = {
      tipo:        "course",
      precio_pyg:  montoInt,
      hash_pedido: result.hash_pedido,
      curso_id:    course.id,
      curso_slug:  course.slug,
    };
    savePagoparContext(ctx);
    window.location.href = result.url_pago;
  }

  const onSubmitGuest = async (d: GuestData) => {
    setApiError(null); setAccount(null); setSubmitting(true);
    try {
      const { error } = await doRegister(d.email, d.nombre, d.password);
      if (error) {
        const lower = error.toLowerCase();
        const isAlreadyExists =
          lower.includes("ya existe") || lower.includes("already") || lower.includes("registered");
        if (isAlreadyExists) {
          setAccount(d.email);
          return;
        }
        setApiError(error);
        return;
      }
      await startPagopar({
        nombre:              d.nombre,
        apellido:            d.apellido,
        documento_identidad: d.documento_identidad,
        email:               d.email,
        celular:             d.celular,
        ciudad:              d.ciudad,
        departamento:        d.departamento,
        direccion:           d.direccion,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitMember = async (d: MemberData) => {
    setApiError(null); setSubmitting(true);
    try {
      await startPagopar({
        nombre:              d.nombre,
        apellido:            d.apellido,
        documento_identidad: d.documento_identidad,
        email:               d.email,
        celular:             d.celular,
        ciudad:              d.ciudad,
        departamento:        d.departamento,
        direccion:           d.direccion,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Form a renderizar según estado de auth ─────────────────────────────────
  const showGuest = !isAuthenticated;
  const f = showGuest ? guestForm : memberForm;
  const onSubmit = showGuest
    ? guestForm.handleSubmit(onSubmitGuest as (d: GuestData) => Promise<void>)
    : memberForm.handleSubmit(onSubmitMember as (d: MemberData) => Promise<void>);
  const errors = (f.formState.errors as Record<string, { message?: string } | undefined>);

  return (
    <PublicLayout>
      <section className="bg-gradient-cream py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">

          {/* ── Formulario ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant sm:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg">Lucía Rojas Studio</span>
            </div>
            <h1 className="mt-4 font-serif text-2xl sm:text-3xl">Finalizá tu compra</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {showGuest
                ? "Creá tu cuenta y completá los datos para el pago en un solo paso."
                : "Confirmá tus datos para continuar al checkout de Pagopar."}
            </p>

            {/* Aviso navegador in-app */}
            {browser.inApp && (
              <div className="mt-5 space-y-2 rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="space-y-1">
                    <p className="font-medium">Estás navegando desde {hostLabel(browser.host)}</p>
                    <p>
                      El checkout de Pagopar no funciona bien acá. Abrí esta página en{" "}
                      <b>{browser.platform === "ios" ? "Safari" : "Chrome"}</b> para poder pagar.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-400/60 bg-white hover:bg-amber-100/60"
                  onClick={async () => {
                    const href = typeof window !== "undefined" ? window.location.href : "";
                    try {
                      await navigator.clipboard.writeText(href);
                      setUrlCopied(true);
                      setTimeout(() => setUrlCopied(false), 2500);
                    } catch {
                      window.prompt("Copiá este link y pegalo en Chrome/Safari:", href);
                    }
                  }}
                >
                  {urlCopied
                    ? (<><Check className="h-4 w-4" /> Link copiado</>)
                    : (<><Copy className="h-4 w-4" /> Copiar link de esta página</>)}
                </Button>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-5">

              {showGuest && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Datos de cuenta
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nombre" error={errors.nombre?.message}>
                      <input {...f.register("nombre")} className={inputCls} placeholder="Lucía" />
                    </Field>
                    <Field label="Apellido" error={errors.apellido?.message}>
                      <input {...f.register("apellido")} className={inputCls} placeholder="Rojas" />
                    </Field>
                  </div>
                  <Field label="Email" error={errors.email?.message}>
                    <input {...f.register("email")} type="email" className={inputCls} placeholder="vos@email.com" />
                  </Field>
                  <Field label="Contraseña (mín. 6)" error={errors.password?.message}>
                    <input {...(guestForm.register("password"))} type="password" className={inputCls} placeholder="••••••••" />
                  </Field>
                </div>
              )}

              {!showGuest && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre" error={errors.nombre?.message}>
                    <input {...f.register("nombre")} className={inputCls} placeholder="Lucía" />
                  </Field>
                  <Field label="Apellido" error={errors.apellido?.message}>
                    <input {...f.register("apellido")} className={inputCls} placeholder="Rojas" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Email" error={errors.email?.message}>
                      <input {...f.register("email")} type="email" className={inputCls} placeholder="vos@email.com" />
                    </Field>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Datos para Pagopar
                </p>

                <Field label="Documento de identidad (CI / RUC)" error={errors.documento_identidad?.message}>
                  <input {...f.register("documento_identidad")} className={inputCls} placeholder="1234567" />
                </Field>

                <Field label="Celular" error={errors.celular?.message}>
                  <input {...f.register("celular")} className={inputCls} placeholder="0981 123 456" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ciudad" error={errors.ciudad?.message}>
                    <input {...f.register("ciudad")} className={inputCls} placeholder="Asunción" />
                  </Field>
                  <Field label="Departamento" error={errors.departamento?.message}>
                    <select {...f.register("departamento")} className={inputCls}>
                      <option value="">Seleccionar…</option>
                      {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Dirección" error={errors.direccion?.message}>
                  <input {...f.register("direccion")} className={inputCls} placeholder="Av. España 1234" />
                </Field>
              </div>

              {accountExistsEmail && (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-xs">
                  <p className="font-medium text-foreground">Esta cuenta ya existe.</p>
                  <p className="mt-1 text-muted-foreground">
                    Iniciá sesión para continuar la compra.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="gold" asChild>
                      <Link
                        to="/login"
                        search={{
                          next:  `/checkout/${course.slug}`,
                          email: accountExistsEmail,
                        }}
                      >
                        Iniciar sesión <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/olvide-password"
                        search={{ email: accountExistsEmail }}
                      >
                        Olvidé mi contraseña
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" /> {apiError}
                </div>
              )}

              <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
                {submitting
                  ? (<><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>)
                  : (<><ExternalLink className="h-4 w-4" /> Continuar a Pagopar</>)}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                Serás redirigido al checkout seguro de Pagopar. Tu pago es procesado por ellos,
                no por Lucía Rojas Studio.
              </p>

              {showGuest && (
                <p className="text-center text-xs text-muted-foreground">
                  ¿Ya tenés cuenta?{" "}
                  <Link
                    to="/login"
                    search={{ next: `/checkout/${course.slug}` }}
                    className="text-primary underline"
                  >
                    Iniciá sesión
                  </Link>
                </p>
              )}
            </form>
          </div>

          {/* ── Resumen ───────────────────────────────────────────────────── */}
          <aside className="self-start rounded-2xl border border-border bg-card p-5 shadow-soft">
            {heroImg && (
              <div className="overflow-hidden rounded-lg">
                <img src={heroImg} alt="" className="aspect-video w-full object-cover" />
              </div>
            )}
            <div className="mt-4 flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="text-xs uppercase tracking-wider text-primary">Tu compra</p>
            </div>
            <h2 className="mt-2 font-serif text-lg leading-tight">{course.title}</h2>
            {course.short_description && (
              <p className="mt-1 text-xs text-muted-foreground">{course.short_description}</p>
            )}
            <div className="mt-4 flex items-end gap-1">
              <span className="font-serif text-2xl tracking-tight">{formatPYG(Number(course.price))}</span>
              <span className="pb-0.5 text-xs text-muted-foreground">pago único</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Acceso inmediato
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Certificado al completar
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Soporte por WhatsApp
              </li>
            </ul>

            <Button variant="outline" className="mt-5 w-full" onClick={() => navigate({ to: "/curso/$slug", params: { slug: course.slug } })}>
              Volver al curso
            </Button>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
