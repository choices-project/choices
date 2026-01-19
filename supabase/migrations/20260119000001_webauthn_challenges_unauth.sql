-- Allow unauthenticated WebAuthn authentication challenges.
-- Align schema with runtime usage (rp_id/kind/used_at/metadata) and allow null user_id.

alter table if exists public.webauthn_challenges
  add column if not exists rp_id text,
  add column if not exists kind text,
  add column if not exists used_at timestamptz,
  add column if not exists metadata jsonb;

alter table if exists public.webauthn_challenges
  alter column user_id drop not null;

create index if not exists webauthn_challenges_kind_used_at_idx
  on public.webauthn_challenges (kind, used_at);
