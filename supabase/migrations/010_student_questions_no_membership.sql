-- 010_student_questions_no_membership.sql
-- El sistema de membresía fue eliminado. La policy "sq insert member"
-- de la migración 006 requería has_active_membership() → ningún usuario
-- regular puede insertar consultas.
--
-- Esta migración reemplaza la policy con una que solo verifica:
--   1. Usuario autenticado
--   2. user_id = auth.uid() (consulta a nombre propio)
--   3. Rate limit de 3 consultas/día (se mantiene)
--
-- Admin puede insertar siempre (sin rate limit) por separado.

DROP POLICY IF EXISTS "sq insert member" ON lucianails.student_questions;
DROP POLICY IF EXISTS "sq insert auth"   ON lucianails.student_questions;
DROP POLICY IF EXISTS "sq insert admin"  ON lucianails.student_questions;

-- Usuarios autenticados: hasta 3 consultas por día
CREATE POLICY "sq insert auth" ON lucianails.student_questions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT COUNT(*) FROM lucianails.student_questions
      WHERE user_id = auth.uid()
        AND created_at > now() - INTERVAL '1 day'
    ) < 3
  );

-- Admin: sin límite
CREATE POLICY "sq insert admin" ON lucianails.student_questions
  FOR INSERT WITH CHECK (lucianails.is_admin());
