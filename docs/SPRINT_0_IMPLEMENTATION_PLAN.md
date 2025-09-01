# Sprint 0 Implementation Plan

**Date:** December 31, 2024  
**Sprint:** 0 - Branch, Structure, Guardrails  
**Duration:** 2-3 days  
**Status:** Ready for Immediate Implementation

## Strategic Decisions Made

### 1. Implementation Priority
**✅ Option A + Option C Parallel**
- Lock the foundation (complete auth/SSR hardening on main)
- Create sealed POC branch that does NOT import Supabase at all
- Prove: address → district → candidates → recent votes

### 2. Team & Resources
**✅ Role Priority:**
1. Backend/Data (connectors + schema)
2. Full-stack (API routes)
3. Frontend (candidate cards/UX)
4. DevOps (part-time)

**✅ Team Size Flexibility:**
- 4-6 devs: parallel development
- 1-2 devs: serial development (same plan, sequential execution)

### 3. Technology Stack
**✅ Drizzle ORM** over Supabase query builder for civics data
**✅ Keep Supabase for auth only**
**✅ Upstash Redis** (managed, serverless-friendly)
**✅ Monorepo in feature branch:** `feat/civics-monorepo-bootstrap`

### 4. MVP Scope
**✅ Pennsylvania pilot (federal only)**
**✅ No state legislature in MVP**
**✅ WebAuthn T3: implement after core flow (Sprint 2)**
**✅ Start with T0/T1 and email magic links**

### 5. Data Source Order
1. **Google Civic Info** (address → districts/officials)
2. **ProPublica Congress** (votes/bills)
3. **FEC summaries** (topline totals only)

### 6. Development Approach
**✅ Separate branch for civics platform**
**✅ Parallel track with CI protection**
**✅ Civics branch must NOT import @supabase/supabase-js in server code**

### 7. Success Criteria (MVP)
**✅ Primary KPI:** "Time-to-insight"
- % of users who view both House & Senate candidate pages with last 10 votes within < 10 seconds
**✅ User Story:** "Enter address → see my federal candidates → compare last votes + money"
**✅ Secondary:** 95th percentile API latency for candidate cards < 400ms (with Redis)

## Sprint 0 Tasks

### Branch Setup
- [ ] **Create branch:** `feat/civics-monorepo-bootstrap`
- [ ] **Protect main** with CI and CODEOWNERS
- [ ] **Add CODEOWNERS** for civics server code review

### Monorepo Structure
```
/apps
  /web                  # Next.js app (unchanged for now)
  /ingest               # node ETL workers (no supabase import)
/packages
  /civics-schemas       # zod + SQL types
  /civics-client        # typed REST SDK for web to call civics API (no supabase)
/infra
  /db                   # drizzle migrations + seeds
```

### Repository Guardrails

#### CI Check for Supabase Imports
```bash
# Fail build if any server file imports @supabase/supabase-js
if grep -R "@supabase/supabase-js" apps/web/app/api apps/ingest | grep -v "\.client\.ts"; then 
  echo "ERROR: @supabase/supabase-js found in server code"
  exit 1
fi
```

#### CODEOWNERS File
```
# Civics server code requires review by Backend/Data owner
/apps/ingest/ @backend-data-lead
/apps/web/app/api/civics/ @backend-data-lead
/packages/civics-schemas/ @backend-data-lead
/infra/db/ @backend-data-lead
```

#### Environment Variables
```bash
# .env.local
GOOGLE_CIVIC_API_KEY=...
PROPUBLICA_API_KEY=...
FEC_API_KEY=...           # optional for Sprint 1
REDIS_URL=...             # Upstash URL
```

### GitHub Project Setup

#### Labels
- `civics/backend`
- `civics/etl`
- `civics/frontend`
- `infra`
- `blocked`
- `help-wanted`

#### Milestones
- Sprint 0 (current)
- Sprint 1 (Address → District → Candidate)
- Sprint 2 (WebAuthn + FEC)

#### Issue Template
```
**User Story:**
As a voter in PA,
When I enter my address,
I can see my US House & Senate candidates and their last 10 votes within 10 seconds.

**Acceptance Criteria:**
- API returns data
- UI renders correctly
- Latency SLO met (< 10s cold-start, < 2s warm)

**Definition of Done:**
- [ ] Feature implemented
- [ ] Tests passing
- [ ] Performance criteria met
- [ ] Code reviewed
```

## Sprint 1 Preview (7-10 days)

### Goal
Working POC path that never touches Supabase and survives SSR.

### Tasks Breakdown

#### A. Data Contracts & Migrations
- [ ] `/packages/civics-schemas`: Add CandidateCardV1 zod contract
- [ ] `/infra/db`: Add civics.candidate_card table + rebuild_candidate_card SQL
- [ ] Indexes: GIST on districts, BTREE on candidate_card(cycle)

#### B. Connectors (Pure Node)
- [ ] `/apps/ingest/connectors/civicinfo.ts`
  - Input: address string
  - Output: normalized divisions + current officials
  - Cache raw JSON 24h
- [ ] `/apps/ingest/connectors/propublica.ts`
  - getRecentVotes(chamber, sinceDays=42)
  - getMemberVotes(memberId)

#### C. Minimal ETL
- [ ] `/apps/ingest/jobs/build-candidate-cards.ts`
  - For PA federal posts only
  - Upsert persons, votes, finance summaries (finance can be stubbed)
  - Call rebuild_candidate_card(person_id, cycle) per person

#### D. API Routes (REST)
- [ ] `GET /api/district?addr=…` → return normalized districts + posts + officials
- [ ] `GET /api/candidates?district_id=…` → list of candidates (person_id, headline)
- [ ] `GET /api/candidates/:personId` → candidate card JSON (via Redis cache wrapper)

#### E. Caching
- [ ] Wire Upstash Redis
- [ ] Add createCache() wrapper
- [ ] Keys: cc:v1:<person_id> (10-15 min TTL), cdl:v1:<district_id> (60 min)

#### F. Frontend "Happy Path"
- [ ] `/civics` page: address input → calls /api/district → shows US House & Senate cards for PA addresses
- [ ] Candidate page: name, party, last 10 votes (table), finance placeholder

### Definition of Done (Sprint 1)
- [ ] Enter a Pennsylvania address → see both federal candidates → open each candidate page → see last 10 votes in < 10s cold-start and < 2s warm
- [ ] No server build errors
- [ ] No Supabase imports in civics server code

## Agent Assignments (5 Agents)

### Agent A (Backend/Data Lead)
- [ ] Drizzle schema
- [ ] SQL functions
- [ ] Redis wiring
- [ ] API routes

### Agent B (Data Eng)
- [ ] Civic Info + ProPublica connectors
- [ ] Minimal ETL
- [ ] Schedules

### Agent C (Full-stack)
- [ ] District & candidate endpoints integration
- [ ] zod validation
- [ ] Error surfaces

### Agent D (Frontend)
- [ ] /civics flow
- [ ] Candidate card UI
- [ ] Loading/error states

### Agent E (DevOps-lite)
- [ ] CI guardrail for forbidden imports
- [ ] ENV setup
- [ ] Project board hygiene

### Solo Development Order
If 1-2 developers: A → B → C → D → E (sequential)

## Sprint 2 Preview

### Planned Features
- [ ] Add FEC topline totals to cards
- [ ] Add WebAuthn T3 endpoints; gate higher-impact actions
- [ ] Precompute committee memberships (optional)
- [ ] Ship "Verified vs All" results toggle (UI + API split)

## Immediate Next Steps

1. **Create Sprint 0 branch** and set up monorepo structure
2. **Implement CI guardrails** for Supabase import prevention
3. **Set up GitHub project** with labels and milestones
4. **Prepare environment variables** for API keys
5. **Begin Sprint 1 planning** with detailed task breakdown

## Risk Mitigation

### Technical Risks
- **Supabase Import Prevention:** CI check will catch violations
- **Build Tooling:** Test monorepo structure in feature branch first
- **API Rate Limits:** Implement caching from day one

### Process Risks
- **Scope Creep:** Stick to Pennsylvania federal only
- **Team Coordination:** Clear agent assignments and dependencies
- **Quality:** CODEOWNERS ensure proper review

## Success Metrics

### Sprint 0 Success
- [ ] Monorepo structure created and tested
- [ ] CI guardrails preventing Supabase imports in server code
- [ ] GitHub project set up with proper labels and milestones
- [ ] Environment variables configured

### Sprint 1 Success
- [ ] Working address → district → candidate flow
- [ ] Performance targets met (< 10s cold-start, < 2s warm)
- [ ] No build errors or Supabase imports in civics code
- [ ] Pennsylvania federal candidates with last 10 votes visible

---

**Status:** Ready for immediate implementation with clear agent assignments and success criteria.
