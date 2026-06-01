-- 016_payments_reference_id_text.sql
-- Cambia lucianails.payments.reference_id de uuid → text.
--
-- Motivo: el hash de Pagopar es un string hex de 64 caracteres
-- (ej: "ad110611e7ddff1c6ccc917bad2097ecbd0ddc6b609c5875c0deb10192817c54")
-- y NO es un UUID válido. Al intentar insertarlo, PostgreSQL devuelve
-- 22P02 "invalid input syntax for type uuid", lo que aborta el insert
-- y dispara un unhandled rejection que mata el worker de Phusion Passenger
-- antes de que jsonOk(res, ...) complete la respuesta al cliente.
--
-- Diagnóstico previo (ejecutado en repo):
--   - reference_id existe, tipo uuid, nullable
--   - NO tiene FK, NO tiene UNIQUE, NO tiene índice
--   - RLS no depende del tipo de la columna
--   - Conversión uuid → text es lossless (UUIDs quedan como strings hex)
--
-- Esta migración NO toca otros schemas, NO borra datos, NO toca Auth.

ALTER TABLE lucianails.payments
  ALTER COLUMN reference_id TYPE text USING reference_id::text;

-- Opcional pero útil para futuras consultas por hash de Pagopar:
CREATE INDEX IF NOT EXISTS payments_reference_id_idx
  ON lucianails.payments(reference_id);
