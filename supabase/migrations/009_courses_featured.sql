-- 009_courses_featured.sql
-- Agrega columna is_featured a courses para marcar cursos destacados.
-- El home muestra estos cursos en el carrusel "Cursos destacados".

ALTER TABLE lucianails.courses
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Índice parcial para queries rápidas de cursos destacados
CREATE INDEX IF NOT EXISTS courses_is_featured_idx
  ON lucianails.courses (is_featured, sort_order)
  WHERE is_featured = true;
