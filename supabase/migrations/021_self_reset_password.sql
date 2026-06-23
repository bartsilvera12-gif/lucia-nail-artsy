-- =============================================================
-- Self-service reset de contrasena (sin email, sin SMTP)
-- =============================================================
--
-- La alumna entra a /olvide-password, escribe su email + contrasena
-- nueva, y se la cambiamos en el momento. Sin verificacion por email.
--
-- Proteccion: rate limit 1 intento por email cada 24h (reusa la tabla
-- lucianails.password_reset_attempts creada en la migracion 019).
--
-- TRADE-OFF: si alguien conoce el email de una alumna puede cambiarle
-- la contrasena (1 vez al dia). Aceptado por requerimiento del negocio.

create or replace function lucianails.self_reset_password(
  p_email text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = lucianails, public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_pwd   text := nullif(btrim(coalesce(p_new_password, '')), '');
  v_last  timestamptz;
  v_hours int;
  v_user  uuid;
  v_cnt   int;
begin
  -- 1. Validaciones basicas.
  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_email');
  end if;
  if v_pwd is null or length(v_pwd) < 6 then
    return jsonb_build_object('ok', false, 'reason', 'password_too_short');
  end if;

  -- 2. Rate limit: 1 intento cada 24h por email (reusa tabla de 019).
  select attempted_at
    into v_last
    from lucianails.password_reset_attempts
   where lower(email) = v_email
     and attempted_at > now() - interval '24 hours'
   order by attempted_at desc
   limit 1;

  if v_last is not null then
    v_hours := greatest(
      1,
      ceil(extract(epoch from (v_last + interval '24 hours' - now())) / 3600.0)::int
    );
    return jsonb_build_object('ok', false, 'reason', 'rate_limited', 'hours_remaining', v_hours);
  end if;

  -- 3. Buscar el usuario.
  --    Anti-enumeration: NO devolvemos un error distinto si el email no existe.
  --    Registramos el intento igual (asi un atacante no puede inferir por
  --    timing si el email esta o no en la base) y devolvemos ok=true.
  select id into v_user from lucianails.profiles where lower(email) = v_email;

  insert into lucianails.password_reset_attempts (email, ip)
  values (v_email, lucianails.request_ip());

  if v_user is null then
    return jsonb_build_object('ok', true);
  end if;

  -- 4. Actualizar la contrasena en auth.users.
  begin
    update auth.users u
       set encrypted_password = extensions.crypt(v_pwd, extensions.gen_salt('bf')),
           updated_at = now()
     where u.id = v_user;

    get diagnostics v_cnt = row_count;
    if v_cnt = 0 then
      return jsonb_build_object('ok', true);
    end if;
  exception
    when insufficient_privilege then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_privilege');
    when sqlstate '42883' then
      return jsonb_build_object('ok', false, 'reason', 'pgcrypto_missing');
    when others then
      return jsonb_build_object('ok', false, 'reason', 'auth_update_error', 'message', sqlerrm);
  end;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function lucianails.self_reset_password(text, text) from public;
grant execute on function lucianails.self_reset_password(text, text) to anon, authenticated;
