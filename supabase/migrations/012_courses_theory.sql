-- 012_courses_theory.sql
-- Agrega campo theory_content al curso para guardar contenido teórico
-- editado con rich text (HTML).
-- - Es texto plano HTML generado por TipTap en el admin.
-- - Se renderiza con un sanitizer en el cliente.
-- - Sigue el mismo patrón que description (otros TEXT del curso).
-- - No se crea tabla nueva — solo una columna.
-- - Acceso: hereda RLS de la tabla courses (no requiere policy nueva).

ALTER TABLE lucianails.courses
  ADD COLUMN IF NOT EXISTS theory_content text NOT NULL DEFAULT '';
