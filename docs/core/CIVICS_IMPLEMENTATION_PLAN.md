**Last Updated**: 2025-09-17
# 🏛️ Civics Implementation Plan - From Mock Data to Production
**Last Updated**: 2025-09-17

**Date**: January 15, 2025  
**Status**: 🚀 **PRODUCTION-READY IMPLEMENTATION PLAN**  
**Scope**: Complete civics data ingestion system with all integrated APIs

---

## 🎯 **Executive Summary**

This document provides a comprehensive implementation plan to transform the civics feature from mock data to a production-ready system that ingests real government data from multiple APIs. The plan addresses all critical issues identified in the comprehensive review and incorporates all existing civics APIs in the system.

### **Current State Analysis**
- ✅ **Strong Foundation**: 6 API clients with comprehensive government data coverage
- ❌ **Mock Data in Production**: CivicInfo connector returns hardcoded PA-12 data
- ❌ **Missing Real API Integration**: Most connectors are stubs with TODO comments
- ❌ **No Caching Strategy**: Every request hits external APIs
- ❌ **Inadequate Error Handling**: Basic try-catch without proper error classification

### **Target State**
- 🎯 **Real API Integration**: All 6 APIs fully implemented with proper error handling
- 🎯 **Production-Ready Caching**: Multi-layer caching with Redis and memory fallback
- 🎯 **Comprehensive Validation**: Input sanitization and data quality checks
- 🎯 **Ingest-Only Architecture**: Third-party APIs isolated from user-facing endpoints
- 🎯 **Database Storage**: Normalized data storage in Supabase with proper indexing

---

## 📊 **Complete API Integration Overview**

### **1. Google Civic Information API**
- **Purpose**: Address lookup, district identification, representative data
- **Rate Limits**: 25,000 requests/day, 2,500 requests/100 seconds
- **Current Status**: Mock implementation with hardcoded PA-12 data
- **Priority**: **CRITICAL** - Primary data source for address lookups

### **2. Congress.gov API**
- **Purpose**: Official federal legislative data, member information
- **Rate Limits**: 5,000 requests/day
- **Current Status**: Client implemented, needs integration
- **Priority**: **HIGH** - Official federal data source

### **3. FEC (Federal Election Commission) API**
- **Purpose**: Campaign finance data, candidate financial information
- **Rate Limits**: 1,000 requests/hour
- **Current Status**: Client implemented, needs integration
- **Priority**: **HIGH** - Campaign finance transparency

### **4. Open States API**
- **Purpose**: State legislature data, state representatives
- **Rate Limits**: 10,000 requests/day
- **Current Status**: Client implemented, needs integration
- **Priority**: **HIGH** - State-level data coverage

### **5. OpenSecrets API**
- **Purpose**: Enhanced financial analysis, lobbying data
- **Rate Limits**: 1,000 requests/day
- **Current Status**: Client implemented, needs integration
- **Priority**: **MEDIUM** - Enhanced financial insights

### **6. GovTrack.us API**
- **Purpose**: Congressional tracking, voting records
- **Rate Limits**: Unlimited (good API citizenship)
- **Current Status**: Client implemented, needs integration
- **Priority**: **MEDIUM** - Voting record analysis

---

## 🎯 **Focused Implementation Approach**

### **Default Strategy: Jurisdiction-First Seeding**
- **Primary Focus**: Seed all federal + state officials for top 10 most populous states
- **Data Sources**: GovTrack (federal) + OpenStates (state) - no address lookups needed
- **Scope**: CA, TX, FL, NY, PA, IL, OH, GA, NC, MI (stable top-10 list)
- **Approach**: Build representative database first, then add address lookup later

### **Trial Strategy: San Francisco Local Government**
- **Implementation**: Seeds SF city/county officials (Mayor, Board of Supervisors, citywide offices) by OCD division
- **Data Source**: Google Civic Information API's `representatives?ocdId=` endpoint
- **Scope**: San Francisco, CA local government with `level='local'`, `jurisdiction='San Francisco, CA'`
- **No Address Dependencies**: Uses OCD division IDs, not address lookups

### **Key Benefits**
- ✅ **No Address Dependencies**: Seed by jurisdiction, not by address lookup
- ✅ **Immediate Data Coverage**: Top 10 states = ~60% of US population + SF local trial
- ✅ **Clean Data Model**: OCD division IDs for proper joins and relationships
- ✅ **Scalable Architecture**: Can add more states and local governments incrementally
- ✅ **User-Ready**: Can ship "Browse by State/District" UI immediately
- ✅ **Local Government Trial**: SF serves as proof-of-concept for local government data

---

## 🚀 **Implementation Plan**

### **Phase 0: Jurisdiction-First Seeding (Today)**

#### **0.1 Enhanced Database Schema**
```sql
-- Districts (OCD divisions) - NEW TABLE
CREATE TABLE IF NOT EXISTS public.civics_divisions (
  ocd_division_id TEXT PRIMARY KEY,                          -- e.g. ocd-division/country:us/state:ca/cd:12
  level TEXT NOT NULL,                                       -- 'federal' | 'state' | 'local'
  chamber TEXT NOT NULL,                                     -- 'us_senate' | 'us_house' | 'state_upper' | 'state_lower'
  state TEXT,                                                -- 'CA'
  district_number INTEGER,                                   -- null for statewide seats
  name TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Representatives - ensure we can link to divisions
ALTER TABLE public.civics_representatives
  ADD COLUMN IF NOT EXISTS ocd_division_id TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS office TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_divisions_state_chamber
  ON public.civics_divisions (state, chamber);

CREATE INDEX IF NOT EXISTS idx_reps_division 
  ON public.civics_representatives(ocd_division_id);

CREATE INDEX IF NOT EXISTS idx_civics_reps_level 
  ON public.civics_representatives(level);

CREATE INDEX IF NOT EXISTS idx_civics_reps_juris 
  ON public.civics_representatives(jurisdiction);
```

#### **0.2 Top-10 States Seeding Script**
```typescript
// web/scripts/civics-seed-top10.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';

const TOP10 = ['CA','TX','FL','NY','PA','IL','OH','GA','NC','MI'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// --- Helpers to build OCD IDs ---
const ocdState = (st: string) => `ocd-division/country:us/state:${st.toLowerCase()}`;
const ocdUSSenate = (st: string) => ocdState(st);                        // statewide seat
const ocdUSHouse = (st: string, cd: number) => `${ocdState(st)}/cd:${cd}`;
const ocdStateUpper = (st: string, d: string|number) => `${ocdState(st)}/sldu:${d}`;
const ocdStateLower = (st: string, d: string|number) => `${ocdState(st)}/sldl:${d}`;

// --- Clients (reuse your existing integrations if you have them) ---
async function fetchGovTrackRoles(params: Record<string,string|number>) {
  const url = new URL('https://www.govtrack.us/api/v2/role');
  Object.entries({ current: 'true', limit: 600, ...params }).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GovTrack ${res.status}`);
  return res.json() as Promise<{ objects: any[] }>;
}

async function fetchOpenStatesPeople(state: string, chamber: 'upper'|'lower') {
  // OpenStates v3 REST (token in Authorization header)
  const url = new URL('https://v3.openstates.org/people');
  url.searchParams.set('jurisdiction', state.toUpperCase());
  url.searchParams.set('chamber', chamber);
  url.searchParams.set('classification', 'legislator');
  url.searchParams.set('per_page', '500');
  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': process.env.OPEN_STATES_API_KEY! }
  });
  if (!res.ok) throw new Error(`OpenStates ${state}/${chamber} ${res.status}`);
  return res.json() as Promise<{ results: any[] }>;
}

// --- Upsert helpers ---
async function upsertDivision(row: {
  ocd_division_id: string; level: string; chamber: string; state: string|null;
  district_number: number|null; name: string|null;
}) {
  const { error } = await supabase.from('civics_divisions').upsert(row);
  if (error) throw error;
}

async function upsertRep(row: {
  name: string; party?: string|null; office: string; level: string; jurisdiction: string;
  ocd_division_id: string; contact?: any; raw_payload: any;
}) {
  const { error } = await supabase.from('civics_representatives').upsert({
    name: row.name,
    party: row.party ?? null,
    office: row.office,
    level: row.level,
    jurisdiction: row.jurisdiction,
    ocd_division_id: row.ocd_division_id,
    contact: row.contact ?? null,
    raw_payload: row.raw_payload
  });
  if (error) throw error;
}

// --- Federal ingest (GovTrack) ---
async function ingestFederal(state: string) {
  // Senators (statewide)
  const sens = await fetchGovTrackRoles({ role_type: 'senator', state });
  await upsertDivision({
    ocd_division_id: ocdUSSenate(state),
    level: 'federal',
    chamber: 'us_senate',
    state,
    district_number: null,
    name: `${state} U.S. Senate`
  });
  for (const r of sens.objects) {
    const person = r.person || {};
    await upsertRep({
      name: person.name || `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim(),
      party: r.party,
      office: 'U.S. Senator',
      level: 'federal',
      jurisdiction: 'US',
      ocd_division_id: ocdUSSenate(state),
      contact: { phone: r.phone ?? null, website: r.website ?? null },
      raw_payload: r
    });
  }

  // House (districted)
  const reps = await fetchGovTrackRoles({ role_type: 'representative', state });
  const cds = new Set<number>();
  for (const r of reps.objects) {
    const cd = Number(r.district);
    if (!Number.isFinite(cd)) continue;
    cds.add(cd);
    await upsertDivision({
      ocd_division_id: ocdUSHouse(state, cd),
      level: 'federal',
      chamber: 'us_house',
      state,
      district_number: cd,
      name: `${state}-CD${cd}`
    });
    const person = r.person || {};
    await upsertRep({
      name: person.name || `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim(),
      party: r.party,
      office: `U.S. Representative (CD ${cd})`,
      level: 'federal',
      jurisdiction: 'US',
      ocd_division_id: ocdUSHouse(state, cd),
      contact: { phone: r.phone ?? null, website: r.website ?? null },
      raw_payload: r
    });
  }
}

// --- State ingest (OpenStates) ---
async function ingestState(state: string) {
  // Upper chamber
  const upper = await fetchOpenStatesPeople(state, 'upper');
  const seenUpper = new Set<string>();
  for (const p of upper.results) {
    const district = String(p.current_role?.district ?? p.district ?? '').trim();
    if (!district) continue;
    const ocd = ocdStateUpper(state, district);
    if (!seenUpper.has(ocd)) {
      await upsertDivision({
        ocd_division_id: ocd,
        level: 'state',
        chamber: 'state_upper',
        state,
        district_number: Number(district) || null,
        name: `${state} State Senate ${district}`
      });
      seenUpper.add(ocd);
    }
    await upsertRep({
      name: p.name,
      party: p.party ?? null,
      office: 'State Senator',
      level: 'state',
      jurisdiction: state,
      ocd_division_id: ocd,
      contact: { email: p.email ?? null, website: p.links?.[0]?.url ?? null },
      raw_payload: p
    });
  }

  // Lower chamber
  const lower = await fetchOpenStatesPeople(state, 'lower');
  const seenLower = new Set<string>();
  for (const p of lower.results) {
    const district = String(p.current_role?.district ?? p.district ?? '').trim();
    if (!district) continue;
    const ocd = ocdStateLower(state, district);
    if (!seenLower.has(ocd)) {
      await upsertDivision({
        ocd_division_id: ocd,
        level: 'state',
        chamber: 'state_lower',
        state,
        district_number: Number(district) || null,
        name: `${state} State Assembly ${district}`
      });
      seenLower.add(ocd);
    }
    await upsertRep({
      name: p.name,
      party: p.party ?? null,
      office: 'State Representative',
      level: 'state',
      jurisdiction: state,
      ocd_division_id: ocd,
      contact: { email: p.email ?? null, website: p.links?.[0]?.url ?? null },
      raw_payload: p
    });
  }
}

// --- Runner ---
async function run() {
  assert(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL required');
  assert(process.env.SUPABASE_SECRET_KEY, 'SUPABASE_SECRET_KEY required');
  assert(process.env.OPEN_STATES_API_KEY, 'OPEN_STATES_API_KEY required');

  for (const st of TOP10) {
    console.log(`\n=== ${st}: federal ===`);
    await ingestFederal(st);
    console.log(`=== ${st}: state ===`);
    await ingestState(st);
    console.log(`✅ Done ${st}`);
  }
  console.log('\nAll done.');
}

run().catch(e => { console.error(e); process.exit(1); });
```

#### **0.3 Test Commands**
```bash
# Seed top 10 states (federal + state representatives)
cd web
OPEN_STATES_API_KEY=your_key \
NEXT_PUBLIC_SUPABASE_URL=your_url \
SUPABASE_SECRET_KEY=your_secret \
npx tsx scripts/civics-seed-top10.ts
```

#### **0.4 San Francisco Local Seeding Script**
```typescript
// web/scripts/civics-seed-sf-local.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

const CIVIC_BASE = 'https://www.googleapis.com/civicinfo/v2';
const GOOGLE_KEY = process.env.GOOGLE_CIVIC_INFO_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
if (!GOOGLE_KEY) throw new Error('Missing Google Civic API key (GOOGLE_CIVIC_INFO_API_KEY or GOOGLE_CIVIC_API_KEY)');

const OCD_SF_PLACE = 'ocd-division/country:us/state:ca/place:san_francisco';
const OCD_SF_COUNTY = 'ocd-division/country:us/state:ca/county:san_francisco';

async function fetchCivicByDivision(ocdId: string) {
  const url = new URL(`${CIVIC_BASE}/representatives`);
  url.searchParams.set('ocdId', ocdId);
  url.searchParams.set('key', GOOGLE_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google Civic ${res.status}: ${t.slice(0,200)}`);
  }
  return res.json() as Promise<{
    divisions?: Record<string, any>;
    offices?: Array<{ name: string; divisionId: string; officialIndices: number[] }>;
    officials?: Array<{ name: string; party?: string; phones?: string[]; urls?: string[]; emails?: string[] }>;
  }>;
}

async function upsertDivision(ocd_division_id: string, name: string) {
  const { error } = await supabase.from('civics_divisions').upsert({
    ocd_division_id,
    level: 'local',
    chamber: 'local_city',
    state: 'CA',
    district_number: null,
    name
  });
  if (error) throw error;
}

async function upsertRep(row: {
  name: string;
  party?: string | null;
  office: string;
  ocd_division_id: string;
  contact?: any;
  raw_payload: any;
}) {
  const { error } = await supabase.from('civics_representatives').upsert({
    name: row.name,
    party: row.party ?? null,
    office: row.office,
    level: 'local',
    jurisdiction: 'San Francisco, CA',
    district: 'CA-SF', // stable placeholder district for local layer
    ocd_division_id: row.ocd_division_id,
    contact: row.contact ?? null,
    raw_payload: row.raw_payload
  });
  if (error) throw error;
}

function asTagged(office: { name: string; divisionId: string; officialIndices: number[] }, officials: any[]) {
  return (office.officialIndices || []).map(i => {
    const o = officials[i] || {};
    return {
      office: office.name,
      ocd_division_id: office.divisionId,
      name: o.name || 'Unknown',
      party: o.party ?? null,
      contact: {
        phone: o.phones?.[0] ?? null,
        website: o.urls?.[0] ?? null,
        email: o.emails?.[0] ?? null
      },
      raw: o
    };
  });
}

async function seedSF() {
  console.log('🌉 Seeding San Francisco local…');

  // Pull both place and county; merge results (they sometimes differ)
  const [placeData, countyData] = await Promise.allSettled([
    fetchCivicByDivision(OCD_SF_PLACE),
    fetchCivicByDivision(OCD_SF_COUNTY)
  ]);

  const packets = [];
  if (placeData.status === 'fulfilled') packets.push(placeData.value);
  if (countyData.status === 'fulfilled') packets.push(countyData.value);

  if (!packets.length) throw new Error('No SF civic data returned (place+county both failed)');

  // Upsert top-level division rows (use friendlier names)
  await upsertDivision(OCD_SF_PLACE, 'San Francisco (City & County) — Place');
  await upsertDivision(OCD_SF_COUNTY, 'San Francisco (City & County) — County');

  // Flatten offices/officials to reps
  for (const data of packets) {
    const offices = data.offices || [];
    const officials = data.officials || [];

    for (const office of offices) {
      const reps = asTagged(office, officials);
      for (const r of reps) {
        await upsertRep({
          name: r.name,
          party: r.party,
          office: r.office,
          ocd_division_id: r.ocd_division_id,
          contact: r.contact,
          raw_payload: { office: r.office, official: r.raw }
        });
      }
    }
  }

  console.log('✅ SF local seeding complete.');
}

seedSF().catch(e => { console.error(e); process.exit(1); });
```

#### **0.5 Browse API Endpoint**
```typescript
// web/app/api/civics/by-state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const state = req.nextUrl.searchParams.get('state');
    const level = req.nextUrl.searchParams.get('level'); // 'federal' | 'state' | 'local'
    const chamber = req.nextUrl.searchParams.get('chamber'); // 'us_senate' | 'us_house' | 'state_upper' | 'state_lower'

    if (!state) {
      return NextResponse.json({ error: 'State parameter required' }, { status: 400 });
    }

    let query = supabase
      .from('civics_representatives')
      .select(`
        *,
        civics_divisions (
          ocd_division_id,
          level,
          chamber,
          state,
          district_number,
          name
        )
      `)
      .eq('jurisdiction', state.toUpperCase());

    if (level) {
      query = query.eq('level', level);
    }

    if (chamber) {
      query = query.eq('civics_divisions.chamber', chamber);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: data || [],
      count: data?.length || 0
    });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ 
      ok: false, 
      error: 'Service temporarily unavailable' 
    }, { status: 502 });
  }
}
```

#### **0.6 San Francisco Local API Endpoint**
```typescript
// web/app/api/civics/local/sf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('civics_representatives')
      .select('name,party,office,level,jurisdiction,ocd_division_id,contact')
      .eq('level', 'local')
      .eq('jurisdiction', 'San Francisco, CA')
      .order('office', { ascending: true });

    if (error) {
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: data?.length ?? 0, data: data ?? [] });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ ok: false, error: 'Service temporarily unavailable' }, { status: 502 });
  }
}
```

#### **0.7 Test Commands**
```bash
# Seed top 10 states (federal + state representatives)
cd web
OPEN_STATES_API_KEY=your_key \
NEXT_PUBLIC_SUPABASE_URL=your_url \
SUPABASE_SECRET_KEY=your_secret \
npx tsx scripts/civics-seed-top10.ts

# Seed San Francisco local government
GOOGLE_CIVIC_API_KEY=your_google_key \
NEXT_PUBLIC_SUPABASE_URL=your_url \
SUPABASE_SECRET_KEY=your_secret \
npx tsx scripts/civics-seed-sf-local.ts

# Test the APIs
curl "http://localhost:3000/api/civics/by-state?state=CA&level=federal"
curl "http://localhost:3000/api/civics/local/sf"
```

#### **0.8 GitHub Actions Workflow (Optional)**
```yaml
# .github/workflows/civics-seed-sf.yml
name: Civics Seed - SF Local
on: { workflow_dispatch: {} }

jobs:
  seed-sf:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22.x', cache: npm, cache-dependency-path: web/package-lock.json }
      - run: npm ci
      - run: npx tsx scripts/civics-seed-sf-local.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
          GOOGLE_CIVIC_API_KEY: ${{ secrets.GOOGLE_CIVIC_API_KEY }}
```

#### **0.9 Setup Checklist**
- ✅ Ensure `civics_divisions` table exists (from the top-10 plan)
- ✅ Ensure `civics_representatives` has columns: `level`, `jurisdiction`, `ocd_division_id`, `district` (use "CA-SF" for local)
- ✅ Put your Google Civic API key in env (`GOOGLE_CIVIC_INFO_API_KEY` or `GOOGLE_CIVIC_API_KEY`)
- ✅ Run `npx tsx scripts/civics-seed-sf-local.ts`
- ✅ Hit `/api/civics/local/sf` and show your friends 🎉

### **Phase 1: Critical Foundation (Week 1-2)**

#### **1.1 Environment Setup**
```bash
# Required Environment Variables for Complete Civics System

# Google Civic Information API (Primary - Address Lookup + SF Local)
GOOGLE_CIVIC_API_KEY=your_google_civic_key
# Alternative naming convention
GOOGLE_CIVIC_INFO_API_KEY=your_google_civic_key

# Congress.gov API (Federal Legislative Data)
CONGRESS_GOV_API_KEY=your_congress_gov_key

# FEC API (Campaign Finance Data)
FEC_API_KEY=your_fec_key

# Open States API (State Legislature Data)
OPEN_STATES_API_KEY=your_open_states_key

# OpenSecrets API (Enhanced Financial Analysis)
OPENSECRETS_API_KEY=your_opensecrets_key

# GovTrack.us API (Congressional Tracking - No Key Required)
# Note: GovTrack.us has unlimited access, no API key needed

# Caching & Database
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret

# Security
CIVICS_INGEST_SECRET=your_ingest_secret

# Local Government Trial (San Francisco Only)
CIVICS_LOCAL_TRIAL_SF=1  # Set to 1 to enable SF local data, 0 or unset to disable
```

#### **1.1.1 API Key Setup Instructions**

**Google Civic Information API**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable the "Civic Information API"
- Create credentials (API Key)
- Restrict to "Civic Information API" only

**Congress.gov API**
- Go to [Congress.gov API](https://api.congress.gov/)
- Sign up for an account
- Generate an API key
- Rate limit: 5,000 requests/day

**FEC API**
- Go to [FEC API](https://api.open.fec.gov/)
- Sign up for an account
- Generate an API key (optional but recommended)
- Rate limit: 1,000 requests/hour

**Open States API**
- Go to [Open States API](https://openstates.org/api/)
- Sign up for an account
- Generate an API key
- Rate limit: 10,000 requests/day

**OpenSecrets API**
- Go to [OpenSecrets API](https://www.opensecrets.org/api/)
- Sign up for an account
- Generate an API key
- Rate limit: 1,000 requests/day

**GovTrack.us API**
- No API key required
- Unlimited access (practice good API citizenship)
- Base URL: https://www.govtrack.us/api/v2/

#### **1.1.2 Environment Variable Management**

**Vercel Deployment**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all API keys to both Staging and Production environments
3. Ensure all keys are marked as "Sensitive"

**Local Development**
1. Create `.env.local` file in the `web/` directory
2. Add all environment variables
3. Never commit `.env.local` to version control

**GitHub Actions**
1. Go to Repository → Settings → Secrets and variables → Actions
2. Add all API keys as repository secrets
3. Use in workflows with `${{ secrets.API_KEY_NAME }}`

#### **1.2 Database Schema**
```sql
-- Enable pgcrypto if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Address lookup results
CREATE TABLE IF NOT EXISTS public.civics_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_hash TEXT NOT NULL UNIQUE,
  normalized_address TEXT NOT NULL,
  state TEXT,
  district TEXT,               -- e.g. 'CA-12'
  confidence NUMERIC,          -- 0..1
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  reps JSONB,                  -- raw representative payload
  sources TEXT[] DEFAULT ARRAY['google-civic'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalized representatives
CREATE TABLE IF NOT EXISTS public.civics_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT NOT NULL,      -- 'CA-12'
  name TEXT NOT NULL,
  party TEXT,
  office TEXT NOT NULL,        -- 'U.S. House', 'State Senate', etc.
  contact JSONB,               -- email, phone, website
  raw_payload JSONB NOT NULL,  -- full API response
  level TEXT,                  -- 'federal' | 'state' | 'local'
  jurisdiction TEXT,           -- 'US' | 'CA' | 'San Francisco, CA'
  ocd_division_id TEXT,        -- Google Civic OCD division id
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign finance data
CREATE TABLE IF NOT EXISTS public.civics_campaign_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id TEXT NOT NULL,
  cycle INTEGER NOT NULL,
  total_contributions NUMERIC,
  total_expenditures NUMERIC,
  cash_on_hand NUMERIC,
  debt NUMERIC,
  raw_data JSONB NOT NULL,
  source TEXT NOT NULL,        -- 'fec', 'opensecrets'
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting records
CREATE TABLE IF NOT EXISTS public.civics_voting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id TEXT NOT NULL,
  bill_id TEXT,
  vote_position TEXT,          -- 'yes', 'no', 'abstain'
  vote_date DATE,
  raw_data JSONB NOT NULL,
  source TEXT NOT NULL,        -- 'congress-gov', 'govtrack'
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_civics_addr_state_district
  ON public.civics_addresses (state, district);

CREATE INDEX IF NOT EXISTS idx_civics_reps_district 
  ON public.civics_representatives (district);

CREATE INDEX IF NOT EXISTS idx_civics_reps_level 
  ON public.civics_representatives (level);

CREATE INDEX IF NOT EXISTS idx_civics_reps_juris 
  ON public.civics_representatives (jurisdiction);

CREATE INDEX IF NOT EXISTS idx_civics_reps_ocd 
  ON public.civics_representatives (ocd_division_id);

CREATE INDEX IF NOT EXISTS idx_civics_finance_candidate_cycle
  ON public.civics_campaign_finance (candidate_id, cycle);

CREATE INDEX IF NOT EXISTS idx_civics_votes_rep_date
  ON public.civics_voting_records (representative_id, vote_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_civics_addresses_updated ON public.civics_addresses;
CREATE TRIGGER trg_civics_addresses_updated
  BEFORE UPDATE ON public.civics_addresses
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
```

#### **1.3 Shared Types & Validation**
```typescript
// web/lib/civics/schemas.ts
'use server';
import { z } from 'zod';

export const AddressInputSchema = z.object({
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s,.\-#]+$/, 'Address contains invalid characters')
    .transform(a => a.trim())
});

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const AddressLookupResultSchema = z.object({
  normalizedAddress: z.string(),
  state: z.string().length(2).toUpperCase(),
  district: z.string().regex(/^[A-Z]{2}-\d{1,3}$/), // e.g. CA-12
  confidence: z.number().min(0).max(1).default(0.9),
  coordinates: LatLngSchema.optional(),
  representatives: z.any(), // keep raw for v1, normalize later
});

export const RepresentativeSchema = z.object({
  id: z.string(),
  name: z.string(),
  party: z.string().optional(),
  office: z.string(),
  district: z.string(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional()
  }).optional()
});

export const CampaignFinanceSchema = z.object({
  candidateId: z.string(),
  cycle: z.number(),
  totalContributions: z.number().optional(),
  totalExpenditures: z.number().optional(),
  cashOnHand: z.number().optional(),
  debt: z.number().optional()
});

export type AddressLookupResult = z.infer<typeof AddressLookupResultSchema>;
export type Representative = z.infer<typeof RepresentativeSchema>;
export type CampaignFinance = z.infer<typeof CampaignFinanceSchema>;
```

#### **1.4 Caching & Rate Limiting**
```typescript
// web/lib/civics/cache.ts
'use server';
import crypto from 'crypto';

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
let mem = new Map<string, { at: number; val: any }>();

export function addrKey(address: string) {
  return 'civics:address:' + crypto.createHash('sha256').update(address.toLowerCase()).digest('hex');
}

export function repKey(district: string) {
  return `civics:representatives:${district}`;
}

export function financeKey(candidateId: string, cycle: number) {
  return `civics:finance:${candidateId}:${cycle}`;
}

export async function getOrSet<T>(key: string, ttlSec: number, fetcher: () => Promise<T>): Promise<T> {
  if (!hasUpstash) {
    const hit = mem.get(key);
    if (hit && Date.now() - hit.at < ttlSec * 1000) return hit.val as T;
    const val = await fetcher();
    mem.set(key, { at: Date.now(), val });
    return val;
  }
  
  // Upstash path
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ 
    url: process.env.UPSTASH_REDIS_REST_URL!, 
    token: process.env.UPSTASH_REDIS_REST_TOKEN! 
  });
  
  const cached = await redis.get<string>(key);
  if (cached) return JSON.parse(cached) as T;
  
  const val = await fetcher();
  await redis.set(key, JSON.stringify(val), { ex: ttlSec });
  return val;
}

export async function checkRate(_ip: string, _window = 60, _max = 60) {
  if (!hasUpstash) return true;
  
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ 
    url: process.env.UPSTASH_REDIS_REST_URL!, 
    token: process.env.UPSTASH_REDIS_REST_TOKEN! 
  });
  
  const key = `rl:civics:${_ip}:${Math.floor(Date.now() / (_window * 1000))}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, _window);
  return n <= _max;
}
```

### **Phase 2: Real API Implementation (Week 3-4)**

#### **2.1 Google Civic API Implementation**
```typescript
// web/lib/civics/googleCivic.ts
'use server';
import 'server-only';
import { AddressLookupResultSchema, type AddressLookupResult } from './schemas';

const BASE = 'https://www.googleapis.com/civicinfo/v2';

function toDistrict(state: string, divisionId?: string): string | null {
  if (!divisionId) return null;
  const m = divisionId.match(/state:([a-z]{2}).*?(?:cd:)?(\d+)/i);
  if (!m) return null;
  const st = (m[1] || state).toUpperCase();
  const num = m[2];
  return `${st}-${num}`;
}

export async function lookupAddress(address: string, retries = 3): Promise<AddressLookupResult> {
  const key = process.env.GOOGLE_CIVIC_INFO_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
  if (!key) throw new Error('Missing Google Civic API key');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = new URL(`${BASE}/representatives`);
      url.searchParams.set('address', address);
      url.searchParams.set('key', key);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google Civic error ${res.status}: ${text.slice(0,300)}`);
      }
      
      const data = await res.json();

      const normalizedAddress = [
        data.normalizedInput?.line1, 
        data.normalizedInput?.city, 
        data.normalizedInput?.state, 
        data.normalizedInput?.zip
      ].filter(Boolean).join(', ');

      const divs = data.divisions || {};
      const firstDivId = Object.keys(divs).find(k => /\/cd:\d+/.test(k)) || Object.keys(divs)[0];
      const state = (data.normalizedInput?.state || '').toUpperCase();
      const district = toDistrict(state, firstDivId) || `${state}-0`;

      const result = {
        normalizedAddress,
        state,
        district,
        confidence: 0.95,
        coordinates: undefined,
        representatives: { offices: data.offices, officials: data.officials },
      };

      return AddressLookupResultSchema.parse(result);
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

#### **2.2 Congress.gov API Integration**
```typescript
// web/lib/civics/congressGov.ts
'use server';
import 'server-only';
import { createCongressGovClient } from '@/lib/integrations/congress-gov/client';

export async function getMemberData(bioguideId: string) {
  const client = createCongressGovClient();
  return await client.getMember(bioguideId);
}

export async function getVotingRecords(memberId: string, congress: number) {
  const client = createCongressGovClient();
  return await client.getMemberVotes(memberId, congress);
}
```

#### **2.3 FEC API Integration**
```typescript
// web/lib/civics/fec.ts
'use server';
import 'server-only';
import { createFECClient } from '@/lib/integrations/fec/client';

export async function getCandidateFinance(candidateId: string, cycle: number) {
  const client = createFECClient();
  return await client.getCandidateFinancialSummary(candidateId, cycle);
}

export async function getCommitteeFinance(committeeId: string, cycle: number) {
  const client = createFECClient();
  return await client.getCommitteeFinancialSummary(committeeId, cycle);
}
```

#### **2.4 Open States API Integration**
```typescript
// web/lib/civics/openStates.ts
'use server';
import 'server-only';
import { createOpenStatesClient } from '@/lib/integrations/open-states/client';

export async function getStateLegislator(legislatorId: string) {
  const client = createOpenStatesClient();
  return await client.getLegislator(legislatorId);
}

export async function getStateBills(state: string, session: string) {
  const client = createOpenStatesClient();
  return await client.getBills(state, session);
}
```

### **Phase 3: Ingest System (Week 5-6)**

#### **3.1 Protected Ingest Route**
```typescript
// web/app/api/internal/civics/ingest/route.ts
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { AddressInputSchema } from '@/lib/civics/schemas';
import { getOrSet, addrKey, checkRate } from '@/lib/civics/cache';
import { lookupAddress } from '@/lib/civics/googleCivic';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SECRET_KEY!, 
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-ingest-key');
  if (!auth || auth !== process.env.CIVICS_INGEST_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'ingest';
  if (!(await checkRate(ip))) {
    return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
  }

  const { address } = await req.json();
  const { address: clean } = AddressInputSchema.parse({ address });
  const key = addrKey(clean);

  const data = await getOrSet(key, 3600, async () => {
    const res = await lookupAddress(clean);
    
    // Store in database
    await supabase.from('civics_addresses').upsert({
      address_hash: key,
      normalized_address: res.normalizedAddress,
      state: res.state,
      district: res.district,
      confidence: res.confidence,
      lat: res.coordinates?.lat ?? null,
      lng: res.coordinates?.lng ?? null,
      reps: res.representatives,
      sources: ['google-civic'],
    }, { onConflict: 'address_hash' });
    
    return res;
  });

  return NextResponse.json({ ok: true, data });
}
```

#### **3.2 Offline Ingest Script**
```typescript
// web/scripts/civics-ingest-addresses.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { lookupAddress } from '../lib/civics/googleCivic';
import { addrKey } from '../lib/civics/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SECRET_KEY!, 
  { auth: { persistSession: false } }
);

async function run(addresses: string[]) {
  for (const address of addresses) {
    try {
      const res = await lookupAddress(address);
      const key = addrKey(address);
      
      await supabase.from('civics_addresses').upsert({
        address_hash: key,
        normalized_address: res.normalizedAddress,
        state: res.state,
        district: res.district,
        confidence: res.confidence,
        lat: res.coordinates?.lat ?? null,
        lng: res.coordinates?.lng ?? null,
        reps: res.representatives,
        sources: ['google-civic'],
      }, { onConflict: 'address_hash' });
      
      console.log('✅ Ingested:', res.district, res.normalizedAddress);
    } catch (error) {
      console.error('❌ Failed to ingest:', address, error);
    }
  }
}

run(process.argv.slice(2)).catch((e) => { 
  console.error(e); 
  process.exit(1); 
});
```

#### **3.3 GitHub Actions Workflow**
```yaml
# .github/workflows/civics-ingest.yml
name: Civics Ingest (manual)
on: 
  workflow_dispatch:
    inputs:
      addresses:
        description: 'Comma-separated addresses to ingest'
        required: true
        default: '123 Main St, San Francisco, CA 94102'

jobs:
  ingest:
    runs-on: ubuntu-latest
    defaults: 
      run: 
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: 
          node-version: '22.x'
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npx tsx scripts/civics-ingest-addresses.ts ${{ github.event.inputs.addresses }}
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
          GOOGLE_CIVIC_API_KEY: ${{ secrets.GOOGLE_CIVIC_API_KEY }}
          CONGRESS_GOV_API_KEY: ${{ secrets.CONGRESS_GOV_API_KEY }}
          FEC_API_KEY: ${{ secrets.FEC_API_KEY }}
          OPEN_STATES_API_KEY: ${{ secrets.OPEN_STATES_API_KEY }}
          OPENSECRETS_API_KEY: ${{ secrets.OPENSECRETS_API_KEY }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
```

### **Phase 4: User-Facing API (Week 7-8)**

#### **4.1 Public API Route**
```typescript
// web/app/api/civics/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address') || '';
    
    if (!address) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    // Hash the address for lookup
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(address.toLowerCase().trim()).digest('hex');
    const key = `civics:address:${hash}`;

    // Look up in database
    const { data, error } = await supabase
      .from('civics_addresses')
      .select('*')
      .eq('address_hash', key)
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        error: 'Address not found. Please contact support to add this address.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        normalizedAddress: data.normalized_address,
        state: data.state,
        district: data.district,
        confidence: data.confidence,
        coordinates: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : undefined,
        representatives: data.reps
      }
    });
  } catch (e: any) {
    console.error('civics.lookup error', e);
    return NextResponse.json({ 
      ok: false, 
      error: 'Service temporarily unavailable' 
    }, { status: 502 });
  }
}
```

#### **4.2 Enhanced UI**
```typescript
// web/app/civics/page.tsx
'use client';
import { useState } from 'react';

export default function CivicsLookupPage() {
  const [addr, setAddr] = useState('');
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    setLoading(true);
    setResp(null);
    setError('');
    
    try {
      const r = await fetch(`/api/civics/lookup?address=${encodeURIComponent(addr)}`);
      const j = await r.json();
      
      if (!r.ok) {
        setError(j.error || 'Failed to lookup address');
        return;
      }
      
      setResp(j);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Find Your Representatives</h1>
        <p className="text-gray-600">Enter your address to discover your electoral districts and representatives</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex gap-4">
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="123 Main St, City, ST ZIP"
            className="flex-1 rounded border p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && go()}
          />
          <button 
            onClick={go} 
            disabled={loading || !addr.trim()} 
            className="rounded bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Looking…' : 'Lookup'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
      </div>

      {resp && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-lg mb-2">District Information</h3>
              <p><strong>State:</strong> {resp.data.state}</p>
              <p><strong>District:</strong> {resp.data.district}</p>
              <p><strong>Confidence:</strong> {Math.round(resp.data.confidence * 100)}%</p>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">Representatives</h3>
              {resp.data.representatives?.officials?.map((rep: any, i: number) => (
                <div key={i} className="mb-2 p-2 bg-gray-50 rounded">
                  <p><strong>{rep.name}</strong></p>
                  <p className="text-sm text-gray-600">{rep.party || 'Unknown Party'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 **Security Implementation**

### **Input Validation**
- Comprehensive address validation with regex patterns
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- Rate limiting to prevent API abuse

### **API Security**
- Protected ingest routes with secret headers
- IP allowlisting for production environments
- Request logging for audit trails
- Error handling that doesn't expose internal details

### **Data Privacy**
- Address hashing for caching without storing raw data
- Data retention policies with automatic cleanup
- User consent for data collection
- Minimal data collection principles

---

## ⚡ **Performance Optimization**

### **Caching Strategy**
- Multi-layer caching (memory + Redis)
- Configurable TTL based on data type
- Cache invalidation on data updates
- Batch processing for multiple requests

### **Database Optimization**
- Proper indexing for common queries
- Materialized views for complex aggregations
- Connection pooling for high concurrency
- Query optimization with prepared statements

### **API Optimization**
- Request batching for multiple lookups
- Async processing for heavy operations
- Background job processing for bulk operations
- CDN integration for static data

---

## 📊 **Monitoring & Observability**

### **Metrics Collection**
- API call success rates and response times
- Cache hit rates and performance
- Database query performance
- Error rates and types

### **Health Checks**
- API endpoint availability
- Database connection status
- Cache system health
- External API dependencies

### **Alerting**
- High error rates (>1%)
- Slow response times (>1 second)
- Low cache hit rates (<80%)
- API quota exhaustion warnings

---

## 🧪 **Testing Strategy**

### **Unit Testing**
- Input validation tests
- API client tests
- Database operation tests
- Error handling tests

### **Integration Testing**
- End-to-end API tests
- Database integration tests
- Cache system tests
- External API integration tests

### **Performance Testing**
- Load testing with concurrent users
- Stress testing with high request volumes
- Cache performance testing
- Database performance testing

---

## 📋 **Implementation Checklist**

### **Phase 1: Foundation (Week 1-2)**
- [ ] Set up environment variables
- [ ] Create database schema
- [ ] Implement shared types and validation
- [ ] Set up caching and rate limiting

### **Phase 2: API Integration (Week 3-4)**
- [ ] Implement Google Civic API
- [ ] Integrate Congress.gov API
- [ ] Integrate FEC API
- [ ] Integrate Open States API
- [ ] Integrate OpenSecrets API
- [ ] Integrate GovTrack API

### **Phase 3: Ingest System (Week 5-6)**
- [ ] Create protected ingest route
- [ ] Implement offline ingest script
- [ ] Set up GitHub Actions workflow
- [ ] Test bulk data ingestion

### **Phase 4: User Interface (Week 7-8)**
- [ ] Create public API route
- [ ] Build enhanced UI
- [ ] Implement error handling
- [ ] Add loading states and feedback

### **Phase 5: Production Readiness (Week 9-10)**
- [ ] Implement monitoring and alerting
- [ ] Set up performance testing
- [ ] Create comprehensive test suite
- [ ] Deploy to production with proper monitoring

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- **Response Time**: <500ms for 95% of requests
- **Availability**: 99.9% uptime
- **Error Rate**: <0.1% error rate
- **Cache Hit Rate**: >80% for address lookups

### **Business Metrics**
- **Data Coverage**: 100% of US addresses
- **Data Freshness**: <24 hours for representative data
- **User Satisfaction**: <2% complaint rate
- **API Usage**: Efficient use of rate limits

---

## 🚨 **Risk Mitigation**

### **API Dependencies**
- **Risk**: External API failures
- **Mitigation**: Fallback to cached data, retry logic, multiple data sources

### **Rate Limiting**
- **Risk**: API quota exhaustion
- **Mitigation**: Conservative rate limits, usage monitoring, quota alerts

### **Data Quality**
- **Risk**: Inaccurate or incomplete data
- **Mitigation**: Data validation, confidence scoring, manual review flags

### **Security**
- **Risk**: Data breaches or API abuse
- **Mitigation**: Input validation, rate limiting, audit logging, secure authentication

---

## 📚 **Documentation Requirements**

### **API Documentation**
- Complete endpoint documentation
- Request/response examples
- Error code reference
- Rate limiting information

### **Developer Documentation**
- Setup and configuration guide
- Database schema documentation
- Deployment procedures
- Troubleshooting guide

### **User Documentation**
- Feature overview and benefits
- Usage instructions
- FAQ and common issues
- Contact information for support

---

## 🎉 **Conclusion**

This implementation plan provides a comprehensive roadmap to transform the civics feature from mock data to a production-ready system. The plan addresses all critical issues identified in the comprehensive review and incorporates all existing civics APIs in the system.

### **Key Benefits**
- **Real Data**: Replace mock data with actual government data
- **Production Ready**: Comprehensive error handling, caching, and monitoring
- **Scalable**: Designed to handle high-volume requests efficiently
- **Secure**: Input validation, rate limiting, and data privacy protection
- **Maintainable**: Clean architecture with proper separation of concerns

### **Next Steps**
1. **Immediate**: Set up environment variables and database schema
2. **Week 1-2**: Implement foundation components (validation, caching, rate limiting)
3. **Week 3-4**: Integrate all 6 APIs with proper error handling
4. **Week 5-6**: Build ingest system with protected routes and offline scripts
5. **Week 7-8**: Create user-facing API and enhanced UI
6. **Week 9-10**: Deploy to production with monitoring and testing

The civics feature will become a robust, secure, and performant system that truly serves the democratic equalizer mission by providing accurate, up-to-date government data to users.

---

## ❓ **Questions & Feedback for Implementation**

### **1. Scope & Coverage Questions**
- **Question**: Should we expand beyond the top 10 states? What's the priority order for adding more states?
- **Question**: Should we add the SF local trial immediately or focus on federal/state coverage first?
- **Question**: How do we handle territories (Puerto Rico, DC, etc.) that have different representative structures?
- **Question**: Should we prioritize certain chambers (e.g., US House first, then Senate, then state)?

### **2. Data Quality & Validation**
- **Question**: How do we handle data conflicts between GovTrack and OpenStates for the same representative?
- **Question**: Should we implement data quality scoring for representative information completeness?
- **Question**: How often should we refresh the representative data? (Daily, weekly, monthly?)

### **3. Performance & Scalability**
- **Question**: What's the expected volume of browse API calls per day? This affects caching strategy.
- **Question**: Should we implement batch processing for bulk representative updates?
- **Question**: How do we handle API rate limits for GovTrack and OpenStates during bulk operations?

### **4. User Experience**
- **Question**: Should the browse API support filtering by level and chamber (e.g., `?level=federal&chamber=us_house`)?
- **Question**: How should we handle states that aren't in our top 10 list yet?
- **Question**: Should we provide a "coming soon" message for unsupported states or just return empty results?

### **5. Security & Privacy**
- **Question**: Should we implement IP allowlisting for the seeding script in production?
- **Question**: How long should we retain representative data? (Currently no retention policy)
- **Question**: Should we implement audit logging for all seeding operations?

### **6. Integration & Extensibility**
- **Question**: When should we integrate the other APIs (Congress.gov, FEC, OpenSecrets) into the seeding pipeline?
- **Question**: Should we implement a plugin system for adding new data sources?
- **Question**: How do we handle conflicts between data sources (e.g., different representative names between GovTrack and OpenStates)?

### **7. Monitoring & Operations**
- **Question**: What metrics should we track for the civics system? (API success rates, data freshness, representative counts, etc.)
- **Question**: Should we implement automated health checks for GovTrack and OpenStates APIs?
- **Question**: How do we handle API rate limit exhaustion gracefully during bulk seeding?

### **8. Future Enhancements**
- **Question**: When should we add address lookup functionality for user-specific representative queries?
- **Question**: When should we add campaign finance data integration (FEC, OpenSecrets)?
- **Question**: Should we implement voting record analysis and correlation with campaign finance?

---

## 🎯 **Recommended Next Steps**

### **Immediate (This Week)**
1. **Set up environment variables** - Get OpenStates and Google Civic API keys configured
2. **Run database schema updates** - Add the new tables and columns
3. **Test the seeding scripts** - Run the top-10 states seeding + SF local seeding
4. **Validate data quality** - Check that representative data is accurate and complete
5. **Test the APIs** - Verify both `/api/civics/by-state` and `/api/civics/local/sf` endpoints work

### **Short Term (Next 2 Weeks)**
1. **Implement browse API** - Add the `/api/civics/by-state` endpoint
2. **Add comprehensive error handling** - Handle edge cases and API failures
3. **Set up basic monitoring** - Track API success rates and response times
4. **Create user documentation** - Document the new features and capabilities

### **Medium Term (Next Month)**
1. **Integrate additional APIs** - Add Congress.gov, FEC, and OpenSecrets data
2. **Implement data quality scoring** - Add confidence metrics and validation
3. **Add address lookup functionality** - Implement user-specific representative queries
4. **Expand state coverage** - Add more states beyond the top 10

### **Long Term (Next Quarter)**
1. **Implement campaign finance integration** - Add FEC and OpenSecrets data
2. **Add voting record analysis** - Correlate votes with campaign finance
3. **Build advanced analytics** - Add insights and trend analysis
4. **Scale to national coverage** - Support all US states and territories

---

**Document Generated**: January 15, 2025  
**Status**: 🚀 **PRODUCTION-READY IMPLEMENTATION PLAN**  
**Next Review**: After Phase 0 implementation
