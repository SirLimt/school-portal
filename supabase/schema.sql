-- Young Executive School Complex Portal — database schema
-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- One row per user, created automatically when someone signs up.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('student', 'teacher', 'admin', 'parent')),
  reg_number text,
  created_at timestamptz default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references profiles(id),
  room text,
  period text,
  time_range text
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  due_date date
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  grade text not null,
  updated_at timestamptz default now(),
  unique (student_id, class_id)
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  date date not null default current_date,
  present boolean not null default true,
  unique (class_id, student_id, date)
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  text text not null,
  pinned boolean default false,
  created_at timestamptz default now()
);

-- Links a parent account to their child's student account.
create table parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references profiles(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade
);

-- Registration numbers an admin pre-issues to students, so only students
-- with a valid, unused number can create an account (like a UCC-style
-- registration number + password login).
create table registration_codes (
  code text primary key,
  used boolean not null default false,
  used_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Helper: looks up the caller's own role without recursive RLS checks.
create or replace function my_role() returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Turn on Row Level Security everywhere.
alter table profiles enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;
alter table assignments enable row level security;
alter table grades enable row level security;
alter table attendance enable row level security;
alter table announcements enable row level security;
alter table parent_links enable row level security;
alter table registration_codes enable row level security;

-- Profiles: anyone signed in can look up names (needed for rosters/directories);
-- only admins or the user themself can change a profile.
create policy "profiles readable by authenticated" on profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles editable by self or admin" on profiles
  for update using (id = auth.uid() or my_role() = 'admin');

-- Classes/enrollments/assignments: readable by anyone signed in (simplifies rosters);
-- only teachers/admins can create or edit.
create policy "classes readable" on classes for select using (auth.role() = 'authenticated');
create policy "classes writable by staff" on classes for insert with check (my_role() in ('teacher','admin'));
create policy "classes updatable by staff" on classes for update using (my_role() in ('teacher','admin'));
create policy "classes deletable by staff" on classes for delete using (my_role() in ('teacher','admin'));

create policy "enrollments readable" on enrollments for select using (auth.role() = 'authenticated');
create policy "enrollments writable by staff" on enrollments for insert with check (my_role() in ('teacher','admin'));
create policy "enrollments deletable by staff" on enrollments for delete using (my_role() in ('teacher','admin'));

create policy "assignments readable" on assignments for select using (auth.role() = 'authenticated');
create policy "assignments writable by staff" on assignments for all using (my_role() in ('teacher','admin'));

-- Grades: a student sees only their own; a linked parent sees their child's; staff sees all.
create policy "grades readable" on grades for select using (
  student_id = auth.uid()
  or my_role() in ('teacher','admin')
  or exists (select 1 from parent_links pl where pl.student_id = grades.student_id and pl.parent_id = auth.uid())
);
create policy "grades writable by staff" on grades for all using (my_role() in ('teacher','admin'));

-- Attendance: same visibility pattern as grades; only staff can record it.
create policy "attendance readable" on attendance for select using (
  student_id = auth.uid()
  or my_role() in ('teacher','admin')
  or exists (select 1 from parent_links pl where pl.student_id = attendance.student_id and pl.parent_id = auth.uid())
);
create policy "attendance writable by staff" on attendance for all using (my_role() in ('teacher','admin'));

-- Announcements: everyone signed in can read; only staff can post.
create policy "announcements readable" on announcements for select using (auth.role() = 'authenticated');
create policy "announcements writable by staff" on announcements for insert with check (my_role() in ('teacher','admin'));

-- Parent links: a parent can see their own links; staff can see/manage all.
create policy "parent_links readable" on parent_links for select using (
  parent_id = auth.uid() or my_role() = 'admin'
);
create policy "parent_links writable by admin" on parent_links for all using (my_role() = 'admin');

-- Registration codes: only admins can view or manage the list directly.
-- Students never query this table themselves — they go through the
-- claim_registration_code() function below instead.
create policy "registration_codes readable by admin" on registration_codes
  for select using (my_role() = 'admin');
create policy "registration_codes writable by admin" on registration_codes
  for all using (my_role() = 'admin');

-- Automatically create a profile row whenever someone signs up.
-- The role and full_name are passed in from the sign-up form as user metadata.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, reg_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'reg_number'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Called during student sign-up, before the account is created, to check a
-- registration number is real and hasn't been used yet, and reserve it.
-- Runs with elevated privileges (security definer) so it works even though
-- the person isn't signed in yet — that's safe here because it can only
-- flip one row from unused to used, nothing else.
create or replace function claim_registration_code(p_code text) returns boolean as $$
declare
  claimed boolean;
begin
  update registration_codes
  set used = true
  where code = p_code and used = false;
  get diagnostics claimed = row_count;
  return claimed > 0;
end;
$$ language plpgsql security definer;

grant execute on function claim_registration_code(text) to anon, authenticated;

-- Rolls a registration number back to unused if account creation failed
-- after it was claimed, so it can be tried again.
create or replace function release_registration_code(p_code text) returns void as $$
begin
  update registration_codes set used = false where code = p_code;
end;
$$ language plpgsql security definer;

grant execute on function release_registration_code(text) to anon, authenticated;
