import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { site } from "@/data/site";
import logoUrl from "@/assets/logo/lucia_rojas_logo_transparente_web.webp";
import esmalte2Img from "@/assets/esmalte2.png";

export function Footer() {
  return (
    <footer className="border-t border-border/20 bg-[var(--charcoal)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo + tagline */}
          <div>
            <Link to="/" className="flex items-center" aria-label={site.name}>
              <img src={logoUrl} alt={site.name} className="h-24 w-auto sm:h-32" />
            </Link>
            <p className="mt-3 text-sm text-[var(--cream)]/60">Academia online premium para profesionales de las uñas.</p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-medium text-[var(--cream)]">Plataforma</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--cream)]/60">
              <li><Link to="/cursos" className="hover:text-[var(--gold)] transition-colors">Cursos</Link></li>
              <li><Link to="/planes" className="hover:text-[var(--gold)] transition-colors">Planes</Link></li>
              <li><Link to="/sobre" className="hover:text-[var(--gold)] transition-colors">Sobre Lucía</Link></li>
              <li><Link to="/faq" className="hover:text-[var(--gold)] transition-colors">Preguntas frecuentes</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-medium text-[var(--cream)]">Contacto</h4>
            <ul className="mt-3 space-y-3 text-sm text-[var(--cream)]/60">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {site.email}</li>
              <li>
                <a href={site.social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[var(--gold)] transition-colors">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Ilustración decorativa */}
          <div className="flex items-end justify-center">
            <img src={esmalte2Img} alt="" aria-hidden className="pointer-events-none h-72 w-auto object-contain opacity-70" />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-5 text-xs text-[var(--cream)]/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</span>
          <span className="sm:mr-12">
            Desarrollado por{" "}
            <a
              href="https://neura.com.py"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--gold)] hover:underline"
            >
              Neura
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
