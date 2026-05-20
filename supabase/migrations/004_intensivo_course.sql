-- Curso intensivo de uñas acrílicas para principiantes
insert into lucianails.courses
  (slug, title, short_description, description, category, level,
   image_path, price, duration, included_in_membership, status,
   learnings, audience, bonuses, sort_order, published_at)
values (
  'intensivo-unas-acrilicas-principiantes',
  'Curso Intensivo Uñas Acrílicas',
  'Curso intensivo para principiantes: 2 días teórico + práctico con todo incluido.',
  'Un curso intensivo pensado para principiantes que quieren arrancar con bases sólidas. En 2 días recorremos toda la técnica: desde anatomía y bioseguridad hasta limado, esmaltado semipermanente y acabados profesionales. Incluye material teórico, materiales para la práctica, certificado y asistencia post curso vía WhatsApp.',
  'Principiante', 'Principiante',
  'course-acrilicas.jpg', 149, '2 días intensivos',
  true, 'available',
  array[
    'Anatomía de la uña',
    'Manejo de herramientas',
    'Bioseguridad e higiene',
    'Técnicas de limado',
    'Esmaltado semipermanente',
    'Acabado en zona de cutícula',
    'Tips para fotos que venden'
  ],
  array[
    'Principiantes sin experiencia previa',
    'Manicuristas que quieren formalizar su técnica',
    'Emprendedoras que arrancan su carrera'
  ],
  array[
    'Material teórico',
    'Materiales para la práctica',
    'Certificado al completar',
    'Asistencia post curso vía WhatsApp'
  ],
  5, now()
)
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  description = excluded.description,
  duration = excluded.duration,
  learnings = excluded.learnings,
  audience = excluded.audience,
  bonuses = excluded.bonuses,
  sort_order = excluded.sort_order;

-- Módulos + lecciones del intensivo
do $$
declare c_id uuid; m_id uuid;
begin
  select id into c_id from lucianails.courses
    where slug = 'intensivo-unas-acrilicas-principiantes';

  if exists (select 1 from lucianails.modules where course_id = c_id) then return; end if;

  insert into lucianails.modules (course_id, title, position) values
    (c_id, 'Día 1 — Teoría y preparación', 1) returning id into m_id;
  insert into lucianails.lessons (module_id, title, description, position, duration_seconds, is_free_preview) values
    (m_id, 'Bienvenida y materiales', 'Presentación del curso y kit completo.', 1, 600, true),
    (m_id, 'Anatomía de la uña',     'Conocé tu zona de trabajo y los puntos clave.', 2, 900, false),
    (m_id, 'Bioseguridad e higiene', 'Protocolo para vos y tu clienta.', 3, 900, false),
    (m_id, 'Manejo de herramientas', 'Limas, pinceles, lámparas y más.', 4, 1200, false);

  insert into lucianails.modules (course_id, title, position) values
    (c_id, 'Día 2 — Práctica y acabado', 2) returning id into m_id;
  insert into lucianails.lessons (module_id, title, description, position, duration_seconds, is_free_preview) values
    (m_id, 'Técnicas de limado',          'Forma, simetría y prolijidad.', 1, 1500, false),
    (m_id, 'Esmaltado semipermanente',    'Aplicación paso a paso.',       2, 1500, false),
    (m_id, 'Acabado en zona de cutícula', 'Detalle que diferencia.',       3, 1200, false),
    (m_id, 'Tips para fotos que venden',  'Iluminación, ángulos y edición rápida.', 4, 900, false);
end $$;

-- Actualizar features de la membresía mensual / anual para incluir soporte WhatsApp
update lucianails.plans
set features = array(
  select unnest(features)
  union
  select 'Soporte directo por WhatsApp'
)
where id in ('monthly','yearly');
