# Candidate Onboarding, Filing Support, and Fast-Track Verification

## Vision
Create an inclusive, high-trust pathway for civically minded users to run for office. Streamline the filing prerequisites, guide them through verification, and provide a personalized public page. Fast-track existing representatives who sign up with their official email.

## Goals
- Equip prospective candidates with clear steps to meet filing requirements.
- Verify identity and candidacy with minimal friction and high integrity.
- Publish candidate profiles as first-class entities, discoverable like any representative.
- Fast-track sitting representatives who sign up using their official email on file.

## User Journeys
- New candidate:
  1) Auth → Start onboarding → Guided filing prerequisites → Verification → Publish profile → Appear in search/feeds.
- Sitting representative (fast-track):
  1) Auth with official email → Auto/assisted verification → Claim representative record → Personalized page unlocked.

## Scope
- Database schema for candidates, onboarding, verifications, and official-email mapping.
- Server APIs: start onboarding, update profile, verify via gov email, public profile read.
- UI: candidate personalized page; onboarding entry; admin QA/overrides.
- Integration: candidates appear in electoral feeds and representative lookups as appropriate.

## Data Model (Supabase)
- public.candidate_profiles
  - id uuid PK, user_id uuid FK auth.users, slug text UNIQUE
  - display_name text, office text, jurisdiction text, party text
  - bio text, website text, social jsonb
  - filing_status text check in ('not_started','in_progress','filed','verified')
  - is_public boolean default false
  - representative_id int FK representatives_core.id (nullable; set on fast-track)
  - created_at, updated_at
- public.candidate_onboarding
  - id uuid PK, candidate_id uuid FK candidate_profiles.id
  - step text, completed boolean default false
  - started_at, updated_at
- public.candidate_verifications
  - id uuid PK, candidate_id uuid FK candidate_profiles.id
  - method text check in ('gov_email','document','manual')
  - status text check in ('pending','in_progress','verified','rejected')
  - evidence jsonb, updated_at
- public.official_email_fast_track
  - id uuid PK, representative_id int FK representatives_core.id
  - email text, domain text, verified boolean default false
  - last_attempt_at timestamptz

Notes:
- RLS: user_id can read/write own rows; public can read candidates where is_public = true.
- Indices on slug, user_id, representative_id.

## API Contracts
- POST /api/candidates/onboard
  - Auth required. Creates candidate_profile if missing; starts onboarding. Returns slug and state.
- POST /api/candidates/verify/official-email
  - Auth required. If user email matches representative primary_email or domain from representatives_core/official_email_fast_track, mark verification and link representative_id.
- GET /api/candidates/[slug]
  - Public profile (if is_public). Includes basic fields and verification/filing status summary.
- PATCH /api/candidates/[slug]
  - Auth required; owner only. Update profile fields and publishing flag (is_public).

## UI/UX
- Add entry point in user menu: “I’m running for office”.
- Onboarding wizard: prerequisites checklist, links to filing resources (by jurisdiction), upload/attest documents.
- Personalized candidate page: hero (name, office, party), overview (bio, site, socials), verification badge, filing status, contact.
- Fast-track UX: confirm identity against representative record; show success and claim controls.

## Integration
- Electoral feed: include candidate profiles as challengers when jurisdiction/office align.
- Representative lookup: show candidate cards under upcoming elections.
- Admin monitoring: add counters for candidate profiles and verification statuses; QA for domain matches.

## Risks & Mitigations
- False positives on email domain matches → require explicit confirmation + optional code email.
- Privacy concerns → clear consent, is_public toggle, minimal PII.
- Jurisdiction misalignment → validate office/jurisdiction against known divisions.

## Rollout Plan
1) Schema + types
2) API + RLS
3) Public page + owner edit
4) Fast-track endpoint
5) Feed/lookup integration
6) Admin stats/QA

## Metrics
- Number of onboarding starts/completions
- Time-to-verified for candidates and fast-tracked reps
- Conversion to public profiles
*** End Patch

