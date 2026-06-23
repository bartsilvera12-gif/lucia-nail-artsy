-- =============================================================
-- Admin: resetear contraseña de cualquier usuario sin SMTP
-- =============================================================
--
-- Fallback al flujo de "olvide-password" cuando el email no llega
-- (SMTP por defecto de Supabase satura rapido y manda mucho a spam).
-- El admin entra al panel, busca la alumna y le pone una contraseña
-- nueva, despues se la pasa por WhatsApp / canal directo.
--
-- Patron tomado de tradexpar (admin_set_customer_auth_password):
-- self-hosted, sin Edge Functions, sin service_role en el cliente.
-- La RPC corre con SECURITY DEFINER y modifica auth.users via pgcrypto.

create extension if not exists pgcrypto with schema extensions;

create or replace function lucianails.admin_reset_user_password(
  p_user_id uuid,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = lucianails, public
as $$
declare
  v_pwd text;
  v_cnt int;
begin
  -- 1. Solo admins.
  if not lucianails.is_admin() then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;

  -- 2. Validar password.
  v_pwd := nullif(btrim(coalesce(p_password, '')), '');
  if v_pwd is null or length(v_pwd) < 6 then
    return jsonb_build_object('ok', false, 'reason', 'password_too_short');
  end if;

  -- 3. Verificar que el profile existe (y por extension el auth.user).
  if not exists (select 1 from lucianails.profiles where id = p_user_id) then
    return jsonb_build_object('ok', false, 'reason', 'user_not_found');
  end if;

  -- 4. Actualizar la contraseña en auth.users.
  begin
    update auth.users u
       set encrypted_password = extensions.crypt(v_pwd, extensions.gen_salt('bf')),
           updated_at = now()
     where u.id = p_user_id;

    get diagnostics v_cnt = row_count;
    if v_cnt = 0 then
      return jsonb_build_object('ok', false, 'reason', 'auth_user_not_found');
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

revoke all on function lucianails.admin_reset_user_password(uuid, text) from public;
grant execute on function lucianails.admin_reset_user_password(uuid, text) to authenticated;
