-- Migration 002: Add extra columns to alerts table
alter table public.alerts add column if not exists drawing_id uuid;
alter table public.alerts add column if not exists change_count int default 0;
alter table public.alerts add column if not exists change_percentage numeric(5,2) default 0;

-- Run this in Supabase SQL Editor after the main schema
