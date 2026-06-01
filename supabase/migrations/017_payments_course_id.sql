-- 017_payments_course_id.sql
-- Agrega lucianails.payments.course_id (uuid nullable) para que el webhook
-- de Pagopar pueda crear el course_purchases server-side sin depender de
-- que el usuario vuelva a /pagopar/resultado/<hash>.
--
-- Si el usuario paga y cierra la pestaña antes de volver, el webhook ahora
-- tiene info suficiente para otorgar acceso por sí solo.
--
-- ON DELETE SET NULL: si se borra un curso, los pagos quedan pero pierden
-- el vínculo. No queremos cascadear borrados de payments por integridad
-- contable.

ALTER TABLE lucianails.payments
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES lucianails.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_course_id_idx
  ON lucianails.payments(course_id);
