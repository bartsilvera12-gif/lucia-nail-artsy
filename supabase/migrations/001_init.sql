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
