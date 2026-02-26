# Database Schema

**Reference for civics ingest tables.** All foreign keys → `representatives_core.id` with ON DELETE CASCADE unless noted.

---

## Core Tables

### `representatives_core`
Primary table. `level`: `federal` | `state` | `local`. `status`: `active` | `inactive` | `historical`.

| Column | Type | Notes |
|--------|------|-------|
| id | integer | PK |
| name, office, level, state, party, district | varchar | Required where listed |
| status | varchar | active/inactive/historical |
| openstates_id | varchar | Unique; required for OpenStates API |
| bioguide_id, fec_id | varchar | Federal only |
| canonical_id, congress_gov_id, govinfo_id | varchar | Identifiers |
| primary_email, primary_phone, primary_website, primary_photo_url | varchar | Denormalized contact |
| twitter_handle, facebook_url, instagram_handle, youtube_channel, linkedin_url | varchar | Denormalized social |
| term_start_date, term_end_date, next_election_date | date | |
| data_quality_score | integer | 0–100 |
| replaced_by_id | integer | FK → self (ON DELETE SET NULL) |
| created_at, updated_at | timestamptz | |

### `representative_committees`
From OpenStates API. `representative_id` FK.

| Column | Type |
|--------|------|
| representative_id, committee_name, role | |
| start_date, end_date | date |
| is_current | boolean |

### `representative_activity`
Bill sponsorships, votes. From OpenStates API. Unique: `(representative_id, type, title, date)`.

| Column | Type |
|--------|------|
| representative_id, type, title, description | |
| date, source, source_url, url | |

### `representative_campaign_finance`
From FEC. One row per representative (unique on `representative_id`).

| Column | Type |
|--------|------|
| representative_id, cycle | integer |
| total_raised, total_spent, cash_on_hand | numeric |
| last_filing_date | date |
| top_contributors | jsonb |

### `representative_contacts`
Contact_type: `email` | `phone` | `address` | `fax`. Unique: `(representative_id, contact_type)`. User submissions: `submitted_by_user_id`, `rejected_at`, `rejection_reason` (migration `20260224000000`).

### `representative_social_media`
Platform, handle, url. From YAML.

### `representative_photos`
Url, source, is_primary. Unique: `(representative_id, source)`.

### `representative_divisions`
OCD division mappings. PK: `(representative_id, division_id)`.

---

## Staging

`openstates_people_data`, `openstates_people_roles`, `openstates_people_contacts`, etc. Populated by stage, merged via RPC.

---

## RPC

- `sync_representatives_from_openstates()` — Merge staging → production. Called by `openstates:merge`.
- `update_representative_status(id, status, reason, replaced_by_id)` — Status changes.
- `deactivate_non_current_openstates_reps()` — Mark reps no longer in YAML.

---

## Relationships

```
representatives_core (1) ──< (many) representative_committees
representatives_core (1) ──< (many) representative_activity
representatives_core (1) ──< (1) representative_campaign_finance
representatives_core (1) ──< (many) representative_contacts
representatives_core (1) ──< (many) representative_social_media
representatives_core (1) ──< (many) representative_photos
representatives_core (1) ──< (many) representative_divisions
```
