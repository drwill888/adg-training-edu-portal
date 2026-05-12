-- =================================================================
-- Website Coaching Agent — Schema
-- Migration: 20260511000001_coach_schema.sql
-- All objects are additive — nothing existing is modified.
-- Run inside a transaction (begin / commit).
-- =================================================================

begin;

-- Requires pgvector. Enable under Supabase → Database → Extensions
-- if the line below errors.
create extension if not exists vector;

-- -----------------------------------------------------------------
-- coach_documents
-- Source documents ingested into the knowledge base.
-- -----------------------------------------------------------------
create table if not exists public.coach_documents (
  id         uuid    primary key default gen_random_uuid(),
  title      text    not null,
  source     text,
  content    text    not null,
  metadata   jsonb   not null default '{}',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------
-- coach_chunks
-- Vector chunks derived from coach_documents.
-- -----------------------------------------------------------------
create table if not exists public.coach_chunks (
  id          uuid    primary key default gen_random_uuid(),
  document_id uuid    references public.coach_documents(id) on delete cascade,
  content     text    not null,
  embedding   vector(1536),
  chunk_index integer,
  metadata    jsonb   not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists idx_coach_chunks_document_id
  on public.coach_chunks (document_id);

-- -----------------------------------------------------------------
-- coach_conversations
-- One row per website visitor session.
-- -----------------------------------------------------------------
create table if not exists public.coach_conversations (
  id                    uuid    primary key default gen_random_uuid(),
  session_id            text    not null,
  summary               text,
  primary_5c            text,
  recommended_next_step text,
  lead_id               uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_coach_conversations_session_id
  on public.coach_conversations (session_id);

-- -----------------------------------------------------------------
-- coach_messages
-- Individual turns within a conversation.
-- -----------------------------------------------------------------
create table if not exists public.coach_messages (
  id              uuid  primary key default gen_random_uuid(),
  conversation_id uuid  references public.coach_conversations(id) on delete cascade,
  role            text  not null check (role in ('user', 'assistant')),
  content         text  not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_coach_messages_conversation_id
  on public.coach_messages (conversation_id);

-- -----------------------------------------------------------------
-- coach_leads
-- Captured visitor contact info.
-- -----------------------------------------------------------------
create table if not exists public.coach_leads (
  id              uuid  primary key default gen_random_uuid(),
  conversation_id uuid  references public.coach_conversations(id) on delete set null,
  first_name      text,
  email           text  not null,
  interest        text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_coach_leads_email
  on public.coach_leads (email);

-- Back-reference from conversations → leads
alter table public.coach_conversations
  add constraint fk_coach_conversations_lead
  foreign key (lead_id) references public.coach_leads(id) on delete set null;

-- -----------------------------------------------------------------
-- match_coach_chunks
-- Vector similarity search used by the retrieval layer.
-- -----------------------------------------------------------------
create or replace function public.match_coach_chunks(
  query_embedding vector(1536),
  match_count     integer default 5
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.coach_chunks c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

commit;
