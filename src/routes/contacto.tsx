import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { site } from "@/data/site";
import pinzaImg from "@/assets/pinza.png";
import manoesmalteImg from "@/assets/manoesmalte.png";
import { AnimateIn } from "@/components/AnimateIn";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — Lucía Rojas Studio" },
      { name: "description", content: "Escribinos para resolver dudas o coordinar inscripciones." },
    ],
  }),
  component: ContactoPage,
});

function ContactoPage() {
  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[var(--nude)] opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[320px] lg:grid-cols-[1fr_1fr] lg:gap-0 lg:px-8">
          <AnimateIn direction="up" className="flex flex-col items-center text-center">
            <div className="flex w-full flex-col items-center gap-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
                <MessageCircle className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">— Contacto —</p>
            </div>
            <h1 className="mt-4 font-serif text-xl leading-[1.1] sm:text-2xl lg:text-3xl">
              Hablamos
            </h1>
            <p className="mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
              Estamos para acompañarte en tu camino. Elegí el canal que prefieras.
            </p>
          </AnimateIn>

          <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:flex lg:items-center lg:justify-center">
            <AnimateIn direction="fade" duration={900} delay={200} className="relative flex h-full w-full items-center justify-center">
              <div aria-hidden className="absolute h-[65%] w-[65%] bg-gradient-nude opacity-35" style={{ borderRadius: "50% 50% 40% 60% / 35% 35% 65% 65%" }} />
              <div aria-hidden className="absolute h-[72%] w-[72%] border border-[var(--nude)]/50 bg-transparent" style={{ borderRadius: "50% 50% 40% 60% / 35% 35% 65% 65%" }} />
              <AnimateIn direction="left" delay={350} duration={800} className="relative h-full w-full">
                <img src={pinzaImg} alt="" className="h-full w-full object-contain object-center" />
              </AnimateIn>
            </AnimateIn>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <AnimateIn direction="right" className="space-y-4">
            <ContactCard icon={Mail} title="Email" value={site.email} href={`mailto:${site.email}`} />
            <ContactCard icon={MessageCircle} title="WhatsApp" value={site.phone} href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} />
            <ContactCard icon={Instagram} title="Instagram" value="@luciarojasstudio" href={site.social.instagram} />
            <p className="text-xs text-muted-foreground">Respondemos de lunes a viernes en menos de 24 horas hábiles.</p>
          </AnimateIn>

          <AnimateIn direction="left" delay={100}>
            <div className="relative flex h-full min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-cream p-6 shadow-soft">
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-[var(--nude)] opacity-25 blur-3xl" />
              <img
                src={manoesmalteImg}
                alt=""
                aria-hidden="true"
                className="pointer-events-none relative max-h-80 w-auto select-none opacity-90"
              />
            </div>
          </AnimateIn>
        </div>
      </section>
    </PublicLayout>
  );
}

function ContactCard({ icon: Icon, title, value, href }: { icon: typeof Mail; title: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elegant">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </a>
  );
}
