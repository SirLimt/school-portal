-- Run this in your Supabase SQL Editor. It only adds the new pieces needed
-- for registration-number sign-in — safe to run even though your database
-- already has the original schema.sql applied.

alter table profiles add column if not exists reg_number text;

create table if not exists registration_codes (
  code text primary key,
  used boolean not null default false,
  used_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table registration_codes enable row level security;

drop policy if exists "registration_codes readable by admin" on registration_codes;
create policy "registration_codes readable by admin" on registration_codes
  for select using (my_role() = 'admin');

drop policy if exists "registration_codes writable by admin" on registration_codes;
create policy "registration_codes writable by admin" on registration_codes
  for all using (my_role() = 'admin');

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

create or replace function release_registration_code(p_code text) returns void as $$
begin
  update registration_codes set used = false where code = p_code;
end;
$$ language plpgsql security definer;

grant execute on function release_registration_code(text) to anon, authenticated;

-- Update the sign-up trigger so it also stores the registration number
-- when a student signs up with one.
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
