# Lucía Rojas Studio — Plan de construcción

Plataforma premium de cursos online de uñas, estilo Skool, administrada por HorizontesWebIA.

## Alcance del proyecto

Esta es una plataforma muy grande (landing + catálogo + checkout + auth + panel alumno + cursos privados + comunidad + certificados + panel admin completo + protección de video + pagos). Construirla **toda funcional en una sola iteración no es realista** ni recomendable: terminaría con muchas pantallas a medias, bugs de integración y un backend que no podríamos validar.

Propongo construirla en **fases entregables**, donde cada fase es 100% funcional y testeable antes de pasar a la siguiente.

## Fase 1 — Fundación visual y páginas públicas (ESTA ITERACIÓN)

Objetivo: dejar la marca y la experiencia pública impecables, listas para mostrar al cliente.

1. **Sistema de diseño** en `src/styles.css`
   - Paleta dorado champagne / beige / negro suave en `oklch`
   - Tipografías: Playfair Display (titulares) + Inter (texto)
   - Tokens semánticos: `--primary` (dorado), `--background` (blanco cálido), `--card`, `--border`, `--accent`, gradientes, sombras elegantes
   - Variantes premium para Button (hero, gold, outline-gold, dark)

2. **Layout público** (`PublicLayout`, `Header` sticky, `Footer`)

3. **Páginas públicas**:
   - `/` Inicio (hero, propuesta de valor, membresía estilo Skool, cursos destacados, beneficios, planes, testimonios, sobre Lucía, FAQ, CTA)
   - `/cursos` Catálogo con filtros y buscador
   - `/cursos/$slug` Detalle de curso (mock data)
   - `/planes` Planes y precios
   - `/sobre` Sobre Lucía
   - `/faq`
   - `/contacto`
   - `/terminos`
   - `/privacidad`

4. **Componentes reutilizables**: HeroSection, CourseCard, PlanCard, TestimonialCard, FAQAccordion, EmptyState

5. **Imágenes generadas** (hero, sobre Lucía, cursos destacados) con estética premium femenina

6. **SEO básico**: head() por ruta, Open Graph

Datos mock para cursos/testimonios/planes en esta fase — sin backend todavía.

## Fase 2 — Backend, auth y compras (siguiente iteración)

- Activar Lovable Cloud
- Schema completo (profiles, courses, modules, lessons, purchases, memberships, plans, payments, progress, certificates, community_*, sessions, logs)
- RLS + roles (student / admin) usando tabla `user_roles` separada y función `has_role`
- Auth: registro, login, recuperar contraseña, rutas protegidas (`_authenticated`)
- Panel del alumno (dashboard, mis cursos, progreso)
- Migrar cursos de mock a DB

## Fase 3 — Pagos y acceso

- Integración Stripe (Lovable Payments)
- Checkout funcional, webhooks, activación automática
- Compra de curso individual + suscripciones mensual/anual
- Cupones

## Fase 4 — Cursos privados y video protegido

- Vista de curso interno (módulos, clases)
- Reproductor con marca de agua dinámica (nombre + email)
- Integración con proveedor de streaming privado (Mux / Cloudflare Stream / Vimeo) con URLs firmadas desde edge function
- Tracking de progreso
- Logs de acceso a video, control de sesiones/dispositivos

## Fase 5 — Comunidad privada (estilo Skool)

- Feed, publicaciones, comentarios, likes
- Categorías, posts fijados, moderación

## Fase 6 — Certificados

- Generación de PDF al completar curso (edge function + librería PDF)
- Código único de validación
- Página pública `/validar/$codigo`

## Fase 7 — Panel administrador

- `/admin` con rol guard
- Gestión de cursos / módulos / clases / videos
- Gestión de alumnos / pagos / suscripciones / cupones / certificados
- Reportes y dashboard de actividad sospechosa

---

## Detalles técnicos relevantes

- **Stack**: el proyecto ya está en TanStack Start + React + TS + Tailwind v4. Uso `createServerFn` (no Edge Functions de Supabase) para lógica interna; Edge Functions solo para webhooks de Stripe/proveedor de video.
- **Protección de video**: importante ser honesto — no se puede bloquear screenshots desde navegador. La protección real viene de: streaming privado + URLs firmadas con expiración corta + DRM si el proveedor lo soporta + marca de agua dinámica + control de sesiones. Esto se documentará en el código y en una nota al cliente.
- **Pagos**: voy a recomendar Lovable Payments (Stripe seamless) para evitar que el cliente tenga que crear su propia cuenta Stripe. Confirmamos en Fase 3.
- **Mercado Pago**: dejaré la capa de pagos abstraída (interface `PaymentProvider`) para que en el futuro se pueda agregar MP, pero la implementación inicial será Stripe.

## Lo que esta iteración entrega

Solo la **Fase 1**: toda la experiencia pública navegable y bonita, con datos mock, lista para que vos y el cliente la vean y aprueben antes de invertir en backend. Si después de verla querés que arranque directamente con Fase 2, me lo decís y seguimos.

¿Aprobás este enfoque por fases empezando con la Fase 1?
