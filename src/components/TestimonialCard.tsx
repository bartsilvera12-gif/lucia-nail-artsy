import { Star } from "lucide-react";

interface Props { name: string; role: string; initials?: string; quote: string; result: string; }

// Genera iniciales del nombre completo: "Camila Fernández" → "CF"
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TestimonialCard({ name, role, initials, quote, result }: Props) {
  const initialsToShow = initials || getInitials(name);
  return (
    <figure className="flex h-full flex-col rounded-xl border border-border bg-card p-7 shadow-soft">
      <div className="flex items-center gap-1 text-primary">
        {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-current" />))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">“{quote}”</blockquote>
      <div className="mt-6 inline-flex items-center self-start rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground/80">{result}</div>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-serif text-sm">{initialsToShow}</div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}