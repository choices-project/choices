# Actionable Implementation Roadmap

**Created:** December 31, 2024  
**Last Updated:** 2025-09-02  
**Status:** Ready for Development - Copy-Pasteable Code Provided  
**Priority:** Immediate Implementation

## Executive Summary

The AI has provided comprehensive, copy-pasteable deliverables that enable immediate development. This roadmap captures all implementation details, code snippets, and assignable tickets.

## Quick Answers to Open Questions

### Schema Design
- **PK Style:** UUID PKs for all tables + natural code columns (district_code, ocd_id) with unique constraints
- **Alias Confidence:** Yes - store confidence real [0..1], match_method text, is_primary boolean
- **Sources Table:** Yes - civics.source with kind, base_url, license, rate_limit_notes, last_harvested_at

### Performance Strategy
- **Redis Strategy:** Cache precomputed candidate card JSON with 10-15 min TTL; invalidate on ETL completion
- **Partitioning:** Start with contribution (by month). Everything else can wait until data forces it
- **PostGIS:** Two geoms: geom (authoritative), geom_simplified (for maps). Use ST_SimplifyPreserveTopology at ingest

### Code Structure
- **ORM:** Use Drizzle for typed SQL + migrations. Keep Supabase for auth/storage
- **civics-client:** REST now (typed via zod). GraphQL later for public API
- **viz package:** Keep internal mono-repo package for now; publish later if/when it stabilizes

### Authentication & Privacy
- **WebAuthn:** Make it T3. Fallback: email magic link / OTP. Store public key & counter in Postgres
- **T0 Local Storage:** Yes. Provide migration endpoint to lift local follows/preferences to server on T1 upgrade
- **T3 Perks:** Higher write privileges, correction priority, data export

### MVP Scope
- **Pilot:** Pennsylvania (good district diversity, national relevancy, lots of public datasets)
- **Federal Only:** Out-of-state users get federal officials immediately; state feed shows "coming soon"
- **Source Priority:** 1) Google Civic Info, 2) ProPublica Congress, 3) FEC (topline totals)
- **Content:** Recent votes = last 10 (or ≤ 6 weeks); donors = top 10 with "see more". Issue positions defer

## Deliverable 1: Connector Specifications

### Google Civic Information (GCI)

**Purpose:** Address → districts + current officials (US House/Senate for MVP)

**Endpoint:**
```
GET https://www.googleapis.com/civicinfo/v2/representatives?address={addr}&key=…
```

**TypeScript Interface:**
```typescript
export interface CivicRepResponse {
  normalizedInput: { line1?: string; city?: string; state?: string; zip?: string };
  divisions: Record<string, { name: string; officeIndices?: number[] }>;
  offices: Array<{ name: string; divisionId: string; levels?: string[]; roles?: string[]; officialIndices: number[] }>;
  officials: Array<{ name: string; party?: string; phones?: string[]; urls?: string[]; photoUrl?: string; channels?: { type: string; id: string }[] }>;
}
```

**ETL Steps:**
1. Geocode → dedupe address → cache
2. Upsert district by ocd_id (record source_id='google_civic_info')
3. Map offices/officials into person (+ person_alias) and candidacy (current office)

**Rate Limits:** Per Google project (cache responses by normalized address for 24h)

### ProPublica Congress API

**Purpose:** Member roster + votes (House & Senate)

**Endpoints:**
```
GET /congress/v1/{congress}/{chamber}/members.json
GET /congress/v1/members/{member-id}/votes.json
GET /congress/v1/{chamber}/votes/recent.json
```

**TypeScript Interface:**
```typescript
export interface Member {
  id: string; first_name: string; last_name: string; party: string; state: string; district?: string;
  roles: Array<{ congress: string; chamber: 'House'|'Senate'; start_date: string; end_date: string; title: string }>;
}

export interface VoteSummary {
  vote: { congress: string; chamber: string; roll_call: string; date: string; question: string; description: string; result: string; total: any };
  positions?: Array<{ member_id: string; vote_position: 'Yes'|'No'|'Present'|'Not Voting' }>;
}
```

**ETL Steps:**
1. Upsert members → person (+ alias)
2. Ingest recent votes (cap last 90 days for MVP) → vote + vote_choice
3. Build roll-up (last 10 votes) for candidate_card

**Rate Limits:** Reasonable for server use; cache responses 10-30 min

### FEC API (Topline Only for MVP)

**Purpose:** Candidate/committee totals (avoid raw line items first)

**Endpoints:**
```
GET /candidate/{candidate_id}/totals
GET /committee/{committee_id}/totals
```

**TypeScript Interface:**
```typescript
export interface FecTotals {
  cycle: number;
  receipts: number;
  disbursements: number;
  cash_on_hand_end_period: number;
  independent_expenditures?: number;
}
```

**ETL Steps:**
1. Resolve person_id from FEC id via alias table
2. Upsert finance_summary(person_id, cycle, …)
3. Feed candidate_card materialization

**Rate Limits:** API key; cache per candidate for 24h; bust on weekly ETL

## Deliverable 2: Candidate Card Materialization SQL

**File:** `/infra/db/migrations/XXXX_candidate_card.sql`

```sql
-- Precomputed candidate cards (one row per person per cycle)
create table if not exists civics.candidate_card (
  person_id uuid primary key references civics.person(person_id) on delete cascade,
  cycle int not null,
  headline jsonb not null,
  finance jsonb not null,
  recent_votes jsonb not null,
  committees jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_candidate_card_cycle on civics.candidate_card(cycle);

-- Upsert function to (re)build a single person's card
create or replace function civics.rebuild_candidate_card(p_person uuid, p_cycle int)
returns void language plpgsql as $$
declare
  v_headline jsonb;
  v_finance jsonb;
  v_votes jsonb;
  v_committees jsonb;
begin
  -- headline: name, party, current_post (if any)
  select jsonb_build_object(
    'name', p.display_name,
    'party', p.party,
    'current_post', cp.post_name,
    'state', cp.state,
    'district_code', cp.district_code
  )
  into v_headline
  from civics.person p
  left join lateral (
    select d.name as post_name, d.state, d.district_code
    from civics.candidacy c
    join civics.district d on d.district_id = c.district_id
    where c.person_id = p.person_id and c.is_incumbent = true
    order by c.updated_at desc limit 1
  ) cp on true
  where p.person_id = p_person;

  -- finance: last known finance summary for cycle
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'cycle', f.cycle,
      'receipts', f.receipts,
      'disbursements', f.disbursements,
      'cash_on_hand', f.cash_on_hand_end_period
    ) order by f.cycle desc
  )::jsonb, '[]'::jsonb)
  into v_finance
  from civics.finance_summary f
  where f.person_id = p_person and f.cycle = p_cycle;

  -- recent votes: last 10
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'date', v.date,
      'question', v.question,
      'result', v.result,
      'position', vc.vote_position,
      'roll_call', v.roll_call,
      'bill', v.bill_code
    ) order by v.date desc
  ), '[]'::jsonb)
  into v_votes
  from civics.vote v
  join civics.vote_choice vc on vc.vote_id = v.vote_id and vc.person_id = p_person
  where v.congress_cycle = p_cycle
  order by v.date desc limit 10;

  -- committees (optional for MVP; keep empty array if not used)
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', cm.committee_code, 'name', cm.name
  ) order by cm.name), '[]'::jsonb)
  into v_committees
  from civics.committee_membership m
  join civics.committee cm on cm.committee_id = m.committee_id
  where m.person_id = p_person and m.cycle = p_cycle;

  insert into civics.candidate_card (person_id, cycle, headline, finance, recent_votes, committees, updated_at)
  values (p_person, p_cycle, v_headline, v_finance, v_votes, v_committees, now())
  on conflict (person_id) do update
    set cycle = excluded.cycle,
        headline = excluded.headline,
        finance = excluded.finance,
        recent_votes = excluded.recent_votes,
        committees = excluded.committees,
        updated_at = now();
end $$;

-- Batch (re)builder for a whole cycle (call from ETL)
create or replace function civics.rebuild_candidate_cards_for_cycle(p_cycle int)
returns void language plpgsql as $$
declare r record;
begin
  for r in select person_id from civics.person loop
    perform civics.rebuild_candidate_card(r.person_id, p_cycle);
  end loop;
end $$;
```

## Deliverable 3: Redis Cache Wrapper

**File:** `/packages/civics-client/src/cache.ts`

```typescript
import type { Redis } from '@upstash/redis'; // or 'ioredis'
type Json = unknown;

export interface Cache {
  getJSON<T = Json>(key: string): Promise<T | null>;
  setJSON<T = Json>(key: string, value: T, ttlSec: number): Promise<void>;
  withJSON<T>(key: string, ttlSec: number, loader: () => Promise<T | null>): Promise<T | null>;
}

export function createCache(redis: Redis): Cache {
  const inflight = new Map<string, Promise<any>>();

  const getJSON = async <T,>(key: string): Promise<T | null> => {
    const val = await redis.get<string>(key);
    if (!val) return null;
    try { return JSON.parse(val) as T; } catch { return null; }
  };

  const setJSON = async <T,>(key: string, value: T, ttlSec: number) => {
    const str = JSON.stringify(value);
    if ('set' in redis) {
      // Upstash: redis.set(key, value, { ex: ttl })
      // ioredis: redis.set(key, value, 'EX', ttl)
      // @ts-expect-error: vendor-specific
      await redis.set(key, str, { ex: ttlSec });
    } else {
      // Fallback: @ts-ignore for ioredis signature
      // @ts-ignore
      await redis.set(key, str, 'EX', ttlSec);
    }
  };

  const withJSON = async <T,>(key: string, ttlSec: number, loader: () => Promise<T | null>) => {
    const cached = await getJSON<T>(key);
    if (cached !== null) return cached;

    if (inflight.has(key)) return inflight.get(key)! as Promise<T | null>;
    const p = (async () => {
      try {
        const fresh = await loader();
        if (fresh !== null) await setJSON(key, fresh, ttlSec);
        return fresh;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, p);
    return p;
  };

  return { getJSON, setJSON, withJSON };
}
```

**Usage Example:**
```typescript
// apps/web/app/api/candidates/[personId]/route.ts
import { createCache } from '@choices/civics-client/cache';
import { db } from '@/db'; // drizzle
import { redis } from '@/redis'; // client
import { NextResponse } from 'next/server';

const TTL = 600; // 10 min

export async function GET(_: Request, { params }: { params: { personId: string } }) {
  const cache = createCache(redis);
  const key = `cc:v1:${params.personId}`;
  const payload = await cache.withJSON(key, TTL, async () => {
    const row = await db.query.candidate_card.findFirst({
      where: (t, { eq }) => eq(t.person_id, params.personId),
    });
    if (!row) return null;
    // shape to public contract if needed
    return row;
  });
  return payload ? NextResponse.json(payload) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

## API Contracts

**File:** `/packages/civics-schemas/src/contracts.ts`

```typescript
import { z } from 'zod';

export const CandidateCardV1 = z.object({
  person_id: z.string().uuid(),
  cycle: z.number().int(),
  headline: z.object({
    name: z.string(),
    party: z.string().optional(),
    current_post: z.string().nullish(),
    state: z.string().optional(),
    district_code: z.string().optional(),
  }),
  finance: z.array(z.object({
    cycle: z.number().int(),
    receipts: z.number(),
    disbursements: z.number(),
    cash_on_hand: z.number().optional(),
  })),
  recent_votes: z.array(z.object({
    date: z.string(), // ISO
    question: z.string(),
    result: z.string(),
    position: z.string().optional(),
    roll_call: z.string().optional(),
    bill: z.string().optional(),
  })),
  committees: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })),
  updated_at: z.string(),
});
export type CandidateCardV1 = z.infer<typeof CandidateCardV1>;
```

## Immediate Assignable Tickets

### Database
- [ ] **Add migration for civics.candidate_card & rebuild functions**
  - File: `/infra/db/migrations/XXXX_candidate_card.sql`
  - Copy-paste the SQL from Deliverable 2
  - Test the rebuild functions with sample data

### Connectors
- [ ] **Scaffold @choices/connectors-civicinfo**
  - Create package structure
  - Implement Google Civic Info connector with TypeScript interfaces
  - Add rate limiting and caching logic
- [ ] **Scaffold @choices/connectors-propublica**
  - Create package structure
  - Implement ProPublica Congress API connector
  - Add member and vote data processing
- [ ] **Scaffold @choices/connectors-fec**
  - Create package structure
  - Implement FEC API connector (topline totals only)
  - Add finance summary processing

### ETL
- [ ] **Nightly job → rebuild cards for current cycle**
  - Create ETL job that calls `civics.rebuild_candidate_cards_for_cycle`
  - Set up scheduling (cron job or Temporal/BullMQ)
  - Add monitoring and error handling

### API Routes
- [ ] **Implement /api/district**
  - Add geocoding and point-in-polygon logic
  - Return districts, posts, and officials for given address
  - Add proper error handling and validation
- [ ] **Implement /api/candidates?district_id=…**
  - Return list of candidates for given district
  - Include basic info: IDs, names, party, avatar
  - Add pagination if needed
- [ ] **Implement /api/candidates/[personId]**
  - Use Redis cache wrapper from Deliverable 3
  - Return full candidate card with votes, finance, committees
  - Handle 404 cases properly

### Authentication
- [ ] **WebAuthn T3 endpoints (generate/verify)**
  - Implement `/api/webauthn/generate-registration`
  - Implement `/api/webauthn/verify-registration`
  - Add WebAuthn credential storage in Postgres
  - Gate high-impact actions on T3 status

### Web Interface
- [ ] **Dual-stream UI toggle**
  - Add toggle: "All submissions (bot-possible)" vs "Verified electorate"
  - Implement tooltips explaining criteria
  - Show both streams side-by-side where appropriate
  - Preserve research value while maintaining decision-grade results

### Operations
- [ ] **Redis provisioning + ENV wiring**
  - Set up Redis instance (Upstash or self-hosted)
  - Add environment variables for Redis connection
  - Test cache wrapper functionality
- [ ] **CI job to lint "no direct supabase-js on server"**
  - Add ESLint rule to prevent @supabase/supabase-js in server bundles
  - Enforce server-only patterns for Supabase usage
  - Add pre-commit hooks

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up monorepo structure with `/apps` and `/packages`
- [ ] Implement civics schema with migrations
- [ ] Set up CI checks for server-only patterns
- [ ] Choose Pennsylvania as pilot state

### Phase 2: Core Infrastructure (Week 3-4)
- [ ] Implement Google Civic Info connector
- [ ] Add district mapping and point-in-polygon functionality
- [ ] Create basic candidate profile pages
- [ ] Set up Redis caching

### Phase 3: Data Integration (Week 5-6)
- [ ] Implement ProPublica Congress connector
- [ ] Add vote tracking and rollcall data
- [ ] Implement FEC connector for finance data
- [ ] Create candidate card materialization

### Phase 4: User Experience (Week 7-8)
- [ ] Build "My District" feed
- [ ] Add candidate comparison functionality
- [ ] Implement follow/notify system
- [ ] Add WebAuthn authentication

### Phase 5: Polish & Launch (Week 9-10)
- [ ] Add dual-stream UI toggle
- [ ] Implement correction/reporting tools
- [ ] Performance optimization and testing
- [ ] Soft launch to early users

## Success Metrics

### Technical Metrics
- **API Response Time:** p95 < 300ms for profile endpoints
- **Geospatial Performance:** p95 < 150ms for district lookups
- **Cache Hit Rate:** > 95% for candidate cards
- **Data Freshness:** < 24h for votes, < 48h for finance data

### User Metrics
- **Address Submissions:** Track successful district resolution
- **Candidate Profile Views:** Measure engagement with candidate pages
- **Follow Rate:** Track candidate follows and engagement
- **Trust Tier Progression:** Monitor T0→T1→T2→T3 upgrades

### Content Metrics
- **Coverage:** % of Pennsylvania candidates with complete profiles
- **Data Quality:** % of alias matches with confidence > 0.8
- **Source Diversity:** Number of unique data sources integrated
- **Correction Rate:** % of user-reported corrections processed

## Risk Mitigation

### Technical Risks
- **API Rate Limits:** Implement proper caching and rate limiting
- **Data Quality:** Build confidence scoring and review queues
- **Performance:** Monitor and optimize PostGIS queries
- **Security:** Implement proper WebAuthn and audit logging

### Business Risks
- **Scope Creep:** Stick to federal-only, Pennsylvania pilot
- **Data Accuracy:** Implement correction workflows and source attribution
- **User Adoption:** Focus on clear value proposition (address→candidates)
- **Competition:** Emphasize candidate-forward, source-transparent approach

## Next Steps

1. **Immediate:** Copy-paste the provided code into the appropriate files
2. **This Week:** Set up monorepo structure and implement basic schema
3. **Next Week:** Start with Google Civic Info connector and district mapping
4. **Following Weeks:** Iterate through the development phases

The AI has provided everything needed to start development immediately. All code is copy-pasteable and ready for implementation.

---

**Status:** Ready for immediate development with comprehensive, actionable deliverables.
