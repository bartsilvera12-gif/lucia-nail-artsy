import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { useAuth } from "@/lib/auth";
import logoUrl from "@/assets/logo/logosinletras.png";
import hero2Img from "@/assets/hero2.png";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/cursos", label: "Cursos" },
  { to: "/comunidad", label: "Alumnos" },
  { to: "/planes", label: "Planes" },
  { to: "/sobre", label: "Sobre Lucía" },
  { to: "/faq", label: "FAQ" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="relative z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      {/* Decoración ilustrativa centrada en el nav */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
        <img
          src={hero2Img}
          alt=""
          className="absolute left-1/2 top-1/2 h-auto w-[75%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-40"
        />
      </div>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-16 lg:px-8">
        <Link to="/" className="flex items-center" aria-label={site.name}>
          <img src={logoUrl} alt={site.name} className="h-9 w-auto sm:h-11 lg:h-14" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold border-b-2 border-primary pb-0.5" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <Button variant="gold" size="sm" asChild>
              <Link to="/panel"><User className="h-4 w-4" /> {user?.name.split(" ")[0]}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Ingresar</Link>
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link to="/registro">Unirme ahora</Link>
              </Button>
            </>
          )}
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
                {isAuthenticated ? (
                  <Button variant="gold" asChild onClick={() => setOpen(false)}>
                    <Link to="/panel">Ir a mi panel</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outlineGold" asChild onClick={() => setOpen(false)}>
                      <Link to="/login">Ingresar</Link>
                    </Button>
                    <Button variant="gold" asChild onClick={() => setOpen(false)}>
                      <Link to="/registro">Unirme ahora</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
