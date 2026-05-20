-- =============================================================
-- Row Level Security (esquema lucianails)
-- =============================================================

alter table lucianails.profiles          enable row level security;
alter table lucianails.plans             enable row level security;
alter table lucianails.courses           enable row level security;
alter table lucianails.modules           enable row level security;
alter table lucianails.lessons           enable row level security;
alter table lucianails.subscriptions     enable row level security;
alter table lucianails.course_purchases  enable row level security;
alter table lucianails.payments          enable row level security;
alter table lucianails.lesson_progress   enable row level security;
alter table lucianails.posts             enable row level security;
alter table lucianails.post_comments     enable row level security;
alter table lucianails.post_likes        enable row level security;

-- profiles
drop policy if exists "profiles self read"   on lucianails.profiles;
drop policy if exists "profiles self update" on lucianails.profiles;
drop policy if exists "profiles admin write" on lucianails.profiles;

create policy "profiles self read"   on lucianails.profiles
  for select using (auth.uid() = id or lucianails.is_admin());
create policy "profiles self update" on lucianails.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'student');
create policy "profiles admin write" on lucianails.profiles
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- plans
drop policy if exists "plans read"  on lucianails.plans;
drop policy if exists "plans admin" on lucianails.plans;
create policy "plans read"  on lucianails.plans for select using (true);
create policy "plans admin" on lucianails.plans
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- courses
drop policy if exists "courses public read" on lucianails.courses;
drop policy if exists "courses admin"       on lucianails.courses;
create policy "courses public read" on lucianails.courses
  for select using (status <> 'draft' or lucianails.is_admin());
create policy "courses admin" on lucianails.courses
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- modules
drop policy if exists "modules public read" on lucianails.modules;
drop policy if exists "modules admin"       on lucianails.modules;
create policy "modules public read" on lucianails.modules for select using (true);
create policy "modules admin" on lucianails.modules
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- lessons
drop policy if exists "lessons public read" on lucianails.lessons;
drop policy if exists "lessons admin"       on lucianails.lessons;
create policy "lessons public read" on lucianails.lessons for select using (true);
create policy "lessons admin" on lucianails.lessons
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- subscriptions
drop policy if exists "subs self read" on lucianails.subscriptions;
drop policy if exists "subs admin"     on lucianails.subscriptions;
create policy "subs self read" on lucianails.subscriptions
  for select using (user_id = auth.uid() or lucianails.is_admin());
create policy "subs admin" on lucianails.subscriptions
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- course_purchases
drop policy if exists "purchases self read" on lucianails.course_purchases;
drop policy if exists "purchases admin"     on lucianails.course_purchases;
create policy "purchases self read" on lucianails.course_purchases
  for select using (user_id = auth.uid() or lucianails.is_admin());
create policy "purchases admin" on lucianails.course_purchases
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- payments
drop policy if exists "payments self read" on lucianails.payments;
drop policy if exists "payments admin"     on lucianails.payments;
create policy "payments self read" on lucianails.payments
  for select using (user_id = auth.uid() or lucianails.is_admin());
create policy "payments admin" on lucianails.payments
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- lesson_progress
drop policy if exists "progress self all" on lucianails.lesson_progress;
drop policy if exists "progress admin"    on lucianails.lesson_progress;
create policy "progress self all" on lucianails.lesson_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress admin"    on lucianails.lesson_progress
  for select using (lucianails.is_admin());

-- posts
drop policy if exists "posts read"          on lucianails.posts;
drop policy if exists "posts member insert" on lucianails.posts;
drop policy if exists "posts self update"   on lucianails.posts;
drop policy if exists "posts admin"         on lucianails.posts;
create policy "posts read"          on lucianails.posts for select using (true);
create policy "posts member insert" on lucianails.posts
  for insert with check (auth.uid() = author_id);
create policy "posts self update"   on lucianails.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "posts admin"         on lucianails.posts
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- comments
drop policy if exists "comments read"          on lucianails.post_comments;
drop policy if exists "comments member insert" on lucianails.post_comments;
drop policy if exists "comments self update"   on lucianails.post_comments;
drop policy if exists "comments admin"         on lucianails.post_comments;
create policy "comments read"          on lucianails.post_comments for select using (true);
create policy "comments member insert" on lucianails.post_comments
  for insert with check (auth.uid() = author_id);
create policy "comments self update"   on lucianails.post_comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "comments admin"         on lucianails.post_comments
  for all using (lucianails.is_admin()) with check (lucianails.is_admin());

-- likes
drop policy if exists "likes read" on lucianails.post_likes;
drop policy if exists "likes self" on lucianails.post_likes;
create policy "likes read" on lucianails.post_likes for select using (true);
create policy "likes self" on lucianails.post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
