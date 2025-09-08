# Civics Implementation Roadmap

**Created:** December 31, 2024  
**Last Updated:** 2025-09-02  
**Status:** Ready for Implementation  
**Branch:** `feat/civics-monorepo-bootstrap`

## 🎯 Executive Summary

Comprehensive implementation roadmap for the Choices civic democracy platform. This document consolidates all planning and provides a clear, actionable path forward for building a non-duopoly civic information platform.

## 🏗️ Current Architecture

### Monorepo Structure
```
choices-monorepo/
├── apps/
│   └── ingest/           # ETL workers and data processing
├── packages/
│   ├── civics-schemas/   # Zod schemas and type definitions
│   ├── civics-client/    # Shared client utilities and cache
│   └── civics-sources/   # External API connectors (to be created)
├── web/                  # Next.js 14 frontend application
└── infra/               # Infrastructure and deployment configs
```

### Technology Stack
- **Frontend:** Next.js 14 (App Router, Server Components)
- **Backend:** Supabase (auth), Drizzle ORM (civics data)
- **Database:** PostgreSQL with PostGIS extensions
- **Caching:** In-memory (Sprint 1), Redis/Upstash (Sprint 2+)
- **Deployment:** Vercel (Git-based automatic deployments)
- **Testing:** Playwright (E2E), Vitest (unit tests)

## 🚀 Implementation Phases

### Phase 1: Foundation (Sprint 1) - Ready for Implementation
**Goal:** Establish core infrastructure and basic civic data flow

#### ✅ Completed
- [x] Monorepo structure setup
- [x] Basic package configuration
- [x] Stubbed API routes
- [x] Initial schemas and types

#### 🔄 In Progress
- [ ] Create `@choices/civics-sources` shared package
- [ ] Implement path aliases and package exports
- [ ] Expand realistic PA mock data
- [ ] Add API hardening and validation
- [ ] Implement basic rate limiting
- [ ] Build `/civics` MVP page
- [ ] Add performance logging

#### 📋 Sprint 1 Deliverables
1. **Address → District Lookup** (stubbed)
2. **District → Candidates List** (stubbed)
3. **Candidate Detail Cards** (stubbed)
4. **Basic Rate Limiting** (in-memory)
5. **Performance Monitoring** (P95 < 400ms)

### Phase 2: Data Integration (Sprint 2)
**Goal:** Connect to real civic data sources

#### External APIs
- **Google Civic Info API** - Address to district mapping
- **ProPublica Congress API** - Voting records and bills
- **FEC API** - Campaign finance data

#### Implementation Tasks
- [ ] Replace stubs with real API calls
- [ ] Implement data caching strategy
- [ ] Add error handling and retry logic
- [ ] Create data validation pipelines
- [ ] Build E2E tests for data flows

### Phase 3: Trust Tier System (Sprint 3)
**Goal:** Implement IA/PO (Identity Authentication / Privacy Optimization)

#### Trust Tiers
- **T0:** Anonymous users (basic access)
- **T1:** Email verified users (enhanced features)
- **T2:** Address verified users (full civic data)
- **T3:** Biometric verified users (trusted electorate)

#### Implementation Tasks
- [ ] Design trust tier database schema
- [ ] Implement tier-based access control
- [ ] Add address verification system
- [ ] Integrate WebAuthn for biometrics
- [ ] Build trust tier analytics

### Phase 4: Advanced Features (Sprint 4+)
**Goal:** Enhanced civic engagement and analysis

#### Features
- [ ] Issue tracking and candidate positions
- [ ] Civic event notifications
- [ ] Voter registration integration
- [ ] Campaign finance analysis
- [ ] District boundary visualization
- [ ] Mobile app development

## 📊 Data Schema

### Core Entities

#### Electoral Districts
```sql
CREATE TABLE electoral_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,  -- e.g., "us-house-pa-12"
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- "federal_senate", "federal_house", "state_senate", etc.
  state_code TEXT NOT NULL,
  geometry GEOMETRY(MULTIPOLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Candidates
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,  -- e.g., "person-sen-inc"
  name TEXT NOT NULL,
  party TEXT,
  district_id UUID REFERENCES electoral_districts(id),
  incumbent BOOLEAN DEFAULT FALSE,
  cycle INTEGER NOT NULL,  -- election year
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### User Profiles
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  trust_tier TEXT DEFAULT 'T0',
  verified_address TEXT,
  verified_districts UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Technical Implementation

### Package Dependencies
```json
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "web"
  ],
  "dependencies": {
    "@choices/civics-schemas": "workspace:*",
    "@choices/civics-client": "workspace:*",
    "@choices/civics-sources": "workspace:*"
  }
}
```

### Environment Variables
```bash
# Required for Production
GOOGLE_CIVIC_API_KEY=your_key_here
PROPUBLICA_API_KEY=your_key_here
FEC_API_KEY=your_key_here

# Optional (Sprint 2+)
REDIS_URL=your_redis_url
UPSTASH_REDIS_REST_URL=your_upstash_url
```

### API Endpoints

#### Core Civic APIs
- `GET /api/district?addr={address}` - Address to district lookup
- `GET /api/candidates?district_id={id}` - List candidates for district
- `GET /api/candidates/[personId]` - Detailed candidate information
- `POST /api/_warmup` - Cache warming endpoint

#### Trust Tier APIs
- `POST /api/auth/verify-address` - Address verification
- `POST /api/auth/upgrade-tier` - Trust tier upgrade
- `GET /api/user/trust-tier` - Current user trust tier

## 🎯 Success Metrics

### Phase 1 Metrics
- [ ] **Performance:** Warm P95 < 400ms for candidate API
- [ ] **Reliability:** 99.9% uptime for core APIs
- [ ] **User Experience:** End-to-end flow works with stub data
- [ ] **Code Quality:** Zero TypeScript errors, clean imports

### Phase 2 Metrics
- [ ] **Data Accuracy:** 95%+ match with official sources
- [ ] **Cache Efficiency:** 80%+ cache hit rate
- [ ] **API Reliability:** Graceful degradation on external API failures

### Phase 3 Metrics
- [ ] **User Trust:** 50%+ of users upgrade to T1+
- [ ] **Data Quality:** Address verification success rate > 90%
- [ ] **Security:** Zero authentication bypasses

## 🚨 Risk Mitigation

### Technical Risks
- **External API Rate Limits:** Implement aggressive caching and rate limiting
- **Data Accuracy:** Multiple source validation and user feedback loops
- **Performance:** Monitor and optimize database queries and API calls

### Business Risks
- **Regulatory Compliance:** Consult legal experts on data usage
- **User Privacy:** Implement strict data minimization and consent
- **Platform Dependencies:** Plan for API changes and outages

## 📈 Future Roadmap

### 6-Month Vision
- [ ] Multi-state expansion beyond Pennsylvania
- [ ] Mobile app development
- [ ] Advanced analytics and insights
- [ ] Community features and discussions

### 1-Year Vision
- [ ] Nationwide coverage
- [ ] Integration with voting systems
- [ ] Advanced AI-powered insights
- [ ] International expansion planning

## 🎯 Next Steps

### Immediate Actions (This Week)
1. **Complete Sprint 1** - Finish foundation implementation
2. **API Key Setup** - Obtain and configure external API keys
3. **Testing Strategy** - Implement comprehensive test suite
4. **Documentation** - Update all technical documentation

### Short Term (Next Month)
1. **Real Data Integration** - Replace stubs with live APIs
2. **Performance Optimization** - Achieve target metrics
3. **User Testing** - Gather feedback on MVP
4. **Trust Tier Design** - Finalize IA/PO system design

### Medium Term (Next Quarter)
1. **Trust Tier Implementation** - Build and deploy IA/PO
2. **Advanced Features** - Issue tracking and analysis
3. **Mobile Development** - Native app development
4. **Community Building** - User engagement features

---

**Status:** Ready for Sprint 1 implementation with comprehensive planning and clear success criteria.
