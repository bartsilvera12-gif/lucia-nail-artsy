-- 015_course_theory_pdfs.sql
-- Permite adjuntar un PDF a cada teoría de curso. El PDF se sube a un bucket
-- público de Storage (mismo modelo que course-images: el acceso por curso se
-- chequea en frontend con hasAccessTo). En la página pública se renderiza con
-- el visor nativo del navegador vía iframe.

-- 1) Columnas nuevas en course_theories
ALTER TABLE lucianails.course_theories
  ADD COLUMN IF NOT EXISTS pdf_url  text,
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS pdf_name text;

-- 2) Bucket público para PDFs de teoría
insert into storage.buckets (id, name, public)
values ('course-theory-pdfs', 'course-theory-pdfs', true)
on conflict (id) do update set public = true;

-- 3) Políticas
drop policy if exists "course-theory-pdfs public read" on storage.objects;
create policy "course-theory-pdfs public read" on storage.objects
  for select using (bucket_id = 'course-theory-pdfs');

drop policy if exists "admin manage course-theory-pdfs" on storage.objects;
create policy "admin manage course-theory-pdfs" on storage.objects
  for all
  using (bucket_id = 'course-theory-pdfs' and lucianails.is_admin())
  with check (bucket_id = 'course-theory-pdfs' and lucianails.is_admin());
