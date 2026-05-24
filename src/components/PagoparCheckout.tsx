/**
 * PagoparCheckout.tsx
 * Dialog that collects buyer info and initiates a Pagopar payment.
 * Isolated to Lucía Rojas Studio — does not affect any other payment flow.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { pagoparIniciar, savePagoparContext, type PagoparContext } from "@/lib/pagopar";
import { formatPYG } from "@/lib/format";

// ── Form schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  nombre:               z.string().min(2, "Nombre requerido"),
  apellido:             z.string().min(2, "Apellido requerido"),
  documento_identidad:  z.string().min(4, "Documento requerido"),
  email:                z.string().email("Email inválido"),
  celular:              z.string().min(6, "Celular requerido"),
  ciudad:               z.string().min(2, "Ciudad requerida"),
  departamento:         z.string().min(2, "Departamento requerido"),
  direccion:            z.string().min(5, "Dirección requerida"),
});
type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  /** Course or plan being purchased */
  item: {
    tipo: "course" | "plan";
    id: string;
    slug?: string;
    nombre: string;
    descripcion: string;
    precio_pyg: number;    // monto en Guaraníes, entero, sin conversión
    imagen_url?: string;
  };
  /** Pre-filled from auth context */
  defaultEmail?: string;
  defaultNombre?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PagoparCheckout({ open, onClose, item, defaultEmail, defaultNombre }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pre-fill nombre/apellido from user's display name
  const [defaultFirst, ...rest] = (defaultNombre || "").split(" ");
  const defaultLast = rest.join(" ");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email:    defaultEmail || "",
      nombre:   defaultFirst || "",
      apellido: defaultLast  || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setApiError(null);

    // Get Supabase JWT (required for server-side auth)
    const { data: sessionData } = await supabase.auth.getSession();
    const jwt = sessionData.session?.access_token;
    const userId = sessionData.session?.user?.id;

    if (!jwt || !userId) {
      setApiError("Sesión expirada. Por favor iniciá sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    const payload = {
      monto_pyg:   Math.round(item.precio_pyg), // PYG exacto, sin conversión
      descripcion: `${item.nombre} — Lucía Rojas Studio`,
      user_id:     userId,
      ...(item.tipo === "course" && { curso_id: item.id }),
      ...(item.tipo === "plan"   && { plan_id:  item.id }),
      comprador: {
        nombre:              data.nombre,
        apellido:            data.apellido,
        documento_identidad: data.documento_identidad,
        email:               data.email,
        celular:             data.celular,
        ciudad:              data.ciudad,
        departamento:        data.departamento,
        direccion:           data.direccion,
      },
      productos: [
        {
          nombre:            item.nombre,
          cantidad:          1,
          precio_pyg:        Math.round(item.precio_pyg), // PYG exacto
          descripcion:       item.descripcion,
          categoria_pagopar: "Cursos online",
          ...(item.imagen_url && { url_imagen: item.imagen_url }),
        },
      ],
    };

    const { data: result, error } = await pagoparIniciar(payload, jwt);

    if (error || !result) {
      setApiError(error || "Error iniciando el pago");
      setIsLoading(false);
      return;
    }

    // Save context so the result page knows what to grant access to
    const ctx: PagoparContext = {
      tipo:        item.tipo,
      precio_pyg:  item.precio_pyg,
      hash_pedido: result.hash_pedido,
      ...(item.tipo === "course" && { curso_id: item.id, curso_slug: item.slug }),
      ...(item.tipo === "plan"   && { plan_id: item.id }),
    };
    savePagoparContext(ctx);

    // Redirect to Pagopar checkout (same tab)
    window.location.href = result.url_pago;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <CreditCard className="h-5 w-5 text-primary" />
            Pagar con Pagopar
          </DialogTitle>
          <DialogDescription>
            Completá tus datos para continuar al checkout seguro de Pagopar.
          </DialogDescription>
        </DialogHeader>

        {/* Item summary */}
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="font-medium">{item.nombre}</p>
          <p className="text-muted-foreground">{formatPYG(item.precio_pyg)} — pago único</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" error={errors.nombre?.message}>
              <input {...register("nombre")} className={inputCls} placeholder="Lucía" />
            </Field>
            <Field label="Apellido" error={errors.apellido?.message}>
              <input {...register("apellido")} className={inputCls} placeholder="Rojas" />
            </Field>
          </div>

          <Field label="Documento de identidad (CI / RUC)" error={errors.documento_identidad?.message}>
            <input {...register("documento_identidad")} className={inputCls} placeholder="1234567" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputCls} placeholder="hola@ejemplo.com" />
          </Field>

          <Field label="Celular" error={errors.celular?.message}>
            <input {...register("celular")} className={inputCls} placeholder="0981 123 456" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" error={errors.ciudad?.message}>
              <input {...register("ciudad")} className={inputCls} placeholder="Asunción" />
            </Field>
            <Field label="Departamento" error={errors.departamento?.message}>
              <select {...register("departamento")} className={inputCls}>
                <option value="">Seleccionar…</option>
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Dirección" error={errors.direccion?.message}>
            <input {...register("direccion")} className={inputCls} placeholder="Av. España 1234" />
          </Field>

          {apiError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
              ) : (
                <><ExternalLink className="h-4 w-4" /> Ir a Pagopar</>
              )}
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Serás redirigido al checkout seguro de Pagopar. Tu pago es procesado por ellos, no por Lucía Rojas Studio.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const DEPARTAMENTOS = [
  "Capital", "Central", "Alto Paraná", "Itapúa", "Caaguazú",
  "San Pedro", "Guairá", "Caazapá", "Misiones", "Paraguarí",
  "Cordillera", "Ñeembucú", "Amambay", "Canindeyú",
  "Presidente Hayes", "Boquerón", "Alto Paraguay",
];
