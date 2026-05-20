-- =============================================================
-- Seed: planes + cursos iniciales
-- =============================================================

insert into lucianails.plans (id, name, price, duration_days, features, highlighted) values
  ('monthly', 'Membresía Mensual', 29, 30, array[
    'Comunidad privada de alumnas',
    'Cursos incluidos en la membresía',
    'Bonos descargables',
    'Certificados al completar',
    'Cancelás cuando quieras'
  ], false),
  ('yearly',  'Membresía Anual',  249, 365, array[
    'Todo lo del plan mensual',
    'Ahorrás más del 28%',
    'Bonos premium exclusivos',
    'Prioridad en novedades y lanzamientos',
    'Acceso a sesiones en vivo'
  ], true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  duration_days = excluded.duration_days,
  features = excluded.features,
  highlighted = excluded.highlighted;

-- -------------------------------------------------------------
-- Cursos (idempotente por slug)
-- -------------------------------------------------------------
insert into lucianails.courses
  (slug, title, short_description, description, category, level,
   image_path, price, duration, included_in_membership, status,
   learnings, audience, bonuses, sort_order, published_at)
values
('unas-acrilicas-desde-cero',
 'Uñas Acrílicas desde Cero',
 'Aprendé la técnica acrílica paso a paso, desde la preparación hasta el acabado profesional.',
 'Un curso completo para que arranques en el mundo de las uñas acrílicas con bases sólidas, técnica limpia y resultados premium desde tu primera práctica.',
 'Principiante', 'Principiante',
 'course-acrilicas.jpg', 89, '5h 40m', true, 'available',
 array['Preparar la uña natural correctamente','Dominar la relación líquido-polvo','Aplicar tips y formas básicas','Limar y dar forma profesional','Acabado brillante y duradero'],
 array['Principiantes sin experiencia previa','Manicuristas que quieren incorporar acrílico','Emprendedoras del mundo de la belleza'],
 array['Lista de materiales y proveedores recomendados','Plantillas de práctica imprimibles','Guía de precios sugeridos'],
 10, now()),

('kapping-profesional',
 'Nivelación y Kapping Profesional',
 'Lográ uñas perfectamente niveladas con la técnica de kapping en gel y acrílico.',
 'Aprendé a nivelar la lámina natural y crear una capa de protección impecable que prolonga el esmaltado y eleva la estética del trabajo.',
 'Intermedio', 'Intermedio',
 'course-kapping.jpg', 79, '4h 20m', true, 'available',
 array['Diagnóstico correcto de la lámina natural','Nivelación con gel constructor','Kapping con acrílico transparente','Refuerzo en uñas débiles','Acabado prolijo y natural'],
 array['Manicuristas con experiencia básica','Profesionales que quieren mejorar la estética'],
 array['Checklist de diagnóstico','Tabla comparativa de geles'],
 20, now()),

('esmaltado-semipermanente',
 'Esmaltado Semipermanente Premium',
 'El semipermanente perfecto: sin levantamientos, brillo extremo y duración real.',
 'Una guía completa para que tus servicios de semipermanente duren más, se vean impecables y se conviertan en tu mejor carta de presentación.',
 'Principiante', 'Principiante',
 'course-semi.jpg', 59, '3h 30m', true, 'available',
 array['Preparación que evita levantamientos','Aplicación capa por capa','Sellado de borde libre','Retiro sin dañar la uña'],
 array['Principiantes','Manicuristas que tienen levantamientos frecuentes'],
 array['Guía de marcas recomendadas','Tabla de tiempos de curado por lámpara'],
 30, now()),

('nail-art-comercial',
 'Nail Art Comercial',
 'Diseños rentables y modernos que tus clientas van a querer copiar de Instagram.',
 'Aprendé los diseños más solicitados del momento con técnicas rápidas, limpias y rentables para tu mesa de trabajo.',
 'Nail Art', 'Intermedio',
 'course-nailart.jpg', 99, '6h 15m', true, 'available',
 array['French moderno y baby boomer','Foil y cromados','Encapsulados sutiles','Microart y línea fina','Diseños minimalistas premium'],
 array['Manicuristas con técnica intermedia','Profesionales que quieren subir el ticket promedio'],
 array['50 referencias visuales','Plantillas de práctica'],
 40, now()),

('manicura-rusa',
 'Manicura Rusa y Preparación Perfecta',
 'La técnica más demandada del mundo. Cutícula impecable y resultado perfecto.',
 'Dominá la manicura rusa con seguridad: torno, fresas, ángulos y la rutina exacta para un acabado de salón premium.',
 'Avanzado', 'Avanzado',
 'course-rusa.jpg', 119, '5h 10m', false, 'available',
 array['Torno y fresas: cuál usar y cuándo','Ángulos seguros sobre cutícula','Preparación del eponiquio','Acabado limpio sin sangrado'],
 array['Profesionales con experiencia','Manicuristas que quieren especializarse'],
 array['Guía de fresas con foto y uso','Protocolo de bioseguridad'],
 50, now()),

('negocio-de-unas',
 'Cómo Iniciar tu Negocio de Uñas',
 'De pasión a profesión: precios, clientas, marca personal y agenda llena.',
 'Todo lo que la academia tradicional no te enseña: cómo cobrar, atraer clientas, construir tu marca y vivir de las uñas.',
 'Negocio', 'Negocio',
 'course-negocio.jpg', 69, '4h', true, 'available',
 array['Calcular precios reales y rentables','Crear tu marca personal','Estrategia de Instagram simple','Conseguir clientas recurrentes','Organizar tu agenda y finanzas'],
 array['Manicuristas que recién empiezan','Profesionales que quieren formalizar su negocio'],
 array['Plantilla de cálculo de precios','Guía de contenido para 30 días'],
 60, now()),

('esculpidas-en-molde',
 'Uñas Esculpidas en Molde',
 'La técnica más versátil para crear largo y formas imposibles con molde.',
 'Aprendé a esculpir uñas extra largas con molde y dominar las formas más demandadas: stiletto, ballerina, coffin y edge.',
 'Avanzado', 'Avanzado',
 'course-acrilicas.jpg', 99, '4h 50m', true, 'available',
 array['Colocación perfecta del molde','Construcción del arco C','Esculpido en stiletto, ballerina y coffin','Equilibrio y simetría'],
 array['Manicuristas con experiencia básica','Profesionales que quieren ofrecer largos extremos'],
 array['Plantillas de moldes imprimibles','Tabla de pricing para largo extra'],
 70, now()),

('pedicuria-spa',
 'Pedicuría Spa Profesional',
 'Servicio de pedicuría de salón premium que tus clientas van a amar.',
 'Una rutina completa de pedicuría spa: desde el diagnóstico hasta el masaje y el esmaltado impecable que dura semanas.',
 'Intermedio', 'Intermedio',
 'course-semi.jpg', 75, '3h 50m', true, 'available',
 array['Diagnóstico y bioseguridad','Tratamiento de callos y durezas','Masaje relajante con técnica','Esmaltado semipermanente en pies'],
 array['Manicuristas que quieren sumar pedicuría','Profesionales que quieren elevar su servicio'],
 array['Lista de insumos spa','Protocolo paso a paso'],
 80, now()),

('diseno-3d-encapsulado',
 'Diseño 3D y Encapsulados de Lujo',
 'Flores secas, gemas, acrigel y encapsulados que se vuelven virales en Instagram.',
 'Aprendé a crear diseños 3D y encapsulados de alta gama: flores secas, foils metalizados, gemas y composiciones premium.',
 'Nail Art', 'Avanzado',
 'course-nailart.jpg', 109, '5h 30m', false, 'available',
 array['Encapsulado limpio sin burbujas','Composición visual de un diseño','Foil y cromados profesionales','Aplicación de gemas duraderas'],
 array['Nail techs avanzadas','Profesionales del nail art'],
 array['Catálogo de proveedores premium','100 referencias de diseño'],
 90, now()),

('instagram-para-manicuristas',
 'Instagram para Manicuristas',
 'Atraé clientas ideales sin bailar reels. Estrategia simple y constante.',
 'Una estrategia simple y replicable para llenar tu agenda usando Instagram, sin depender de algoritmos ni tendencias virales.',
 'Negocio', 'Negocio',
 'course-negocio.jpg', 65, '3h 20m', true, 'available',
 array['Bio que convierte en 5 segundos','Plan de contenido de 30 días','Reels rápidos sin bailar','Cierre por DM sin parecer pesada'],
 array['Manicuristas con cuenta nueva','Profesionales con poca constancia en Instagram'],
 array['Calendario editorial editable','Plantillas Canva premium'],
 100, now())
on conflict (slug) do nothing;

-- -------------------------------------------------------------
-- Módulos + lecciones (solo para los cursos sin módulos cargados aún)
-- -------------------------------------------------------------
do $$
declare c record; m_id uuid;
begin
  for c in
    select id, slug from lucianails.courses
    where not exists (select 1 from lucianails.modules where course_id = lucianails.courses.id)
  loop
    -- Crea un módulo "Bienvenida" con una lección preview gratuita por curso
    insert into lucianails.modules (course_id, title, position)
    values (c.id, 'Bienvenida al curso', 0) returning id into m_id;

    insert into lucianails.lessons (module_id, title, description, position, duration_seconds, is_free_preview)
    values (m_id, 'Presentación', 'Una mirada general al curso y lo que vas a aprender.', 0, 180, true);
  end loop;
end $$;
