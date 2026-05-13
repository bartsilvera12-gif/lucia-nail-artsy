import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
    <div className={"relative flex flex-col rounded-xl border p-8 transition-all " + (highlighted ? "border-primary bg-card shadow-elegant" : "border-border bg-card shadow-soft")}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground">{badge}</span>
      )}
      <h3 className="font-serif text-2xl">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex items-end gap-1">
        {individualPrice ? (
          <span className="font-serif text-4xl">USD 59</span>
        ) : (
          <>
            <span className="font-serif text-5xl">USD {price}</span>
            <span className="pb-2 text-sm text-muted-foreground">{period}</span>
          </>
        )}
      </div>
      <ul className="mt-8 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button variant={highlighted ? "gold" : "outlineGold"} className="w-full" asChild>
          <Link to={to}>{cta}</Link>
        </Button>
      </div>
    </div>
  );
}