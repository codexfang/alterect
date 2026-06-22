-- Alterect Database Schema
-- Run this in Supabase SQL Editor

-- 1. PROFILES (syncs with auth.users via trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  company text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. USER PREFERENCES
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trade_filters text[] default '{}',
  theme text default 'light',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 3. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text,
  status text default 'active' check (status in ('active', 'archived', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. DRAWINGS
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sheet_name text not null,
  discipline text check (discipline in ('architectural', 'structural', 'electrical', 'mechanical', 'plumbing', 'civil', 'other')),
  current_revision int default 0,
  file_url text,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. REVISIONS
create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  revision_number int not null,
  file_url text not null,
  uploaded_by uuid not null references public.profiles(id),
  change_count int default 0,
  notes text,
  created_at timestamptz default now(),
  unique(drawing_id, revision_number)
);

-- 6. CHANGES (detected between revisions)
create table if not exists public.changes (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  from_revision_id uuid references public.revisions(id),
  to_revision_id uuid not null references public.revisions(id),
  change_type text not null check (change_type in ('added', 'removed', 'modified', 'relocated', 'resized')),
  trade text not null check (trade in ('electrical', 'plumbing', 'structural', 'hvac', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high')),
  description text not null,
  coordinates jsonb,
  sheet_name text,
  floor text,
  created_at timestamptz default now()
);

-- 7. ALERTS
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  change_id uuid references public.changes(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  drawing_id uuid,
  title text not null,
  description text,
  trade text not null,
  sheet_name text,
  revision text,
  severity text check (severity in ('low', 'medium', 'high')),
  change_count int default 0,
  change_percentage numeric(5,2) default 0,
  read boolean default false,
  created_at timestamptz default now()
);

-- 8. INTEGRATIONS
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('dropbox', 'box', 'procore', 'bim360', 'slack')),
  access_token text,
  refresh_token text,
  connected boolean default false,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.projects enable row level security;
alter table public.drawings enable row level security;
alter table public.revisions enable row level security;
alter table public.changes enable row level security;
alter table public.alerts enable row level security;
alter table public.integrations enable row level security;

-- RLS policies: users can only see their own data
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can manage own preferences"
  on public.user_preferences for all using (auth.uid() = user_id);

create policy "Users can manage own projects"
  on public.projects for all using (auth.uid() = user_id);

create policy "Users can manage own drawings"
  on public.drawings for all using (auth.uid() = user_id);

create policy "Users can manage own revisions"
  on public.revisions for all using (
    auth.uid() = (select user_id from public.drawings where id = drawing_id)
  );

create policy "Users can manage own changes"
  on public.changes for all using (
    auth.uid() = (select user_id from public.drawings where id = drawing_id)
  );

create policy "Users can manage own alerts"
  on public.alerts for all using (auth.uid() = user_id);

create policy "Users can manage own integrations"
  on public.integrations for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_drawings_project on public.drawings(project_id);
create index if not exists idx_drawings_user on public.drawings(user_id);
create index if not exists idx_revisions_drawing on public.revisions(drawing_id);
create index if not exists idx_changes_drawing on public.changes(drawing_id);
create index if not exists idx_alerts_user on public.alerts(user_id);
create index if not exists idx_alerts_read on public.alerts(user_id, read);
