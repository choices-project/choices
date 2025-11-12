# OpenStates People YAML Coverage Audit

This document inventories the fields present in OpenStates “People” YAML files and notes how the ingest service handles them today. Use it to guide parser/persistence updates and keep `services/civics-backend` aligned with Supabase expectations.

Source references:
- Canonical builder: `src/ingest/openstates/people.ts`
- Staging pipeline: `src/scripts/openstates/stage-openstates.ts`
- Supabase types: `web/types/supabase.ts` (`openstates_people_*` tables)

## 1. Person-level fields

| YAML field | Examples | Canonical (`CanonicalRepresentative`) | Staging (`openstates_people_data`) | Notes / Gaps |
| --- | --- | --- | --- | --- |
| `id` | `ocd-person/...` | ✅ `openstatesId`, `canonicalKey` | ✅ `openstates_id` | Canonical key reduces to `canonical-<id>`; consider richer key strategy tied to crosswalk. |
| `name` | `"Tina McKinnor"` | ✅ `name` | ✅ `name` | – |
| `given_name`, `family_name` | `"Tina"`, `"McKinnor"` | ✅ stored | ✅ stored | – |
| `middle_name`, `nickname`, `suffix` | `"Simone"`, `"Nick"` | ✅ stored | ✅ stored | – |
| `gender` | `"Female"` | ✅ `gender` | ✅ `gender` | – |
| `birth_date`, `death_date` | `1964-09-30` | ✅ stored | ✅ `birth_date` / `death_date` | – |
| `party` (array or string) | `[{ name: "Democratic" }]` | ✅ first entry | ✅ first entry | History beyond first entry not preserved anywhere. |
| `current_party` | `true` | ❌ dropped | ✅ stored | Add to canonical if useful for audits. |
| `biography` | Markdown/HTML string | ✅ stored | ✅ `biography` | – |
| `image` | URL | ✅ `image` | ✅ `image_url` | – |
| `extras` | arbitrary object | ✅ stored (`extras`) | ✅ `extras` JSON | Evaluate which keys deserve first-class fields. |
| `updated_at` | ISO timestamp | ❌ dropped | ✅ `updated_at` | Could surface as provenance. |

## 2. Contact information

| YAML field | Canonical | Staging | Notes |
| --- | --- | --- | --- |
| `email` | ✅ added to `emails[]` (lowercased) | ✅ via `contact_details` | Canonical dedupes across offices. |
| `contact_details[]` | ✅ merged into `emails[]` / `phones[]` / `links[]` | ✅ `openstates_people_contacts` | Canonical normalises email/phone/url types; staging retains structured rows. |
| `offices[].{classification,address,voice,fax,email,name}` | ✅ `offices[]` (address, phone, fax, email, name) + `emails[]`/`phones[]` | ✅ contacts table (`contact_type`, value, note) | – |

## 3. Roles & service history

| YAML field | Canonical | Staging | Notes |
| --- | --- | --- | --- |
| `roles[].type` (`upper`, `lower`, `mayor`, …) | ✅ `currentRoles` / `allRoles` → `chamber` | ✅ `role_type` | Canonical omits `member_role` and `title`. |
| `roles[].jurisdiction` | ✅ stored | ✅ compressed (`state:xx`) | Canonical keeps full jurisdiction string; staging compresses to 48 chars. |
| `roles[].district` | ✅ | ✅ | – |
| `roles[].division_id` | ✅ stored | ✅ `division` | – |
| `roles[].start_date`, `end_date` | ✅ | ✅ | – |
| `roles[].end_reason` | ✅ stored | ✅ stored | – |
| `roles[].title`, `role` (`member_role`) | ✅ stored | ✅ stored | – |
| `roles` filtering | includes all roles; `currentRoles` filters active via `isRoleActive` | `is_current` flag persisted | ⚠️ `isRoleActive` requires ISO `end_date`; non-standard dates become inactive. |

## 4. Names & identifiers

| YAML field | Canonical | Staging | Notes |
| --- | --- | --- | --- |
| `other_names[]` | ✅ `aliases[]` | ✅ `openstates_people_other_names` | Canonical exposes alias names with start/end dates. |
| `other_identifiers[]` | ✅ merged into `identifiers.other` | ✅ stored (`scheme`, `identifier`) | – |
| `identifiers[]` | ✅ merged into `identifiers.other` (non-core schemes) | ✅ stored (`scheme`, `identifier`) | Core schemes still mapped to dedicated fields. |
| `ids.{bioguide,fec,wikipedia,ballotpedia,...}` | ✅ maps to canonical identifiers/social | ✅ stored in identifiers table | Need to ensure all schemes persisted (stage script copies keys verbatim). |

## 5. Links & sources

| YAML field | Canonical | Staging | Notes |
| --- | --- | --- | --- |
| `links[]` (url + note) | ✅ `links[]` (URLs only) | ✅ `sources` as `source_type='link'` | Canonical drops notes. |
| `sources[]` | ✅ `sources[]` (URLs only) | ✅ `source_type` + note | Canonical loses `note` detail. |

## 6. Social media

| YAML field | Canonical | Staging | Notes |
| --- | --- | --- | --- |
| `ids` (twitter/facebook/etc.) | ✅ `social[]` with handles + URLs | ✅ `identifiers` | – |
| `social_media[]` (platform/username) | ✅ merged into `social[]` | ✅ `openstates_people_social_media` | – |
| Links with social domains | ✅ deduced handles | n/a | – |

## 7. Data quality considerations

- **Retired/inactive filtering:** `readOpenStatesPeople` excludes retired and inactive reps unless explicitly requested. Staging still captures everything for audit history.
- **Truncation:** Staging normalises/truncates strings (e.g., `contact.value` to 255 chars, `jurisdiction` to 48). Document these limits to avoid unexpected data loss.
- **Error handling:** Non-ISO `end_date` values mark roles as inactive (`isRoleActive` returns false). Add logging or cleansing to catch malformed dates.
- **Crosswalks:** Canonical builder attaches `crosswalk` only later (via Supabase fetch). YAML-provided crosswalk metadata (`other_identifiers`) could seed `id_crosswalk`.

## 8. Next steps

1. Add fixture-driven staging/merge tests (see `docs/persistence-verification-plan.md`) so Supabase writes are continuously validated.
2. Build Supabase smoke-test CLI wrapper that runs against staging with `--dry-run` and asserts canonical rows exist.
3. Evaluate storing raw YAML hashes/provenance rows in `representative_data_sources` for future audits.
4. Regenerate Supabase types after the next schema change to keep frontend contracts in sync.

Maintain this file alongside `services/civics-backend/ROADMAP.md`; mark sections as ✅ when coverage is complete and link to the commit/PR that delivered it.


