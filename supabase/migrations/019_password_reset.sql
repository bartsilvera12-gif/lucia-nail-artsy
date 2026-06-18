-- =============================================================
-- Password reset con rate limit 1/dia por email
-- =============================================================
--
-- Tabla password_reset_attempts: 1 fila por intento de "olvide contraseña".
-- Rate limit: 1 intento por email cada 24h. Esto previene que:
--   - una alumna sature su propio inbox por error
--   - un atacante envie reset spam a un email ajeno
--
-- Anti-enumeration: el RPC NO revela si el email existe o no en profiles.
-- Siempre que el rate limit este OK, devuelve allowed=true y el cliente
-- llama a supabase.auth.resetPasswordForEmail (que es idempotente: si el
-- email no existe, Supabase NO envia nada pero tampoco tira error).

create table if not exists lucianails.password_reset_attempts (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null,
  attempted_at timestamptz not null default now(),
  ip           text
);

create index if not exists password_reset_attempts_email_time_idx
  on lucianails.password_reset_attempts (lower(email), attempted_at desc);

alter table lucianails.password_reset_attempts enable row level security;

-- Sin policies de SELECT/INSERT/UPDATE/DELETE: el RPC con security definer
-- es la unica via de escritura. Lectura solo para admins via SQL editor.
drop policy if exists "pw reset attempts admin read" on lucianails.password_reset_attempts;
create policy "pw reset attempts admin read" on lucianails.password_reset_attempts
  for select using (lucianails.is_admin());

-- -------------------------------------------------------------
-- RPC: request_password_reset
-- Returns: (allowed boolean, hours_remaining int)
--   allowed=true  → el cliente puede llamar a supabase.auth.resetPasswordForEmail
--   allowed=false → ya pidio uno en las ultimas 24h. hours_remaining = horas
--                   restantes hasta poder pedir otro (siempre >= 1).
-- -------------------------------------------------------------
create or replace function lucianails.request_password_reset(p_email text)
returns table (allowed boolean, hours_remaining int)
language plpgsql security definer set search_path = lucianails, public
as $$
declare
  v_email     text := lower(btrim(coalesce(p_email, '')));
  v_last      timestamptz;
  v_remaining int;
begin
  if v_email = '' or position('@' in v_email) = 0 then
    return query select false, 0;
    return;
  end if;

  select attempted_at
    into v_last
    from lucianails.password_reset_attempts
   where lower(email) = v_email
     and attempted_at > now() - interval '24 hours'
   order by attempted_at desc
   limit 1;

  if v_last is not null then
    -- Redondeamos hacia arriba para que si faltan 30 min muestre "1 hora".
    v_remaining := greatest(
      1,
      ceil(extract(epoch from (v_last + interval '24 hours' - now())) / 3600.0)::int
    );
    return query select false, v_remaining;
    return;
  end if;

  insert into lucianails.password_reset_attempts (email, ip)
  values (v_email, lucianails.request_ip());

  return query select true, 0;
end
$$;

revoke all on function lucianails.request_password_reset(text) from public;
-- anon: la alumna que olvido la contraseña esta deslogueada.
-- authenticated: por consistencia, si la pide ya logueada tambien.
grant execute on function lucianails.request_password_reset(text) to anon, authenticated;
