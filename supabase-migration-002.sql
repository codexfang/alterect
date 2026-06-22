-- Migration 002: Add extra columns + risk_scores table

-- Alerts columns
alter table public.alerts add column if not exists drawing_id uuid;
alter table public.alerts add column if not exists change_count int default 0;
alter table public.alerts add column if not exists change_percentage numeric(5,2) default 0;
alter table public.alerts add column if not exists project_name text;

-- Risk scores table
create table if not exists public.risk_scores (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid,
  sheet_name text,
  from_revision_number int,
  to_revision_number int,
  change_count int default 0,
  change_percentage numeric(5,2) default 0,
  score int not null,
  level text not null check (level in ('low', 'medium', 'high')),
  factors jsonb default '[]',
  recommendation text,
  created_at timestamptz default now()
);

alter table public.risk_scores enable row level security;

create policy "Users can view own risk scores"
  on public.risk_scores for select using (auth.uid() = user_id);

create policy "Users can insert own risk scores"
  on public.risk_scores for insert with check (auth.uid() = user_id);

-- Run this in Supabase SQL Editor
