-- =============================================================
-- Desactivar el trigger global on_auth_user_created
-- =============================================================
--
-- El trigger antes corria sobre auth.users (compartido entre proyectos)
-- y filtraba por raw_user_meta_data->>'app'. Mas limpio: que el cliente
-- inserte el profile explicitamente en lucianails.profiles tras un
-- signUp exitoso. Asi profiles es la unica fuente de verdad, sin
-- depender de metadata global de auth.

drop trigger if exists on_auth_user_created on auth.users;

-- La funcion lucianails.handle_new_user se deja en su lugar por si
-- algun otro lado la referencia (no hace nada por si sola sin trigger).
