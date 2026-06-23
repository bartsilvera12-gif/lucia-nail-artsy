-- =============================================================
-- Limitar lucianails.profiles a usuarios reales de Lucia Rojas
-- =============================================================
--
-- Problema: el trigger on_auth_user_created corria sobre auth.users
-- (que es global para todos los proyectos del Supabase compartido) y
-- creaba un row en lucianails.profiles por cada signup, incluso de
-- otros proyectos (joyeriaartesanos, etc.). Por eso el panel admin
-- veia alumnas que en realidad nunca pasaron por la academia.
--
-- Fix:
--  1) Columna `source` para marcar el proyecto de origen.
--  2) Backfill: marcar como 'lucianails' los profiles que tienen
--     actividad real (payments, subscriptions, course_purchases,
--     lesson_progress, posts, post_comments, post_likes) o que son
--     admins. El resto queda con source IS NULL.
--  3) Trigger nuevo: solo inserta el profile cuando el signUp llego
--     con raw_user_meta_data->>'app' = 'lucianails'.
--  4) La query de alumnas filtra source = 'lucianails'.

alter table lucianails.profiles
  add column if not exists source text;

create index if not exists profiles_source_idx on lucianails.profiles(source);

-- Backfill: marcar como 'lucianails' los profiles con actividad real
-- o con rol admin (admins se preservan siempre).
update lucianails.profiles p
   set source = 'lucianails'
 where source is null
   and (
         p.role = 'admin'
      or exists (select 1 from lucianails.payments         x where x.user_id = p.id)
      or exists (select 1 from lucianails.subscriptions    x where x.user_id = p.id)
      or exists (select 1 from lucianails.course_purchases x where x.user_id = p.id)
      or exists (select 1 from lucianails.lesson_progress  x where x.user_id = p.id)
      or exists (select 1 from lucianails.posts            x where x.author_id = p.id)
      or exists (select 1 from lucianails.post_comments    x where x.author_id = p.id)
      or exists (select 1 from lucianails.post_likes       x where x.user_id = p.id)
   );

-- Trigger actualizado: solo crea profile en signups que vinieron de
-- la app de Lucia (registro.tsx pasa { app: 'lucianails' } en metadata).
create or replace function lucianails.handle_new_user()
returns trigger language plpgsql security definer set search_path = lucianails, public as $$
begin
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'lucianails' then
    return new;
  end if;

  insert into lucianails.profiles (id, email, name, source)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'lucianails'
  )
  on conflict (id) do update
    set source = coalesce(lucianails.profiles.source, 'lucianails');

  return new;
end $$;
