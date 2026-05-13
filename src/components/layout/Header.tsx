import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/cursos", label: "Cursos" },
  { to: "/planes", label: "Planes" },
  { to: "/sobre", label: "Sobre Lucía" },
  { to: "/faq", label: "FAQ" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-serif text-xl tracking-tight">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Ingresar</Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link to="/registro">Unirme ahora</Link>
          </Button>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  activeProps={{ className: "text-foreground font-medium" }}
                  activeOptions={{ exact: link.to === "/" }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Button variant="outlineGold" asChild onClick={() => setOpen(false)}>
                  <Link to="/login">Ingresar</Link>
                </Button>
                <Button variant="gold" asChild onClick={() => setOpen(false)}>
                  <Link to="/registro">Unirme ahora</Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}