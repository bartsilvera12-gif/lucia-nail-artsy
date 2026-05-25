-- 011_testimonials.sql
-- Tabla de reseñas/testimonials administrable desde el panel admin.
-- Aparecen en el home en la sección "Resultados reales de la academia".

CREATE TABLE IF NOT EXISTS lucianails.testimonials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text NOT NULL DEFAULT '',
  quote      text NOT NULL,
  result     text NOT NULL DEFAULT '',
  sort_order int  NOT NULL DEFAULT 100,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION lucianails.set_updated_at_testimonials()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonials_updated_at ON lucianails.testimonials;
CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON lucianails.testimonials
  FOR EACH ROW EXECUTE FUNCTION lucianails.set_updated_at_testimonials();

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON lucianails.testimonials TO authenticated;
GRANT SELECT ON lucianails.testimonials TO anon;

-- RLS
ALTER TABLE lucianails.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tt read all"      ON lucianails.testimonials;
DROP POLICY IF EXISTS "tt insert admin"  ON lucianails.testimonials;
DROP POLICY IF EXISTS "tt update admin"  ON lucianails.testimonials;
DROP POLICY IF EXISTS "tt delete admin"  ON lucianails.testimonials;

-- Lectura: cualquiera (incluso público no auth — para mostrar en home)
CREATE POLICY "tt read all" ON lucianails.testimonials
  FOR SELECT USING (true);

-- Escritura solo admin
CREATE POLICY "tt insert admin" ON lucianails.testimonials
  FOR INSERT WITH CHECK (lucianails.is_admin());

CREATE POLICY "tt update admin" ON lucianails.testimonials
  FOR UPDATE USING (lucianails.is_admin());

CREATE POLICY "tt delete admin" ON lucianails.testimonials
  FOR DELETE USING (lucianails.is_admin());

-- Seed con las 3 reseñas hardcodeadas actuales
INSERT INTO lucianails.testimonials (name, role, quote, result, sort_order) VALUES
  (
    'Camila Fernández',
    'Manicurista — Buenos Aires',
    'Empecé sin saber nada y en 3 meses ya tenía mi agenda llena. La forma de explicar de Lucía es clarísima y la comunidad es oro.',
    'Llené mi agenda en 3 meses',
    10
  ),
  (
    'Macarena Ríos',
    'Nail tech — Córdoba',
    'Subí mi precio un 40% después del curso de manicura rusa. Mis clientas notan la diferencia y vuelven siempre.',
    'Subí 40% mi precio',
    20
  ),
  (
    'Ana Belén Torres',
    'Emprendedora — Mendoza',
    'El curso de negocio cambió mi forma de cobrar. Por primera vez siento que tengo un negocio rentable, no un hobby.',
    'De hobby a negocio real',
    30
  )
ON CONFLICT DO NOTHING;
