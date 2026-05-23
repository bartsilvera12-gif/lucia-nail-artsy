-- =============================================================
-- Lucía Rojas Studio — Sistema de consultas de alumnas
-- Espacio de Alumnas: preguntas + respuestas docente
-- =============================================================

-- -------------------------------------------------------------
-- Enum de estado de consulta
-- -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE lucianails.question_status AS ENUM ('pending', 'answered', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -------------------------------------------------------------
-- student_questions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lucianails.student_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES lucianails.profiles(id) ON DELETE CASCADE,
  course_id   uuid REFERENCES lucianails.courses(id) ON DELETE SET NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  status      lucianails.question_status NOT NULL DEFAULT 'pending',
  is_featured boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sq_title_length CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  CONSTRAINT sq_body_length  CHECK (char_length(trim(body))  BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS sq_user_idx     ON lucianails.student_questions(user_id);
CREATE INDEX IF NOT EXISTS sq_status_idx   ON lucianails.student_questions(status);
CREATE INDEX IF NOT EXISTS sq_course_idx   ON lucianails.student_questions(course_id);
CREATE INDEX IF NOT EXISTS sq_featured_idx ON lucianails.student_questions(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS sq_created_idx  ON lucianails.student_questions(created_at DESC);

DROP TRIGGER IF EXISTS sq_set_updated_at ON lucianails.student_questions;
CREATE TRIGGER sq_set_updated_at
  BEFORE UPDATE ON lucianails.student_questions
  FOR EACH ROW EXECUTE FUNCTION lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- student_question_answers (1 respuesta por pregunta)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lucianails.student_question_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES lucianails.student_questions(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES lucianails.profiles(id) ON DELETE CASCADE,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id),
  CONSTRAINT sqa_body_length CHECK (char_length(trim(body)) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS sqa_question_idx ON lucianails.student_question_answers(question_id);

DROP TRIGGER IF EXISTS sqa_set_updated_at ON lucianails.student_question_answers;
CREATE TRIGGER sqa_set_updated_at
  BEFORE UPDATE ON lucianails.student_question_answers
  FOR EACH ROW EXECUTE FUNCTION lucianails.tg_set_updated_at();

-- -------------------------------------------------------------
-- Helper: membresía activa del usuario actual
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION lucianails.has_active_membership()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = lucianails, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM lucianails.subscriptions
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND expires_at > now()
  );
$$;

-- -------------------------------------------------------------
-- Grants
-- -------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE
  ON lucianails.student_questions, lucianails.student_question_answers
  TO authenticated, service_role;
GRANT SELECT
  ON lucianails.student_questions, lucianails.student_question_answers
  TO anon;
GRANT EXECUTE ON FUNCTION lucianails.has_active_membership()
  TO authenticated, service_role, anon;

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE lucianails.student_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucianails.student_question_answers ENABLE ROW LEVEL SECURITY;

-- student_questions
DROP POLICY IF EXISTS "sq read auth"     ON lucianails.student_questions;
DROP POLICY IF EXISTS "sq insert member" ON lucianails.student_questions;
DROP POLICY IF EXISTS "sq update admin"  ON lucianails.student_questions;
DROP POLICY IF EXISTS "sq delete admin"  ON lucianails.student_questions;

CREATE POLICY "sq read auth" ON lucianails.student_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sq insert member" ON lucianails.student_questions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND lucianails.has_active_membership()
    AND (
      SELECT COUNT(*) FROM lucianails.student_questions
      WHERE user_id = auth.uid()
        AND created_at > now() - INTERVAL '1 day'
    ) < 3
  );

CREATE POLICY "sq update admin" ON lucianails.student_questions
  FOR UPDATE USING (lucianails.is_admin())
  WITH CHECK (lucianails.is_admin());

CREATE POLICY "sq delete admin" ON lucianails.student_questions
  FOR DELETE USING (lucianails.is_admin());

-- student_question_answers
DROP POLICY IF EXISTS "sqa read auth"    ON lucianails.student_question_answers;
DROP POLICY IF EXISTS "sqa insert admin" ON lucianails.student_question_answers;
DROP POLICY IF EXISTS "sqa update admin" ON lucianails.student_question_answers;
DROP POLICY IF EXISTS "sqa delete admin" ON lucianails.student_question_answers;

CREATE POLICY "sqa read auth" ON lucianails.student_question_answers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sqa insert admin" ON lucianails.student_question_answers
  FOR INSERT WITH CHECK (
    lucianails.is_admin()
    AND auth.uid() = teacher_id
  );

CREATE POLICY "sqa update admin" ON lucianails.student_question_answers
  FOR UPDATE USING (lucianails.is_admin())
  WITH CHECK (lucianails.is_admin());

CREATE POLICY "sqa delete admin" ON lucianails.student_question_answers
  FOR DELETE USING (lucianails.is_admin());
