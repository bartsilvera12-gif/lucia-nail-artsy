-- =============================================================
-- Storage para imágenes y videos de cursos
-- =============================================================

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', false)
on conflict (id) do nothing;

-- Política: lectura pública de imágenes
drop policy if exists "course-images public read" on storage.objects;
create policy "course-images public read" on storage.objects
  for select using (bucket_id = 'course-images');

-- Política: admin maneja imágenes y videos
drop policy if exists "admin manage course assets" on storage.objects;
create policy "admin manage course assets" on storage.objects
  for all
  using (bucket_id in ('course-images','course-videos') and lucianails.is_admin())
  with check (bucket_id in ('course-images','course-videos') and lucianails.is_admin());

-- Política: alumnas con acceso pueden leer videos
-- (el path del objeto se compara con lessons.video_path)
drop policy if exists "members read course videos" on storage.objects;
create policy "members read course videos" on storage.objects
  for select using (
    bucket_id = 'course-videos' and (
      lucianails.is_admin() or
      exists (
        select 1
        from lucianails.lessons l
        join lucianails.modules m on m.id = l.module_id
        join lucianails.courses c on c.id = m.course_id
        where l.video_path = storage.objects.name and (
          l.is_free_preview
          or exists (
            select 1 from lucianails.course_purchases cp
            where cp.user_id = auth.uid() and cp.course_id = c.id
          )
          or (
            c.included_in_membership and exists (
              select 1 from lucianails.subscriptions s
              where s.user_id = auth.uid()
                and s.status = 'active'
                and s.expires_at > now()
            )
          )
        )
      )
    )
  );
