import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { site } from "@/data/site";
import logoUrl from "@/assets/logo/logo.png";
import esmalteUrl from "@/assets/esmalte2.png";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-[var(--beige)]">
      {/* Esmalte decorativo abajo a la derecha — posicionado absoluto para no
          afectar la altura del footer. pointer-events-none para no estorbar
          el botón scroll-to-top que vive en la misma esquina. */}
      <img
        src={esmalteUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-40 w-auto select-none opacity-90 sm:h-52 lg:h-64"
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Logo + tagline */}
          <div>
            <Link to="/" aria-label={site.name}>
              <img src={logoUrl} alt={site.name} className="h-28 w-auto" />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">Academia online premium para profesionales de las uñas.</p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Plataforma</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/cursos" className="hover:text-primary transition-colors">Cursos</Link></li>
              <li><Link to="/planes" className="hover:text-primary transition-colors">Planes</Link></li>
              <li><Link to="/sobre" className="hover:text-primary transition-colors">Sobre Lucía</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">Preguntas frecuentes</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Contacto</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> {site.email}</li>
              <li>
                <a href={site.social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                  <Instagram className="h-3.5 w-3.5 shrink-0" /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</span>
          <span className="pr-14 sm:pr-16">
            Desarrollado por{" "}
            <a href="https://neura.com.py" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              Neura
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
