import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Crown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldBadge } from "@/components/Badge";

interface PaywallProps {
  courseSlug: string;
  courseTitle: string;
  price: number;
  includedInMembership: boolean;
  authenticated: boolean;
}

export function Paywall({ courseSlug, courseTitle, price, includedInMembership, authenticated }: PaywallProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-gradient-cream">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold shadow-elegant">
          <Lock className="h-6 w-6 text-foreground" />
        </div>
        <GoldBadge className="mt-4"><Sparkles className="h-3 w-3" /> Contenido exclusivo</GoldBadge>
        <h3 className="mt-4 font-serif text-xl sm:text-2xl">Esta clase es solo para alumnas</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Suscribite a la academia o comprá el curso <span className="font-medium text-foreground">{courseTitle}</span> para acceder a todas las clases.
        </p>

        <ul className="mt-5 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {["Acceso inmediato", "Comunidad privada", "Certificado al completar", "Bonos descargables"].map((b) => (
            <li key={b} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {includedInMembership && (
            <Button variant="hero" asChild>
              <Link to="/planes"><Crown className="h-4 w-4" /> Unirme a la membresía</Link>
            </Button>
          )}
          <Button variant="outlineGold" asChild>
            <Link to="/curso/$slug" params={{ slug: courseSlug }} hash="comprar">
              Comprar curso ${price}
            </Link>
          </Button>
          {!authenticated && (
            <Button variant="ghost" asChild>
              <Link to="/login">Ya soy alumna</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
