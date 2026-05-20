import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

/**
 * Hero superior reutilizable para páginas internas.
 * Incluye decoración dorada, halos difusos y un patrón sutil de marca.
 */
export function PageHero({ eyebrow, title, description, icon, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream">
      {/* Halos dorados decorativos */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-gold opacity-15 blur-3xl" />

      {/* Patrón sutil de puntos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-14 lg:px-8">
        {icon !== undefined ? icon : <Sparkles className="mx-auto h-6 w-6 text-primary animate-float" />}

        {eyebrow && (
          <div className="mt-5 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
            <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
            <span>{eyebrow}</span>
            <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
          </div>
        )}

        <h1 className="mt-4 font-serif text-3xl leading-[1.1] text-balance sm:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>

      {/* Divisor dorado final */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />
    </section>
  );
}
