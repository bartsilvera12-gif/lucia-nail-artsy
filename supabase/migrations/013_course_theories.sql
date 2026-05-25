-- 013_course_theories.sql
-- Reemplaza el campo theory_content (texto único) por una tabla de
-- múltiples teorías por curso. Cada teoría tiene título y contenido HTML
-- y se pueden ordenar, agregar, editar y borrar desde el admin.
--
-- El campo courses.theory_content (migración 012) no se elimina por seguridad
-- — queda como dato legacy. Si querés migrar lo viejo a la nueva tabla,
-- corré un INSERT manual después.

CREATE TABLE IF NOT EXISTS lucianails.course_theories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  uuid NOT NULL REFERENCES lucianails.courses(id) ON DELETE CASCADE,
  title      text NOT NULL,
  content    text NOT NULL DEFAULT '',
  sort_order int  NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_theories_course_idx
  ON lucianails.course_theories(course_id, sort_order);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION lucianails.set_updated_at_course_theories()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_theories_updated_at ON lucianails.course_theories;
CREATE TRIGGER course_theories_updated_at
  BEFORE UPDATE ON lucianails.course_theories
  FOR EACH ROW EXECUTE FUNCTION lucianails.set_updated_at_course_theories();

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON lucianails.course_theories TO authenticated;
GRANT SELECT ON lucianails.course_theories TO anon;

-- RLS
ALTER TABLE lucianails.course_theories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ct read all"     ON lucianails.course_theories;
DROP POLICY IF EXISTS "ct insert admin" ON lucianails.course_theories;
DROP POLICY IF EXISTS "ct update admin" ON lucianails.course_theories;
DROP POLICY IF EXISTS "ct delete admin" ON lucianails.course_theories;

-- Lectura: cualquiera autenticado puede leer (el acceso por curso se chequea
-- en el frontend con hasAccessTo — la teoría no expone secretos del curso
-- por sí misma, solo conviene mostrarla a quienes tienen acceso)
CREATE POLICY "ct read all" ON lucianails.course_theories
  FOR SELECT USING (true);

CREATE POLICY "ct insert admin" ON lucianails.course_theories
  FOR INSERT WITH CHECK (lucianails.is_admin());

CREATE POLICY "ct update admin" ON lucianails.course_theories
  FOR UPDATE USING (lucianails.is_admin());

CREATE POLICY "ct delete admin" ON lucianails.course_theories
  FOR DELETE USING (lucianails.is_admin());
