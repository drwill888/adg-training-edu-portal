-- ─────────────────────────────────────────────────────────────────────────────
-- Product Subscriber Access Layer (supports multiple books / products)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
--
-- product_slug values used so far:
--   'child-education'  → "How to Educate Your Child"
--   (add new slugs here as new books launch)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add access columns to the existing payments table
alter table payments
  add column if not exists access_type       text    default 'adg',
  add column if not exists access_expires_at timestamptz default null;

-- Index for fast access checks
create index if not exists idx_payments_email_access
  on payments (email, access_type, access_expires_at);

-- 2. Add source column to coach_chunks so each product's content is filterable.
--    Existing ADG rows default to 'adg'. Each book uses its own slug.
alter table coach_chunks
  add column if not exists source text not null default 'adg';

create index if not exists idx_coach_chunks_source
  on coach_chunks (source);

-- 3. Update match_coach_chunks RPC to accept an optional source filter.
drop function if exists match_coach_chunks(vector, int);
drop function if exists match_coach_chunks(vector, int, text);

create or replace function match_coach_chunks(
  query_embedding vector(1536),
  match_count     int,
  filter_source   text default null
)
returns table (
  id         bigint,
  content    text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    coach_chunks.id,
    coach_chunks.content,
    1 - (coach_chunks.embedding <=> query_embedding) as similarity
  from coach_chunks
  where
    filter_source is null or coach_chunks.source = filter_source
  order by coach_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 4. Product daily usage table — one table for ALL products, filtered by product_slug.
--    To add a new book, just use a new slug — no new table needed.
create table if not exists product_daily_usage (
  id           bigserial primary key,
  email        text        not null,
  product_slug text        not null,
  date         date        not null default current_date,
  count        int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (email, product_slug, date)
);

create index if not exists idx_product_daily_usage_lookup
  on product_daily_usage (email, product_slug, date);

-- Helper: upsert a daily usage row and return the new count.
create or replace function increment_product_usage(p_email text, p_slug text)
returns int
language plpgsql
as $$
declare
  new_count int;
begin
  insert into product_daily_usage (email, product_slug, date, count)
  values (p_email, p_slug, current_date, 1)
  on conflict (email, product_slug, date)
  do update set
    count      = product_daily_usage.count + 1,
    updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;
