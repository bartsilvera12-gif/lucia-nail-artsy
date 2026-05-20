-- =============================================================
-- Lucía Rojas Studio — Schema inicial (esquema lucianails)
-- =============================================================

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create schema if not exists lucianails;

-- Permitir que los roles del API accedan al schema
grant usage on schema lucianails to anon, authenticated, service_role;
alter default privileges in schema lucianails grant all on tables    to authenticated, service_role;
alter default privileges in schema lucianails grant all on sequences to authenticated, service_role;
alter default privileges in schema lucianails grant all on functions to authenticated, service_role;

-- -------------------------------------------------------------
-- Enums
-- -------------------------------------------------------------
do $$ begin
  create type lucianails.user_role as enum ('student', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.course_category as enum (
    'Principiante', 'Intermedio', 'Avanzado', 'Negocio', 'Nail Art'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.course_level as enum (
    'Principiante', 'Intermedio', 'Avanzado', 'Negocio'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.course_status as enum ('draft', 'available', 'coming_soon');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.plan_id as enum ('monthly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.subscription_status as enum ('active', 'expired', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.payment_type as enum ('subscription', 'course_purchase');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lucianails.post_category as enum (
    'announcement', 'student_work', 'question', 'general'
  );
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------
-- Trigger genérico
-- -------------------------------------------------------------
create or replace function lucianails.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
create table if not exists lucianails.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null default '',
  role lucianails.user_role not null default 'student',
  avatar_url text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on lucianails.profiles(role);

drop trigger if exists profiles_set_updated_at on lucianails.profiles;
create trigger profiles_set_updated_at
  before update on lucianails.profiles
  for each row execute function lucianails.tg_set_updated_at();

-- Crea profile automáticamente al registrarse
create or replace function lucianails.handle_new_user()
returns trigger language plpgsql security definer set search_path = lucianails, public as $$
begin
  insert into lucianails.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function lucianails.handle_new_user();

-- -------------------------------------------------------------
-- plans
-- -------------------------------------------------------------
create table if not exists lucianails.plans (
  id lucianails.plan_id primary key,
  name text not null,
  price numeric(10,2) not null,
  duration_days integer not null,
  features text[] not null default '{}',
  highlighted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists plans_set_updated_at on lucianails.plans;
create trigger plans_set_updated_at
  before update on lucianails.plans
  for each row execute function lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- courses
-- -------------------------------------------------------------
create table if not exists lucianails.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text not null default '',
  description text not null default '',
  category lucianails.course_category not null,
  level lucianails.course_level not null,
  image_path text,
  price numeric(10,2) not null default 0,
  duration text not null default '',
  included_in_membership boolean not null default true,
  status lucianails.course_status not null default 'available',
  learnings text[] not null default '{}',
  audience text[] not null default '{}',
  bonuses text[] not null default '{}',
  sort_order integer not null default 100,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_status_idx on lucianails.courses(status);
create index if not exists courses_category_idx on lucianails.courses(category);

drop trigger if exists courses_set_updated_at on lucianails.courses;
create trigger courses_set_updated_at
  before update on lucianails.courses
  for each row execute function lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- modules
-- -------------------------------------------------------------
create table if not exists lucianails.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references lucianails.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists modules_course_idx on lucianails.modules(course_id, position);

drop trigger if exists modules_set_updated_at on lucianails.modules;
create trigger modules_set_updated_at
  before update on lucianails.modules
  for each row execute function lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- lessons
-- -------------------------------------------------------------
create table if not exists lucianails.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references lucianails.modules(id) on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null default 0,
  duration_seconds integer not null default 0,
  video_path text,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons_module_idx on lucianails.lessons(module_id, position);

drop trigger if exists lessons_set_updated_at on lucianails.lessons;
create trigger lessons_set_updated_at
  before update on lucianails.lessons
  for each row execute function lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- subscriptions
-- -------------------------------------------------------------
create table if not exists lucianails.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lucianails.profiles(id) on delete cascade,
  plan lucianails.plan_id not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status lucianails.subscription_status not null default 'active',
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on lucianails.subscriptions(user_id, status);
create index if not exists subscriptions_expires_idx on lucianails.subscriptions(expires_at) where status = 'active';

drop trigger if exists subscriptions_set_updated_at on lucianails.subscriptions;
create trigger subscriptions_set_updated_at
  before update on lucianails.subscriptions
  for each row execute function lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- course_purchases
-- -------------------------------------------------------------
create table if not exists lucianails.course_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lucianails.profiles(id) on delete cascade,
  course_id uuid not null references lucianails.courses(id) on delete cascade,
  price_paid numeric(10,2) not null default 0,
  payment_method text,
  purchased_at timestamptz not null default now(),
  notes text,
  unique (user_id, course_id)
);
create index if not exists course_purchases_user_idx on lucianails.course_purchases(user_id);

-- -------------------------------------------------------------
-- payments
-- -------------------------------------------------------------
create table if not exists lucianails.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lucianails.profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  type lucianails.payment_type not null,
  status lucianails.payment_status not null default 'succeeded',
  reference_id uuid,
  method text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on lucianails.payments(user_id, created_at desc);

-- -------------------------------------------------------------
-- lesson_progress
-- -------------------------------------------------------------
create table if not exists lucianails.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lucianails.profiles(id) on delete cascade,
  lesson_id uuid not null references lucianails.lessons(id) on delete cascade,
  last_position_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index if not exists lesson_progress_user_idx on lucianails.lesson_progress(user_id);

drop trigger if exists lesson_progress_set_updated_at on lucianails.lesson_progress;
create trigger lesson_progress_set_updated_at
  before update on lucianails.lesson_progress
  for each row execute function lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- posts + comments + likes
-- -------------------------------------------------------------
create table if not exists lucianails.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references lucianails.profiles(id) on delete cascade,
  category lucianails.post_category not null default 'general',
  title text not null,
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on lucianails.posts(created_at desc);

drop trigger if exists posts_set_updated_at on lucianails.posts;
create trigger posts_set_updated_at
  before update on lucianails.posts
  for each row execute function lucianails.tg_set_updated_at();

create table if not exists lucianails.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references lucianails.posts(id) on delete cascade,
  author_id uuid not null references lucianails.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on lucianails.post_comments(post_id, created_at);

create table if not exists lucianails.post_likes (
  user_id uuid not null references lucianails.profiles(id) on delete cascade,
  post_id uuid not null references lucianails.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- -------------------------------------------------------------
-- Helper: usuario actual es admin?
-- -------------------------------------------------------------
create or replace function lucianails.is_admin()
returns boolean language sql stable security definer set search_path = lucianails, public as $$
  select exists (
    select 1 from lucianails.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -------------------------------------------------------------
-- View: membresía activa actual
-- -------------------------------------------------------------
create or replace view lucianails.v_active_subscription as
  select distinct on (user_id) *
  from lucianails.subscriptions
  where status = 'active' and expires_at > now()
  order by user_id, expires_at desc;

-- Permisos sobre tablas existentes (idempotente para apply repetido)
grant select, insert, update, delete on all tables    in schema lucianails to authenticated, service_role;
grant select                          on all tables    in schema lucianails to anon;
grant usage, select                    on all sequences in schema lucianails to authenticated, service_role;
grant execute                          on all functions in schema lucianails to authenticated, service_role, anon;
-- =============================================================
-- Row Level Security (esquema lucianails)
-- =============================================================

alter table lucianails.profiles          enable row level security;
alter table lucianails.plans             enable row level security;
alter table lucianails.courses           enable row level security;
alter table lucianails.modules           enable row level security;
alter table lucianails.lessons           enable row level security;
alter table lucianails.subscriptions     enable row level security;
alter table lucianails.course_purchases  enable row level security;
alter table lucianails.payments          enable row level security;
alter table lucianails.lesson_progress   enable row level security;
alter table lucianails.posts             enable row level security;
alter table lucianails.post_comments     enable row level security;
alter table lucianails.post_likes        enable row level security;

-- profiles
drop policy if exists "profiles self read"   on lucianails.profiles;
drop policy if exists "profiles self update" on lucianails.profiles;
drop policy if exists "profiles admin write" on lucianails.profiles;

create policy "profiles self read"   on lucianails.profiles
  for select using (auth.uid() = id or lucianails.is_admin());
create policy "profiles self update" on lucianails.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'student');
create policy "profiles admin write" on lucianails.profiles
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- plans
drop policy if exists "plans read"  on lucianails.plans;
drop policy if exists "plans admin" on lucianails.plans;
create policy "plans read"  on lucianails.plans for select using (true);
create policy "plans admin" on lucianails.plans
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- courses
drop policy if exists "courses public read" on lucianails.courses;
drop policy if exists "courses admin"       on lucianails.courses;
create policy "courses public read" on lucianails.courses
  for select using (status <> 'draft' or lucianails.is_admin());
create policy "courses admin" on lucianails.courses
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- modules
drop policy if exists "modules public read" on lucianails.modules;
drop policy if exists "modules admin"       on lucianails.modules;
create policy "modules public read" on lucianails.modules for select using (true);
create policy "modules admin" on lucianails.modules
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- lessons
drop policy if exists "lessons public read" on lucianails.lessons;
drop policy if exists "lessons admin"       on lucianails.lessons;
create policy "lessons public read" on lucianails.lessons for select using (true);
create policy "lessons admin" on lucianails.lessons
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- subscriptions
drop policy if exists "subs self read" on lucianails.subscriptions;
drop policy if exists "subs admin"     on lucianails.subscriptions;
create policy "subs self read" on lucianails.subscriptions
  for select using (user_id = auth.uid() or lucianails.is_admin());
create policy "subs admin" on lucianails.subscriptions
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- course_purchases
drop policy if exists "purchases self read" on lucianails.course_purchases;
drop policy if exists "purchases admin"     on lucianails.course_purchases;
create policy "purchases self read" on lucianails.course_purchases
  for select using (user_id = auth.uid() or lucianails.is_admin());
create policy "purchases admin" on lucianails.course_purchases
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- payments
drop policy if exists "payments self read" on lucianails.payments;
drop policy if exists "payments admin"     on lucianails.payments;
create policy "payments self read" on lucianails.payments
  for select using (user_id = auth.uid() or lucianails.is_admin());
create policy "payments admin" on lucianails.payments
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- lesson_progress
drop policy if exists "progress self all" on lucianails.lesson_progress;
drop policy if exists "progress admin"    on lucianails.lesson_progress;
create policy "progress self all" on lucianails.lesson_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress admin"    on lucianails.lesson_progress
  for select using (lucianails.is_admin());

-- posts
drop policy if exists "posts read"          on lucianails.posts;
drop policy if exists "posts member insert" on lucianails.posts;
drop policy if exists "posts self update"   on lucianails.posts;
drop policy if exists "posts admin"         on lucianails.posts;
create policy "posts read"          on lucianails.posts for select using (true);
create policy "posts member insert" on lucianails.posts
  for insert with check (auth.uid() = author_id);
create policy "posts self update"   on lucianails.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "posts admin"         on lucianails.posts
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- comments
drop policy if exists "comments read"          on lucianails.post_comments;
drop policy if exists "comments member insert" on lucianails.post_comments;
drop policy if exists "comments self update"   on lucianails.post_comments;
drop policy if exists "comments admin"         on lucianails.post_comments;
create policy "comments read"          on lucianails.post_comments for select using (true);
create policy "comments member insert" on lucianails.post_comments
  for insert with check (auth.uid() = author_id);
create policy "comments self update"   on lucianails.post_comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "comments admin"         on lucianails.post_comments
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- likes
drop policy if exists "likes read" on lucianails.post_likes;
drop policy if exists "likes self" on lucianails.post_likes;
create policy "likes read" on lucianails.post_likes for select using (true);
create policy "likes self" on lucianails.post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
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
