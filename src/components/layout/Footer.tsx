import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { site } from "@/data/site";
import logoUrl from "@/assets/logo/lucia_rojas_logo_transparente_web.webp";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center" aria-label={site.name}>
              <img src={logoUrl} alt={site.name} className="h-14 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">Academia online premium para profesionales de las uñas.</p>
            <p className="mt-4 text-xs text-muted-foreground">{site.admin}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Plataforma</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/cursos" className="hover:text-foreground">Cursos</Link></li>
              <li><Link to="/planes" className="hover:text-foreground">Planes</Link></li>
              <li><Link to="/sobre" className="hover:text-foreground">Sobre Lucía</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">Preguntas frecuentes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contacto" className="hover:text-foreground">Contacto</Link></li>
              <li><Link to="/terminos" className="hover:text-foreground">Términos y condiciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-foreground">Política de privacidad</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium">Contacto</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {site.email}</li>
              <li>
                <a href={site.social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}