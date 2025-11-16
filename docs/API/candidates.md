# Candidates API

Admin-safe endpoints for candidate profiles.

## GET /api/candidates/[slug]

Fetch a public candidate profile by slug.

- Success: `{ success: true, data: CandidateProfile }`
- Not found: `{ success: false, error: "Candidate not found" }` (404)

Notes:
- Only returns profiles where `is_public` is true.

## PATCH /api/candidates/[slug]

Update a candidate profile you own.

Auth:
- Requires authenticated user; PATCH will return 401 if not authenticated.
- Requires ownership: the authenticated user’s `id` must match `candidate_profiles.user_id`; otherwise 403.

Editable fields:
- `display_name` (string)
- `office` (string)
- `jurisdiction` (string)
- `party` (string)
- `bio` (string)
- `website` (string)
- `social` (object)
- `is_public` (boolean)

Request body example:
```json
{
  "display_name": "Updated",
  "office": "Mayor",
  "is_public": true
}
```

Responses:
- 200 `{ success: true, data: CandidateProfile }` — updated record
- 400 `{ success: false, error, details }` — validation error (no fields or wrong types)
- 401 `{ success: false, error: "Authentication required" }`
- 403 `{ success: false, error: "Not authorized to edit this candidate profile" }`
- 404 `{ success: false, error: "Candidate not found" }`
- 500 `{ success: false, error: "Failed to update candidate" }`

Testing:
- See `web/tests/api/candidates/slug-patch.test.ts` for coverage of auth, ownership, and validation flows.


