# 📘 Database Schema Review & Recommendations (MVP → Enterprise-Ready)

**Scope:** Thorough analysis of the current schema and concrete, migration-safe improvements.  
**Goals:** Unify identity, harden auth (Device Flow + Passkeys + DPoP), simplify polls/votes, enforce privacy, and keep MVP velocity with an easy path to scale.

---

## 🔝 Executive Summary — Top Fixes

1. **Unify identity model.** Adopt a single canonical `users` table (UUID PK). Migrate all FKs away from `stable_id` indirection unless you explicitly need a public handle.  
2. **Consolidate polls/votes.** You have two parallel systems; choose the richer `polls/votes` and migrate; remove the duplicate tables to avoid drift.  
3. **WebAuthn storage.** Rename `biometric_credentials` → `webauthn_credentials`; store **binary IDs (BYTEA)** and metadata: **AAGUID, COSE key, transports, backup state**, `sign_count BIGINT`.  
4. **Device Flow hardening.** Store **hashes** of `device_code`/`user_code`; add `interval`, poll telemetry, TTL indices.  
5. **Token/session safety.** Hash **all** tokens; bind to **DPoP `jkt`**; add `revoked_at`, rotation lineage. Avoid plaintext session tokens.  
6. **RLS correctness.** Standardize on **one principal** (`auth.uid()` or a single JWT claim). Ensure each per-user table has a `user_id` FK for row ownership.  
7. **Privacy & retention.** Hash or bucket IPs, hash UAs, add purge jobs and retention windows.  
8. **Type hygiene.** Replace ad‑hoc string `CHECK`s with **ENUMs**; fix name mismatches; add `updated_at` triggers.

---

## 🧩 Identity & Keys (Critical)

### Problems
- Split-brain identity across `ia_users(stable_id)` and `auth.users(id)` with multiple `user_profiles` flavors.

### Recommendations
- **Single source of truth**: `users (UUID PRIMARY KEY)`. If on Supabase, **alias to `auth.users`**.  
- Keep a **public handle** if needed: computed `stable_id` or user-editable `handle` (unique).  
- Migrate all child FKs to `users.id`.

### Example (bridge & migration)
```sql
-- Temporary bridge view if needed
CREATE OR REPLACE VIEW users AS
SELECT id, email, created_at FROM auth.users;

-- Add user_id UUID to child tables and backfill from existing stable_id mapping
ALTER TABLE user_profiles ADD COLUMN user_id UUID;
-- UPDATE user_profiles u SET user_id = m.user_id FROM id_map m WHERE u.stable_id = m.stable_id;
ALTER TABLE user_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id);
```

---

## 🔐 WebAuthn Credentials (High)

### Problems
- Table named `biometric_credentials`; `credential_id` stored as `TEXT`; missing AAGUID/COSE/transport/backup flags; `sign_count` too small.

### Recommendations
- **Rename & extend**; store binary identifiers and metadata; guarantee uniqueness per user.

```sql
ALTER TABLE biometric_credentials RENAME TO webauthn_credentials;

ALTER TABLE webauthn_credentials
  ALTER COLUMN credential_id TYPE BYTEA USING decode(credential_id, 'hex'),
  ADD COLUMN aaguid UUID,
  ADD COLUMN cose_public_key BYTEA,
  ADD COLUMN transports TEXT[] DEFAULT '{}',
  ADD COLUMN backup_eligible BOOLEAN DEFAULT FALSE,
  ADD COLUMN backup_state BOOLEAN DEFAULT FALSE,
  ADD COLUMN last_uv_result BOOLEAN,
  ALTER COLUMN sign_count TYPE BIGINT;

CREATE UNIQUE INDEX uq_webauthn_user_cred ON webauthn_credentials (user_id, credential_id);
CREATE INDEX idx_webauthn_aaguid ON webauthn_credentials (aaguid);
```

**App logic:** detect **sign_count regressions** (possible cloning), store `last_used_at`, and reject cloned credentials gracefully with recovery UX.

---

## 📟 Device Authorization Flow (High)

### Problems
- Raw `device_code`/`user_code` stored in plaintext; no poll telemetry; weak code length.

### Recommendations
- Store **hashes** only; add telemetry; lengthen codes; index TTL.

```sql
ALTER TABLE device_flows
  ADD COLUMN device_code_hash BYTEA,
  ADD COLUMN user_code_hash BYTEA,
  ADD COLUMN interval_seconds INT DEFAULT 5,
  ADD COLUMN last_polled_at TIMESTAMPTZ,
  ADD COLUMN poll_count INT DEFAULT 0;

CREATE INDEX idx_device_flows_expires ON device_flows (expires_at);
CREATE INDEX idx_device_flows_user_code_hash ON device_flows (user_code_hash);
```

**Migration note:** dual-write (plaintext + hash) for one release, then drop plaintext columns and uniqueness on hashes only.

---

## 🔑 Tokens, Sessions & DPoP (High)

### Problems
- Token tables overlap; refresh/access not **sender-constrained**; sessions may store **raw tokens**; limited rotation metadata.

### Recommendations
- Normalize token storage; hash all bearer material; bind to **DPoP**.

```sql
-- DPoP binding (SHA-256 JWK thumbprint)
ALTER TABLE ia_tokens
  ADD COLUMN dpop_jkt TEXT,
  ADD COLUMN rotated_from UUID,
  ADD COLUMN revoked_at TIMESTAMPTZ;
CREATE INDEX idx_tokens_user_expires ON ia_tokens (user_stable_id, expires_at);
CREATE INDEX idx_tokens_jkt ON ia_tokens (dpop_jkt);

-- Session safety
ALTER TABLE user_sessions
  ALTER COLUMN session_token TYPE TEXT,            -- store a hash, not raw
  ADD COLUMN dpop_jkt TEXT,
  ADD COLUMN last_rotated_at TIMESTAMPTZ;
```

**Policy:** refresh tokens are DPoP‑bound too; maintain a **5‑minute replay cache** for DPoP `jti` (Redis free-tier OK).

---

## 🗳️ Polls & Votes Model (High)

### Problems
- Duplicate systems (`po_*` vs `polls/votes`); JSON payloads lack schema enforcement; time windows not validated.

### Recommendations
- Standardize on **one** model (prefer the richer `polls/votes`).  
- Use **ENUMs** for core settings; enforce time validity; add vote payload checks.

```sql
CREATE TYPE voting_method_enum AS ENUM ('single','approval','ranked','quadratic','range');
CREATE TYPE privacy_level_enum AS ENUM ('public','private','high-privacy');
CREATE TYPE poll_status_enum AS ENUM ('draft','active','closed','archived');

ALTER TABLE polls
  ALTER COLUMN voting_method TYPE voting_method_enum USING voting_method::voting_method_enum,
  ALTER COLUMN privacy_level TYPE privacy_level_enum USING privacy_level::privacy_level_enum,
  ALTER COLUMN status TYPE poll_status_enum USING status::poll_status_enum,
  ADD CONSTRAINT poll_time_valid CHECK (start_time < end_time);

-- Example JSON shape guard (ranked)
ALTER TABLE votes
  ADD CONSTRAINT vote_data_shape_ranked
  CHECK (voting_method <> 'ranked' OR (vote_data ? 'ranking' AND jsonb_typeof(vote_data->'ranking')='array'));
```

**Indexes:** `(poll_id, created_at)`, `(created_by, status)`, and GIN on `vote_data` if queried.

---

## 🛡️ RLS (Row-Level Security) (High)

### Problems
- Mixed principal derivations; some tables lack owner FKs; public aggregation vs per‑vote privacy tension.

### Recommendations
- Standardize on **`auth.uid()`** (or one JWT claim).  
- Ensure every per-user row has a `user_id UUID NOT NULL` FK to the canonical `users`.  
- Separate policies for **read own**, **write own**, **aggregate public**.

```sql
-- Owner visibility
CREATE POLICY votes_read_own ON votes
  FOR SELECT USING (user_id = auth.uid());

-- Public aggregates when allowed
CREATE POLICY votes_read_aggregate ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = votes.poll_id
        AND (p.status='closed' OR p.privacy_level='public')
    )
  ) WITH CHECK (false);
```

Use service role (or security definer functions) for admin tasks; keep the surface minimal.

---

## 🧹 Privacy, Logging & Retention (Medium)

### Problems
- Raw IP and UA kept indefinitely in `votes`/`user_sessions`; analytics may accumulate sensitive context.

### Recommendations
- Hash or bucket IPs; hash UA; add retention windows and purge jobs.

```sql
ALTER TABLE user_sessions
  ADD COLUMN ip_hash TEXT,
  ADD COLUMN ua_hash TEXT;
-- Migrate existing records, then drop raw IP/UA or move to TTL shadow table
```

- Cron jobs to purge raw data after N days; retain only necessary aggregates.

---

## 🧱 Type Consistency & Naming (Medium)

### Problems
- Duplicated `user_profiles`; string `CHECK`s for enumerations; inconsistent naming.

### Recommendations
- One `user_profiles` table keyed by `user_id`.  
- Convert recurring string sets to **ENUMs**.  
- Add `updated_at` triggers to all mutable tables.

```sql
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_polls_updated BEFORE UPDATE ON polls
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 🚀 Indexing & Performance (Medium)

- Add GIN indexes for `vote_data` and analytics JSON where queried.  
- Use partial indexes for hot paths (e.g., `WHERE status='active'`).  
- Add covering composites for time‑bounded queries: `(created_by, status, start_time)`.

---

## 🗺️ Migration Plan (Safe & Incremental)

1. **Freeze** writes to legacy tables (`po_*`, duplicate `user_profiles`).  
2. **Introduce canonical `users (UUID)`** or view alias; backfill `user_id` in children.  
3. **Dual‑write** hashed device flow codes; after one release, drop plaintext & add unique on hashes.  
4. **Rename/extend WebAuthn table**; convert IDs to `BYTEA`, add metadata.  
5. **Normalize tokens/sessions**; add DPoP `jkt`, rotation lineage, revocation.  
6. **Consolidate polls/votes**; add enums and JSON shape guards.  
7. **RLS v2 rollout**; test with matrix of roles and endpoints.  
8. **Privacy purge jobs**; verify retention SLAs.  
9. **Remove legacy** artifacts after verification & backup.

---

## 🧰 Optional Enhancements (Future-Ready)

- **VC / SD‑JWT handles:** store only proof handles/decision IDs for IDV (no documents).  
- **DPoP replay ledger:** small table keyed by (`jti`,`jkt`,`exp`) if Redis is unavailable.  
- **Dedicated tables for quadratic/ranked ballots** if JSON checks grow complex.

---

## ✅ Sanity Checks / Test Matrix

- **RLS:** owner/non‑owner/service role for each table.  
- **Device Flow:** codes non‑retrievable; `interval_seconds` enforced; poll rate limits.  
- **WebAuthn:** multiple credentials/user; detect `sign_count` regressions.  
- **Votes:** one vote per (poll,user) constraint; payload shape per method.  
- **Purge jobs:** TTL on `device_flows`, old `user_sessions` raw artifacts.

---

## 📎 Appendices — DDL Snippets

### A) ENUMs
```sql
CREATE TYPE voting_method_enum AS ENUM ('single','approval','ranked','quadratic','range');
CREATE TYPE privacy_level_enum AS ENUM ('public','private','high-privacy');
CREATE TYPE poll_status_enum AS ENUM ('draft','active','closed','archived');
```

### B) Unique Vote Constraint
```sql
ALTER TABLE votes
  ADD CONSTRAINT uq_vote_one_per_user UNIQUE (poll_id, user_id);
```

### C) DPoP Replay Cache (table fallback)
```sql
CREATE TABLE dpop_replay_guard (
  jti TEXT PRIMARY KEY,
  jkt TEXT NOT NULL,
  htm TEXT NOT NULL,
  htu TEXT NOT NULL,
  iat TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON dpop_replay_guard (expires_at);
```

---

## 📌 Next Actions (Suggested)

- Ship **hashed device flow** + telemetry.  
- Rename/extend **WebAuthn** table; migrate existing credentials.  
- Normalize **tokens/sessions** with DPoP `jkt`.  
- Consolidate **polls/votes** and add enums/shape guards.  
- Implement **RLS v2** and **privacy purge** jobs.

---

## ❓ Follow‑Up Questions

**Q1**  

Would you like me to generate **up/down migration SQL** packs for: identity unification, WebAuthn table changes, device flow hashing, and polls/votes consolidation?

  
**Q2**  

Do you want a **minimal ER diagram** and **RLS policy map** (per role → tables/operations) added to this document for onboarding?

  
**Q3**  

Should I include a **privacy data map** (columns × purpose × retention × lawful basis) to formalize purge jobs and compliance?
