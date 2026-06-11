-- =============================================================
-- Video Security Layer — paso 3
-- Tabla active_video_sessions + RPCs start/heartbeat/revoke
-- =============================================================
--
-- Objetivo: limitar a 1 sesion de video activa por usuario. Cuando una
-- alumna inicia reproduccion en un dispositivo nuevo, las sesiones activas
-- previas del mismo usuario quedan marcadas como revoked. El heartbeat de
-- ProtectedVideo.tsx (cada 30s) consulta si su sesion sigue activa.
--
-- IP del cliente: la capturamos del header x-forwarded-for que setea
-- Supabase/PostgREST. Si no esta disponible, queda null (es campo opcional).
--
-- No validamos acceso al curso aca a proposito — eso lo hace la ruta
-- /ver/$slug antes de renderizar ProtectedVideo. Las filas en esta tabla
-- son solo de telemetria/control de concurrencia, no autorizacion.

create table if not exists lucianails.active_video_sessions (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  session_id         text not null,
  device_fingerprint text,
  ip                 text,
  user_agent         text,
  course_id          uuid references lucianails.courses(id) on delete set null,
  lesson_id          uuid references lucianails.lessons(id) on delete set null,
  last_seen_at       timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  revoked_at         timestamptz
);

create unique index if not exists active_video_sessions_session_id_uq
  on lucianails.active_video_sessions(session_id);

create index if not exists active_video_sessions_user_active_idx
  on lucianails.active_video_sessions(user_id)
  where revoked_at is null;

create index if not exists active_video_sessions_user_created_idx
  on lucianails.active_video_sessions(user_id, created_at desc);

alter table lucianails.active_video_sessions enable row level security;

-- RLS: solo admin lee directo. Las escrituras pasan por RPCs security definer
-- (no hay policy de insert/update/delete porque queremos bloquear acceso
-- directo desde el client).
drop policy if exists "video sessions admin read" on lucianails.active_video_sessions;
create policy "video sessions admin read" on lucianails.active_video_sessions
  for select using (lucianails.is_admin());

-- -------------------------------------------------------------
-- Helper: extraer IP del header de request (best-effort)
-- -------------------------------------------------------------
create or replace function lucianails.request_ip()
returns text language plpgsql stable as $$
declare
  hdrs jsonb;
  xff  text;
  rip  text;
begin
  -- current_setting puede tirar si no esta seteado; lo envolvemos.
  begin
    hdrs := current_setting('request.headers', true)::jsonb;
  exception when others then
    return null;
  end;
  if hdrs is null then return null; end if;
  xff := hdrs ->> 'x-forwarded-for';
  rip := hdrs ->> 'x-real-ip';
  if xff is not null and xff <> '' then
    -- x-forwarded-for puede traer una lista "client, proxy1, proxy2".
    return btrim(split_part(xff, ',', 1));
  end if;
  return nullif(rip, '');
end
$$;

-- -------------------------------------------------------------
-- RPC: start_video_session
-- Revoca todas las sesiones activas anteriores del mismo usuario y crea
-- una nueva. Devuelve la id de la nueva fila para que el cliente la guarde
-- (opcional — el cliente igual ya tiene su session_id local).
-- -------------------------------------------------------------
create or replace function lucianails.start_video_session(
  p_session_id         text,
  p_device_fingerprint text,
  p_user_agent         text,
  p_course_id          uuid,
  p_lesson_id          uuid
)
returns uuid
language plpgsql security definer set search_path = lucianails, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_ip      text := lucianails.request_ip();
  v_new_id  uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if p_session_id is null or length(p_session_id) < 8 then
    raise exception 'invalid_session_id';
  end if;

  -- Revocar solo las sesiones activas que pertenecen a OTROS dispositivos.
  -- Multiples sesiones (ej: dos pestañas) en el mismo device_fingerprint
  -- conviven sin kickearse — el objetivo es bloquear compartir credenciales,
  -- no molestar a quien tiene la cuenta abierta en varias pestañas.
  --
  -- Si cualquiera de los dos fingerprints es null (storage bloqueado, modo
  -- privado, etc.) NO kickeamos — preferimos un falso negativo a echar
  -- alumnas legitimas que no podemos identificar como mismo device.
  update lucianails.active_video_sessions
     set revoked_at = now()
   where user_id = v_user_id
     and revoked_at is null
     and session_id <> p_session_id
     and device_fingerprint is not null
     and p_device_fingerprint is not null
     and device_fingerprint <> p_device_fingerprint;

  -- Si la sesion ya existe (re-start desde mismo tab por re-mount), la
  -- "des-revocamos" y actualizamos last_seen. Asi evitamos duplicar filas.
  insert into lucianails.active_video_sessions (
    user_id, session_id, device_fingerprint, ip, user_agent,
    course_id, lesson_id, last_seen_at, created_at, revoked_at
  ) values (
    v_user_id, p_session_id, p_device_fingerprint, v_ip, p_user_agent,
    p_course_id, p_lesson_id, now(), now(), null
  )
  on conflict (session_id) do update
    set last_seen_at       = now(),
        revoked_at         = null,
        device_fingerprint = excluded.device_fingerprint,
        ip                 = coalesce(excluded.ip, lucianails.active_video_sessions.ip),
        user_agent         = excluded.user_agent,
        course_id          = excluded.course_id,
        lesson_id          = excluded.lesson_id
  returning id into v_new_id;

  return v_new_id;
end
$$;

revoke all on function lucianails.start_video_session(text, text, text, uuid, uuid) from public;
grant execute on function lucianails.start_video_session(text, text, text, uuid, uuid) to authenticated;

-- -------------------------------------------------------------
-- RPC: heartbeat_video_session
-- Actualiza last_seen_at de la sesion y devuelve si esta revocada.
-- Si la sesion no existe o no es del usuario actual, devuelve revoked=true
-- (para que el cliente se trate como kickeado).
-- -------------------------------------------------------------
create or replace function lucianails.heartbeat_video_session(
  p_session_id text
)
returns table (revoked boolean, reason text)
language plpgsql security definer set search_path = lucianails, public
as $$
declare
  v_user_id    uuid := auth.uid();
  v_row_user   uuid;
  v_revoked_at timestamptz;
begin
  if v_user_id is null then
    return query select true, 'not_authenticated'::text;
    return;
  end if;

  select user_id, revoked_at
    into v_row_user, v_revoked_at
    from lucianails.active_video_sessions
   where session_id = p_session_id
   limit 1;

  if v_row_user is null then
    return query select true, 'session_not_found'::text;
    return;
  end if;

  if v_row_user <> v_user_id then
    return query select true, 'session_user_mismatch'::text;
    return;
  end if;

  if v_revoked_at is not null then
    return query select true, 'session_revoked'::text;
    return;
  end if;

  update lucianails.active_video_sessions
     set last_seen_at = now()
   where session_id = p_session_id;

  return query select false, null::text;
end
$$;

revoke all on function lucianails.heartbeat_video_session(text) from public;
grant execute on function lucianails.heartbeat_video_session(text) to authenticated;

-- -------------------------------------------------------------
-- RPC: revoke_video_session
-- Marca la sesion como revocada (uso opcional desde el cliente al hacer
-- logout o navegar fuera del player). Solo el dueño o un admin pueden.
-- -------------------------------------------------------------
create or replace function lucianails.revoke_video_session(
  p_session_id text
)
returns void
language plpgsql security definer set search_path = lucianails, public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  update lucianails.active_video_sessions
     set revoked_at = now()
   where session_id = p_session_id
     and (user_id = v_user_id or lucianails.is_admin())
     and revoked_at is null;
end
$$;

revoke all on function lucianails.revoke_video_session(text) from public;
grant execute on function lucianails.revoke_video_session(text) to authenticated;
