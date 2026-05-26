-- ─────────────────────────────────────────────────────────────────────────────
-- Tag conversations with product_slug so Edu dialogues can be filtered
-- Run in Supabase SQL Editor after 20260526_book_subscriber.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Tag conversations by product so admin can filter Edu vs ADG dialogues
ALTER TABLE coach_conversations
  ADD COLUMN IF NOT EXISTS product_slug TEXT NOT NULL DEFAULT 'adg';

-- Link chunks back to their source document for clean deletes
ALTER TABLE coach_chunks
  ADD COLUMN IF NOT EXISTS document_id BIGINT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_coach_conversations_slug
  ON coach_conversations (product_slug);

-- Edu documents table: stores named text blocks for the book KB.
-- Each document gets chunked + embedded into coach_chunks with source = product_slug.
CREATE TABLE IF NOT EXISTS edu_documents (
  id           bigserial PRIMARY KEY,
  product_slug TEXT        NOT NULL DEFAULT 'child-education',
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  chunk_count  INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_documents_slug
  ON edu_documents (product_slug);
