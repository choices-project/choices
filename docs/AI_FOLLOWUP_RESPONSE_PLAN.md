# AI Follow-up Response Plan

**Created:** December 31, 2024  
**Last Updated:** 2025-09-02  
**Assessment Source:** External AI Review - Follow-up  
**Status:** Implementation Ready - Copy-Pasteable Code Provided

## Executive Summary

The AI has provided a comprehensive, actionable response that addresses your biometric concerns while maintaining the core vision. Key insights:

**✅ Biometric Alternative Solution:**
- **WebAuthn/Passkeys** instead of server-side biometric storage
- **Multi-signal trust system** with privacy-preserving verification
- **Dual-stream analysis** (verified vs. open) for propaganda research
- **Device-bound biometrics** (never leave the device)

**✅ Concrete Implementation:**
- Complete schema DDL with indexes
- API route stubs with TypeScript
- Redis caching strategy
- WebAuthn integration code
- Candidate card JSON contract

## Biometric Analysis & Alternative

### Why Server-Side Biometrics Are Problematic:

**Security & Privacy:**
- Non-rotatable, high-impact if breached (face/voice/fingerprint templates are forever)
- Regulatory burden (GDPR Art. 9, CCPA/CPRA, BIPA, statutory damages)
- Bias & accessibility issues (older devices, disabilities, camera-averse users)

**Doesn't Solve Core Needs:**
- Human vs. bot: helps liveness but doesn't guarantee uniqueness or residency
- Integrity: still need rate-limits, duplicate prevention, influence labeling

### WebAuthn/Passkeys Solution:

**How It Works:**
- Users unlock device-bound keypairs with local biometric/PIN
- No biometric ever leaves the device
- Store only public key + counters
- Great signal for "real person with continuity" without sensitive data

**Trust Tier Implementation:**
```
T0 (open/bot-possible): Read + low-impact actions, rate-limited, labeled "Unverified"
T1 (email): Server state, follows, saved feed
T2 (phone/address): District association (hash + centroid only)
T3 (WebAuthn): Higher-impact actions, weighted participation, data export
```

### Dual-Stream Analysis (Fits Your Vision):

**Verified Stream:** T2/T3-weighted results (what likely humans/residents think)
**Open Firehose:** T0/T1, unlabeled or "bot-possible"

**Value:** Surface both side-by-side - "All submissions" vs "Verified electorate"
**Research:** Incredibly valuable for influence/propaganda research
**Implementation:** Toggle UI with tooltips explaining criteria

## Technical Implementation Decisions

### 1. Schema Design (Finalized):

**District PKs:** UUID PK + versioned natural code (district_code, plan_version)
**Person Alias:** Confidence scoring (0-1) with match_method and is_primary flag
**Source Table:** Track source_id, name, kind, base_url, license, rate_limit_notes
**Candidate Cards:** Precomputed table with JSONB columns for performance

### 2. Performance Strategy:

**Redis Caching:** Two-layer approach
- Precomputed view (nightly) → civics.candidate_card table
- API response cache: key `cc:v1:<person_id>` TTL 10 minutes
- Bust on ETL completion or manual invalidation

**PostGIS Optimization:**
- Dual geometry columns: geom (authoritative) + geom_simplified (display)
- Proper indexing: GIST on geometries, BTREE on lookups
- Partitioning: Only contribution table initially (by month)

### 3. Technology Stack:

**Database:** SQL migrations + Drizzle for typed queries + Supabase for auth
**API:** REST first (internal), GraphQL later (public API)
**Caching:** Redis with proper TTL strategy
**Authentication:** WebAuthn with @simplewebauthn/server

## MVP Scope Clarifications

### Geographic Scope:
- **Federal only** (no state legislature in MVP)
- **Pennsylvania pilot** (diverse districts, data richness, national relevance)
- **Out-of-state users:** Always show federal, label state as "coming soon"

### Data Sources Priority:
1. **Google Civic Info** (address→district, officials)
2. **ProPublica Congress** (bills, votes, rollcalls)
3. **FEC summaries** (top totals only, defer raw line-items)

### Content Scope:
- **Recent votes:** Last 10 or last 6 weeks (whichever smaller)
- **Top donors:** Top 10 + "see more" link
- **Issue positions:** Defer for MVP, focus on votes + finance

## Implementation Timeline & Team

### Team Composition (Finalized):
```
1 Lead backend (schema owner, performance, indexing)
1 Data eng (ETL, data quality, duplicate detection)
1 Full-stack (Next.js, API routes)
1 Frontend (UX, data viz, candidate cards)
0.5 DevOps/SRE (infra, CI, monitoring)
0.5 PM/Editorial (fractional contractor - sources, naming, correction workflow)
```

### Development Phases:
- **Day 0-7:** Monorepo layout, civics schema, CI checks
- **Day 8-30:** Civic Info connector, district mapping, candidate profiles
- **Day 31-60:** Precompute cards, follow/notify, comparison page
- **Day 61-90:** Expand to 3-5 states, correction tools, grant prep

## Business Model & Funding

### Grant Strategy:
- **Apply post-MVP demo** (address→district→candidate page)
- **Priority:** Knight Prototype Fund, Democracy Fund, Omidyar, Arnold Ventures
- **Timing:** Working MVP slice materially strengthens proposals

### API Monetization (Later):
```
Free: 1 req/sec, 50k/mo, non-commercial
Pro: $199/mo, 20 req/sec, 5M/mo, SLA email support
Enterprise: custom, SLAs, bulk dumps, priority refresh
```

### Competitive Positioning:
- **Candidate-forward, district-precise, source-transparent**
- **Show recent actions over bios**
- **Provide open data feeds** that others can safely reuse

## Copy-Pasteable Implementation

### 1. Schema DDL (Ready to Deploy):
```sql
-- sources registry
create table if not exists civics.source (
  source_id text primary key,
  name text not null,
  kind text not null,
  base_url text,
  license text,
  rate_limit_notes text,
  last_harvested_at timestamptz
);

-- districts with versioned codes
alter table civics.district
  add column if not exists district_code text,
  add column if not exists plan_version text default '2020';

-- person aliases with confidence
alter table civics.person_alias
  add column if not exists confidence real not null default 1.0,
  add column if not exists match_method text,
  add column if not exists is_primary boolean not null default false;

-- precomputed candidate cards
create table if not exists civics.candidate_card (
  person_id uuid primary key references civics.person(person_id),
  cycle int not null,
  headline jsonb not null,
  finance jsonb not null,
  recent_votes jsonb not null,
  committees jsonb not null,
  updated_at timestamptz not null default now()
);
```

### 2. API Route Stubs (Next.js App Router):
```typescript
// /app/api/district/route.ts
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parse = Q.safeParse({ addr: url.searchParams.get('addr') ?? '' });
  if (!parse.success) return NextResponse.json({ error: 'Bad addr' }, { status: 400 });

  const point = await geocodeToPoint(parse.data.addr);
  const result = await findDistrictsForPoint(point);
  return NextResponse.json(result);
}
```

### 3. Redis Caching Strategy:
```typescript
const KEY = (id: string) => `cc:v1:${id}`;
const TTL_SECONDS = 600; // 10m

export async function getCandidateCard(personId: string) {
  const cached = await redis.get(KEY(personId));
  if (cached) return JSON.parse(cached);

  const row = await db.query.candidate_card.findFirst({ where: { person_id: personId }});
  if (!row) return null;

  const payload = shapeCard(row);
  await redis.set(KEY(personId), JSON.stringify(payload), { EX: TTL_SECONDS });
  return payload;
}
```

### 4. WebAuthn Integration:
```typescript
// /app/api/webauthn/generate-registration/route.ts
export async function GET(_: NextRequest) {
  const user = await requireUser();
  const options = generateRegistrationOptions({
    rpName: 'Choices',
    rpID: process.env.WEBAUTHN_RP_ID!,
    userID: user.id,
    userName: user.email ?? `user-${user.id}`,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' }
  });
  await saveChallengeForUser(user.id, options.challenge);
  return NextResponse.json(options);
}
```

## Trust-Gate Matrix (Concrete Implementation)

| Action | T0 | T1 | T2 | T3 |
|--------|----|----|----|----|
| Read feed | ✓ | ✓ | ✓ | ✓ |
| Lightweight reacts | ✓ (rate-limited, hidden by default) | ✓ | ✓ | ✓ |
| Follow candidates | local only | server | server | server |
| District feed | manual ZIP only | manual ZIP | auto by address attestation | same |
| Submit corrections/comments | view-only | queue w/ low weight | queue w/ normal weight | publish with reputation/priority |
| "One-person-one-voice" polls | see results | see results | vote with weight 1 | vote with weight 1 (strong) |
| API/data export | – | – | – | ✓ |

## Immediate Next Steps (Assignable Today)

### Parallelizable PRs:
1. **`/infra/db`** — Add schema/index DDL
2. **`/apps/web`** — Add three API routes (district, candidates list, candidate card)
3. **`/packages/civics-schemas`** — Zod types for CandidateCardV1
4. **`/apps/ingest`** — Scaffold connectors (CivicInfo, ProPublica, FEC summaries)
5. **`/packages/civics-client`** — REST wrapper with runtime validation
6. **`/apps/web`** — T0→T1 local→server migration endpoint
7. **`/apps/web`** — WebAuthn endpoints (generate/verify) behind auth

### Additional Deliverables Available:
- **Connector I/O contracts** (request/response shapes + mapping rules)
- **SQL for candidate_card materialization** (CTE that composes votes + finance)
- **Minimal Redis client wrapper** and cache invalidation hooks for ETL

## Privacy & Security Implementation

### Address Privacy:
- **Verify address → map to district_id → store salted hash + centroid + source**
- **No raw address retention**
- **Re-attest flow** after 6-12 months or redistricting

### Bot & Influence Mitigation:
- **Strict per-IP/user rate limiting**
- **Temporal analysis:** burst detection, entropy of actions, session cadence
- **Continuity:** passkey presence, returning sessions, stable district over time
- **Separation:** always compute metrics for "Verified" and "All" cohorts

### Audit Logging:
- **App-level logs:** actor, action, resource, time, metadata
- **Row history for edits:** updated_by, updated_at, JSON diff

## Conclusion

The AI has provided a comprehensive, implementable solution that:

1. **Maintains your vision** of analyzing propaganda and influence
2. **Solves the biometric privacy/security concerns** with WebAuthn
3. **Provides dual-stream analysis** (verified vs. open) for research value
4. **Offers copy-pasteable code** for immediate implementation
5. **Establishes clear trust tiers** with concrete capabilities

The key insight is using **device-bound biometrics** (WebAuthn) instead of server-side storage, which gives you the "human verification" you want without the legal and security risks. The dual-stream approach actually enhances your ability to analyze propaganda by clearly separating verified human input from potentially bot-influenced data.

**Ready to implement with the provided code and schema.**

---

**Next Action:** Choose which additional deliverables to request (connector specs, materialization SQL, or Redis wrapper).
