-- Run this in your Supabase SQL Editor
create table if not exists waitlist (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  company text,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

create policy "Anyone can insert into waitlist"
  on waitlist for insert
  with check (true);

create policy "Only authenticated users can view waitlist"
  on waitlist for select
  using (auth.role() = 'authenticated');

grant usage on schema public to anon;
grant insert on public.waitlist to anon;
