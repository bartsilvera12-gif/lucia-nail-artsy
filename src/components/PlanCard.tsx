import { Link } from "@tanstack/react-router";
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PlanCardProps {
  name: string;
  price: number;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  individualPrice?: boolean;
  to?: string;
}

export function PlanCard({ name, price, period, description, features, cta, highlighted, badge, individualPrice, to = "/registro" }: PlanCardProps) {
  return (
    <div
      className={
        "group relative flex h-full flex-col rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 " +
        (highlighted
          ? "border-2 border-primary/60 bg-card shadow-elegant ring-1 ring-primary/20 lg:scale-[1.04]"
          : "border border-border bg-card shadow-soft hover:shadow-elegant hover:border-primary/30")
      }
    >
      {/* halo dorado decorativo (con clip interno propio para no tapar el badge) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className={
            "absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-gold blur-3xl transition-opacity duration-500 " +
            (highlighted ? "opacity-60" : "opacity-0 group-hover:opacity-40")
          }
        />
      </div>
      {/* gradiente sutil al fondo si destacado */}
      {highlighted && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent" />
      )}

      {badge && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-gold px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground shadow-gold">
          <Sparkles className="h-3 w-3" /> {badge}
        </span>
      )}

      <div className="relative flex items-center gap-3">
        {highlighted ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
            <Crown className="h-5 w-5 text-foreground" />
          </span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
        )}
        <h3 className="font-serif text-2xl">{name}</h3>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{description}</p>

      <div className="mt-6 flex items-end gap-1">
        {individualPrice ? (
          <>
            <span className="text-sm text-muted-foreground pb-1">desde</span>
            <span className="font-serif text-5xl tracking-tight">USD 59</span>
          </>
        ) : (
          <>
            <span className="font-serif text-5xl tracking-tight">USD {price}</span>
            <span className="pb-2 text-sm text-muted-foreground">{period}</span>
          </>
        )}
      </div>

      {/* divisor dorado fino */}
      <div aria-hidden className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span className={"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full " + (highlighted ? "bg-gradient-gold" : "bg-primary/15")}>
              <Check className={"h-3 w-3 " + (highlighted ? "text-foreground" : "text-primary")} strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-2">
        <Button variant={highlighted ? "hero" : "outlineGold"} size={highlighted ? "xl" : "default"} className="group/btn w-full" asChild>
          <Link to={to}>
            {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
