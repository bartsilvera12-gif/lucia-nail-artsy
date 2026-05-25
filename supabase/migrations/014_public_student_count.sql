-- 014_public_student_count.sql
-- Función que devuelve el conteo público de alumnas registradas (role = 'student').
-- Se usa SECURITY DEFINER para bypassear la RLS que restringe SELECT en profiles
-- a "solo tu propio profile". Devuelve un único integer — no expone datos.
--
-- Lo usa el frontend en /comunidad para mostrar "X alumnas registradas" en
-- el badge del hero.

CREATE OR REPLACE FUNCTION lucianails.public_student_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = lucianails, public
AS $$
  SELECT COUNT(*)::int FROM lucianails.profiles WHERE role = 'student';
$$;

-- Quitamos acceso default de los roles que no queremos y volvemos a otorgar a
-- los que sí: authenticated (alumnas) y anon (visitantes públicos).
REVOKE ALL ON FUNCTION lucianails.public_student_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lucianails.public_student_count() TO authenticated, anon;
