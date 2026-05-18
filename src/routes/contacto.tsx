import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Instagram, Send, CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

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
  const [sent, setSent] = useState(false);
  return (
    <PublicLayout>
      <section className="bg-gradient-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Contacto" title="Hablamos" description="Estamos para acompañarte en tu camino. Elegí el canal que prefieras." />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-4">
            <ContactCard icon={Mail} title="Email" value={site.email} href={`mailto:${site.email}`} />
            <ContactCard icon={MessageCircle} title="WhatsApp" value={site.phone} href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} />
            <ContactCard icon={Instagram} title="Instagram" value="@luciarojasstudio" href={site.social.instagram} />
            <p className="text-xs text-muted-foreground">Respondemos de lunes a viernes en menos de 24 horas hábiles.</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-2xl border border-border bg-card p-8 shadow-soft"
          >
            {sent ? (
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <h3 className="mt-4 font-serif text-xl">¡Mensaje enviado!</h3>
                <p className="mt-2 text-sm text-muted-foreground">Te respondemos a la brevedad.</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl">Enviarnos un mensaje</h3>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Nombre</label>
                    <Input required placeholder="Tu nombre" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input required type="email" placeholder="vos@email.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Mensaje</label>
                    <textarea required rows={5} placeholder="Contanos en qué podemos ayudarte" className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  </div>
                  <Button type="submit" variant="gold" className="w-full">
                    Enviar mensaje <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </form>
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
