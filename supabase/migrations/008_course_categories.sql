-- 008_course_categories.sql
-- Tabla de categorías de cursos administrable desde el panel admin.
-- No toca la columna courses.category (sigue siendo TEXT libre).
-- Esta tabla solo provee la lista de opciones que aparecen en el dropdown.

CREATE TABLE IF NOT EXISTS lucianails.course_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  sort_order int  NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION lucianails.set_updated_at_categories()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_categories_updated_at ON lucianails.course_categories;
CREATE TRIGGER course_categories_updated_at
  BEFORE UPDATE ON lucianails.course_categories
  FOR EACH ROW EXECUTE FUNCTION lucianails.set_updated_at_categories();

-- Permisos para el rol anon/authenticated
GRANT SELECT, INSERT, UPDATE, DELETE
  ON lucianails.course_categories
  TO authenticated;
GRANT SELECT ON lucianails.course_categories TO anon;

-- RLS
ALTER TABLE lucianails.course_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cc read all"      ON lucianails.course_categories;
DROP POLICY IF EXISTS "cc insert admin"  ON lucianails.course_categories;
DROP POLICY IF EXISTS "cc update admin"  ON lucianails.course_categories;
DROP POLICY IF EXISTS "cc delete admin"  ON lucianails.course_categories;

-- Lectura: cualquiera (incluso público no autenticado para mostrar catálogo)
CREATE POLICY "cc read all" ON lucianails.course_categories
  FOR SELECT USING (true);

-- Escritura solo admin
CREATE POLICY "cc insert admin" ON lucianails.course_categories
  FOR INSERT WITH CHECK (lucianails.is_admin());

CREATE POLICY "cc update admin" ON lucianails.course_categories
  FOR UPDATE USING (lucianails.is_admin());

CREATE POLICY "cc delete admin" ON lucianails.course_categories
  FOR DELETE USING (lucianails.is_admin());

-- Seed inicial con las categorías que ya estaban hardcodeadas
INSERT INTO lucianails.course_categories (name, sort_order) VALUES
  ('Principiante', 10),
  ('Intermedio',   20),
  ('Avanzado',     30),
  ('Negocio',      40),
  ('Nail Art',     50)
ON CONFLICT (name) DO NOTHING;
