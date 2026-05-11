-- Add marketing consent to coach_leads.
-- Defaults to false — opt-in must be explicit.
begin;

alter table public.coach_leads
  add column if not exists consent_marketing boolean not null default false;

commit;
