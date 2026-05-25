-- 007_student_questions_owner_delete.sql
-- Permitir que el AUTOR de la consulta también pueda eliminarla.
-- La policy "sq delete admin" (006) sigue vigente para admins.
-- No modifica datos ni la migración 006.

DROP POLICY IF EXISTS "sq delete owner" ON lucianails.student_questions;

CREATE POLICY "sq delete owner" ON lucianails.student_questions
  FOR DELETE USING (user_id = auth.uid());

-- Las respuestas se borran en cascada (ON DELETE CASCADE en student_question_answers).
-- No se requiere policy extra sobre student_question_answers — solo admin puede
-- crear/editar/borrar respuestas, y la cascada se ejecuta como dueño del schema.
