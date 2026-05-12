-- =================================================================
-- Coach Usage tracking — for governor (wallet cap, per-IP, per-email)
-- Migration: 20260512000002_coach_usage.sql
-- =================================================================

begin;

create table if not exists public.coach_usage (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid references public.coach_conversations(id) on delete set null,
  ip_hash           text,
  email             text,
  model             text,
  prompt_tokens     integer not null default 0,
  completion_tokens integer not null default 0,
  cost_usd          numeric(10, 6) not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists idx_coach_usage_created_at
  on public.coach_usage (created_at desc);

create index if not exists idx_coach_usage_ip_hash_created_at
  on public.coach_usage (ip_hash, created_at desc);

create index if not exists idx_coach_usage_email_created_at
  on public.coach_usage (email, created_at desc);

commit;
