# Civics Phase 2 MVP Roadmap
**Last Updated**: 2025-09-17
**Created:** September 16, 2025  
**Status:** Focused, Shippable, No-Bloat

## 🎯 **Single Source of Truth**
- **Definitive Count**: 1,273 representatives (from production readiness test)
- **Coverage by Source**: Federal (253), State (713), Local (34)
- **Daily Materialized View**: `v_civics_coverage_dashboard` for dashboard metrics

---

## 🔧 **Phase 2 MVP Scope (3 Bullets Only)**

### 1. FEC Minimal
- **Fields**: `candidate_id`, `cycle`, `total_receipts`, `cash_on_hand`, `last_updated`
- **Goal**: 90%+ federal reps with candidate mapping
- **DoD**: ETL idempotent, <24h freshness, attribution rendered, a11y pass

### 2. Voting Records Minimal  
- **Fields**: Last 5 roll calls + simple party alignment %
- **Goal**: GovTrack integration for federal reps
- **DoD**: <24h freshness, party alignment calculated, attribution rendered

### 3. Contact Enrichment Minimal
- **Fields**: `phone`, `website`, `twitter_url` only
- **Goal**: Manual verification + existing data sources
- **DoD**: 90%+ federal reps with contact info, attribution rendered
- **Note**: ProPublica Congress API discontinued - using manual verification

---

## 🚀 **API Versioning (Ship Now)**

### Endpoints
```
GET /api/v1/civics/representative/:id?fields=...&include=fec,votes
GET /api/v1/civics/by-state?state=CA&level=federal&fields=...
```

### Response Shape
```json
{
  "id": "uuid",
  "name": "string",
  "office": "string",
  "level": "federal|state|local",
  "fec": { "total_receipts": 1250000, "cash_on_hand": 450000 },
  "votes": { "last_5": [...], "party_alignment": 0.85 },
  "contact": { "phone": "...", "website": "...", "twitter_url": "..." }
}
```

### Headers
- `ETag`: For caching
- `Cache-Control: public, max-age=300, stale-while-revalidate=86400`

---

## ✅ **Definition of Done (Hard Acceptance Tests)**

### FEC Integration
- [ ] 90%+ federal reps with candidate mapping
- [ ] ETL idempotent (can run multiple times safely)
- [ ] <24h freshness SLA
- [ ] Attribution rendered in UI
- [ ] A11y pass on financial badges
- [ ] Mapping confidence field for fuzzy matches

### Voting Records
- [ ] Last 5 votes for all federal reps
- [ ] Party alignment % calculated
- [ ] <24h freshness SLA
- [ ] Attribution to GovTrack.us
- [ ] A11y pass on voting indicators

### Contact Enrichment
- [ ] 90%+ federal reps with contact info
- [ ] Phone, website, Twitter/X only
- [ ] Attribution to ProPublica
- [ ] A11y pass on contact buttons

### API Versioning
- [ ] `/v1/civics/` endpoints working
- [ ] `?fields=` parameter reduces payload
- [ ] `?include=fec,votes` adds related data
- [ ] ETag and Cache-Control headers
- [ ] p95 < 500ms with include flags
- [ ] Cache hit rate > 70%

---

## 🔗 **Crosswalk is King (First-Class IDs)**

### Canonical ID System
```sql
-- Primary crosswalk table
CREATE TABLE civics_person_xref (
  person_id UUID PRIMARY KEY,
  bioguide TEXT UNIQUE,
  govtrack_id INTEGER UNIQUE,
  fec_candidate_id TEXT UNIQUE,
  openstates_id TEXT UNIQUE,
  ocd_division_id TEXT UNIQUE,
  mapping_confidence DECIMAL(3,2), -- 0.00 to 1.00
  mapping_status TEXT, -- 'matched'|'conflict'|'missing'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Confidence Levels
- **1.00**: Exact match (name + state + office)
- **0.90**: High confidence (name + state)
- **0.70**: Medium confidence (fuzzy name match)
- **0.50**: Low confidence (manual review needed)

---

## ⚡ **Caching Policy (Keep Cheap, Fast)**

### TTL by Source
- **GovTrack votes**: 6-12h TTL
- **FEC summary**: 24h TTL  
- **ProPublica contact**: 7d TTL
- **All external calls**: Ingest-only
- **Public APIs**: Read from DB/Redis only

### Implementation
```typescript
const CACHE_TTL = {
  govtrack_votes: 6 * 60 * 60, // 6 hours
  fec_summary: 24 * 60 * 60,   // 24 hours
  propublica_contact: 7 * 24 * 60 * 60 // 7 days
};
```

---

## 📊 **Observability (3 Charts Only)**

### 1. Coverage by Source
- Federal: GovTrack (253), FEC (TBD), ProPublica (TBD)
- State: OpenStates (713)
- Local: Manual (34)

### 2. Freshness by Level
- Federal: ≤7 days
- State: ≤14 days  
- Local: ≤30 days

### 3. Error/Timeout Rate by Source
- GovTrack: <1% error rate
- FEC: <1% error rate
- ProPublica: <1% error rate

### Single Alert
- Freshness breach + FEC mapping rate <90%

---

## 🔒 **Security Guardrails**

### RLS Policies
- Tables with addresses/contact logs: RLS enabled
- Public views: Read-only access
- Ingest routes: Signed internal routes only

### API Quotas
- Per-source rate limiting
- PII redaction from logs
- Key rotation runbook (1 page)

---

## 🚫 **Cut List (Explicit Non-Goals)**

### Phase 2 Exclusions
- ❌ Address-to-district lookup
- ❌ Multi-network social discovery (beyond Twitter/X)
- ❌ Map visualizations
- ❌ ML/behavior analytics
- ❌ Committee/roll-call deep links (just last 5 basics)
- ❌ Full social media graph & engagement
- ❌ District boundary maps & geospatial UI
- ❌ Advanced finance charts & comparisons
- ❌ Election tracking and candidate pipelines
- ❌ Local expansion beyond SF/LA

---

## 📦 **API Surface (Minimal & Future-Proof)**

### Core Endpoints
```
GET /api/v1/civics/representative/:id?fields=name,office&include=fec,votes
GET /api/v1/civics/by-state?state=CA&level=federal&fields=name,office
GET /api/v1/civics/coverage-dashboard
```

### Response Contract
```typescript
interface RepresentativeResponse {
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  fec?: {
    total_receipts: number;
    cash_on_hand: number;
    cycle: number;
    last_updated: string;
  };
  votes?: {
    last_5: VoteRecord[];
    party_alignment: number;
    last_updated: string;
  };
  contact?: {
    phone?: string;
    website?: string;
    twitter_url?: string;
    last_updated: string;
  };
  attribution: {
    fec?: string;
    votes?: string;
    contact?: string;
  };
}
```

---

## 🧪 **Gate Checks Before Ship**

### Schema
- [ ] Supabase typegen committed
- [ ] Migrations are idempotent
- [ ] RLS policies tested

### Data
- [ ] Coverage ≥ 90% (federal)
- [ ] Freshness within SLA
- [ ] Attribution rendered

### Performance
- [ ] p95 < 500ms with include flags
- [ ] Cache hit rate > 70%

### Documentation
- [ ] One page per source (quota, fields, refresh cadence, attribution copy)

---

## ⚠️ **Risks to Watch**

### FEC ID Matching
- **Risk**: Missing/ambiguous mappings
- **Mitigation**: Track `mapping_status` (matched/conflict/missing)
- **Action**: Ship without blocking; render badge when matched

### ProPublica TOS/Attribution
- **Risk**: Attribution requirements
- **Mitigation**: Lock attribution string & link in UI now

### Local Data Drift
- **Risk**: Manual sources age quickly
- **Mitigation**: Set 30-day freshness alarms

---

## 📅 **One-Week Action Plan**

### Day 1-2: API Versioning
- [ ] Stand up `/api/v1` with `fields`/`include` + ETag
- [ ] Test response contracts

### Day 3-4: FEC Integration
- [ ] Run FEC minimal ETL
- [ ] Land crosswalk + `mapping_status`
- [ ] UI badge behind feature flag

### Day 5-6: Voting Records
- [ ] Pull last-5 votes from GovTrack
- [ ] Compute party alignment
- [ ] UI chip behind feature flag

### Day 7: Dashboard & CI
- [ ] Ship coverage/freshness dashboard
- [ ] Drift CI check (±2%)
- [ ] Publish "Spec v1" doc

---

## 🎯 **Success Metrics**

### Coverage
- Federal: ≥90% with FEC mapping
- Federal: ≥90% with contact info
- Federal: ≥90% with voting records

### Performance
- p95 API response: <500ms
- Cache hit rate: >70%
- Error rate: <1% per source

### Freshness
- Federal: ≤7 days
- State: ≤14 days
- Local: ≤30 days

---

**This roadmap keeps you focused, measurable, and shippable—no feature creep, just the smallest slice that proves value and scales.**
