**Last Updated**: 2025-09-17
**Last Updated**: 2025-09-17
# 📚 Civics System Implementation Guide
**Last Updated**: 2025-09-17

**Created:** September 16, 2025  
**Purpose:** Complete guide to understanding and extending our civics data system

---

## 🏗️ **System Architecture Overview**

### **Data Flow**
```
External APIs → Seeding Scripts → Supabase Database → API Endpoints → Frontend
     ↓              ↓                    ↓               ↓            ↓
  GovTrack      TypeScript         PostgreSQL        Next.js      React UI
  OpenStates    Scripts            Tables           Routes        Components
  Google Civic  Validation         Indexes          Caching      User Interface
```

### **Core Components**

#### **1. Database Layer (Supabase PostgreSQL)**
```sql
-- Main tables
civics_representatives    -- All government officials
civics_divisions         -- Geographic/political divisions  
civics_addresses         -- User address lookups (future)

-- Key relationships
representatives.ocd_division_id → divisions.ocd_division_id
representatives.level → 'federal' | 'state' | 'local'
representatives.jurisdiction → 'US' | 'CA' | 'San Francisco, CA'
```

#### **2. Data Ingestion Layer**
```typescript
// Seeding scripts
civics-seed-everything.ts    // Main script (federal + state + local)
civics-seed-sf-live.ts       // SF local government
cleanup-sf-duplicates.ts     // Data cleanup utilities

// Data sources
GovTrack.us API              // Federal representatives
OpenStates API               // State legislators  
Google Civic API             // Local officials (when working)
Manual data                  // Current officials (fallback)
```

#### **3. API Layer (Next.js)**
```typescript
// Endpoints
/api/civics/by-state         // State-level data
/api/civics/local/sf         // SF local data
/api/civics/address          // Address-based lookup (future)

// Query parameters
?state=CA&level=federal      // CA federal reps
?state=CA&level=state        // CA state reps
?level=local                 // Local officials
```

---

## 🔧 **How to Add New Data Sources**

### **Step 1: Understand the Data Structure**

Every representative record needs:
```typescript
interface Representative {
  name: string;                    // "Daniel Lurie"
  party: string | null;            // "Democratic" | "Republican" | null
  office: string;                  // "Mayor" | "U.S. Senator" | "State Representative"
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;            // "US" | "CA" | "San Francisco, CA"
  district: string | null;         // "CA-SF" | "CD-28" | null
  ocd_division_id: string;         // "ocd-division/country:us/state:ca/place:san_francisco"
  contact: ContactInfo | null;     // { email, phone, website }
  raw_payload: any;               // Original API response
}
```

### **Step 2: Create a Seeding Script**

```typescript
// Example: Adding a new city
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function seedNewCity() {
  // 1. Fetch data from API
  const cityData = await fetchCityAPI();
  
  // 2. Create divisions
  await upsertDivision({
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
    level: 'local',
    chamber: 'local_city',
    state: 'CA',
    district_number: null,
    name: 'Los Angeles, CA'
  });
  
  // 3. Create representatives
  for (const official of cityData.officials) {
    await upsertRep({
      name: official.name,
      party: official.party,
      office: official.office,
      level: 'local',
      jurisdiction: 'Los Angeles, CA',
      district: 'CA-LA',
      ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
      contact: official.contact,
      raw_payload: official
    });
  }
}
```

### **Step 3: Handle API Limitations**

```typescript
// Rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Error handling
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}

// Batch processing
async function processInBatches<T>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
    await delay(100); // Small delay between batches
  }
}
```

---

## 🗄️ **Database Schema Deep Dive**

### **civics_representatives Table**
```sql
CREATE TABLE civics_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  party TEXT,
  office TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
  jurisdiction TEXT NOT NULL,
  district TEXT,
  ocd_division_id TEXT NOT NULL,
  contact JSONB,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_representatives_level ON civics_representatives(level);
CREATE INDEX idx_representatives_jurisdiction ON civics_representatives(jurisdiction);
CREATE INDEX idx_representatives_ocd_division ON civics_representatives(ocd_division_id);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX uniq_rep_local ON civics_representatives (level, jurisdiction, office, name);
```

### **civics_divisions Table**
```sql
CREATE TABLE civics_divisions (
  ocd_division_id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  chamber TEXT NOT NULL,
  state TEXT,
  district_number INTEGER,
  name TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_divisions_level ON civics_divisions(level);
CREATE INDEX idx_divisions_state ON civics_divisions(state);
```

---

## 🔄 **Data Quality & Maintenance**

### **Deduplication Strategy**
```typescript
// In-memory deduplication
function dedupeByOfficeAndName(representatives: Representative[]) {
  const seen = new Set<string>();
  return representatives.filter(rep => {
    const key = `${rep.office}|${rep.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Database-level deduplication
const { error } = await supabase
  .from('civics_representatives')
  .upsert(representative, { 
    onConflict: 'level,jurisdiction,office,name' 
  });
```

### **Data Freshness Monitoring**
```typescript
// Check for stale data
async function checkDataFreshness() {
  const { data: staleReps } = await supabase
    .from('civics_representatives')
    .select('*')
    .lt('updated_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()); // 6 months ago
  
  if (staleReps && staleReps.length > 0) {
    console.warn(`⚠️ Found ${staleReps.length} stale records`);
    // Alert or trigger update
  }
}
```

---

## 🚀 **Scaling to All 50 States**

### **Current Implementation**
```typescript
// web/scripts/civics-seed-everything.ts
const TOP10 = ['CA','TX','FL','NY','PA','IL','OH','GA','NC','MI'];
```

### **Expanded Implementation**
```typescript
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Process in batches to avoid rate limits
async function seedAllStates() {
  const batches = chunk(ALL_STATES, 5); // Process 5 states at a time
  
  for (const batch of batches) {
    console.log(`Processing batch: ${batch.join(', ')}`);
    
    await Promise.allSettled(
      batch.map(state => ingestState(state))
    );
    
    await delay(60000); // Wait 1 minute between batches
  }
}
```

### **Rate Limiting Strategy**
```typescript
// OpenStates API: 50 requests/minute
const RATE_LIMIT = {
  requests: 50,
  window: 60 * 1000, // 1 minute
  delay: 1200 // 1.2 seconds between requests
};

class RateLimiter {
  private requests: number[] = [];
  
  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < RATE_LIMIT.window);
    
    if (this.requests.length >= RATE_LIMIT.requests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = RATE_LIMIT.window - (now - oldestRequest);
      await delay(waitTime);
    }
    
    this.requests.push(now);
  }
}
```

---

## 🏙️ **Adding Los Angeles Local Data**

### **Research Phase**
1. **City Structure**: Mayor, City Council (15 districts), City Attorney, Controller
2. **Data Sources**: LA City Clerk API, LA Open Data Portal
3. **Current Officials**: Research current officeholders

### **Implementation**
```typescript
// web/scripts/civics-seed-la-local.ts
const LA_OFFICIALS = [
  {
    name: 'Karen Bass',
    office: 'Mayor',
    party: 'Democratic',
    contact: {
      email: 'mayor@lacity.org',
      website: 'https://mayor.lacity.org',
      phone: '(213) 978-0600'
    }
  },
  // ... City Council members, etc.
];

async function seedLALocal() {
  // Create LA division
  await upsertDivision({
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
    level: 'local',
    chamber: 'local_city',
    state: 'CA',
    district_number: null,
    name: 'Los Angeles, CA'
  });
  
  // Add representatives
  for (const official of LA_OFFICIALS) {
    await upsertRep({
      name: official.name,
      party: official.party,
      office: official.office,
      level: 'local',
      jurisdiction: 'Los Angeles, CA',
      district: 'CA-LA',
      ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
      contact: official.contact,
      raw_payload: official
    });
  }
}
```

---

## 🧪 **Testing & Validation**

### **Data Quality Tests**
```typescript
// web/scripts/test-civics-data.ts
async function validateDataQuality() {
  // Check for required fields
  const { data: missingNames } = await supabase
    .from('civics_representatives')
    .select('id, office')
    .or('name.is.null,name.eq.');
  
  // Check for valid levels
  const { data: invalidLevels } = await supabase
    .from('civics_representatives')
    .select('id, level')
    .not('level', 'in', '(federal,state,local)');
  
  // Check for duplicates
  const { data: duplicates } = await supabase
    .from('civics_representatives')
    .select('level, jurisdiction, office, name, count(*)')
    .group('level, jurisdiction, office, name')
    .gt('count', 1);
}
```

### **API Endpoint Tests**
```typescript
// Test all endpoints
async function testAPIEndpoints() {
  const endpoints = [
    '/api/civics/by-state?state=CA&level=federal',
    '/api/civics/by-state?state=CA&level=state',
    '/api/civics/local/sf'
  ];
  
  for (const endpoint of endpoints) {
    const response = await fetch(`http://localhost:3000${endpoint}`);
    const data = await response.json();
    
    console.log(`✅ ${endpoint}: ${data.count || data.data?.length || 0} records`);
  }
}
```

---

## 📊 **Monitoring & Alerts**

### **Data Freshness Dashboard**
```typescript
async function generateDataReport() {
  const { data: levelCounts } = await supabase
    .from('civics_representatives')
    .select('level, count(*)')
    .group('level');
  
  const { data: staleData } = await supabase
    .from('civics_representatives')
    .select('level, count(*)')
    .lt('updated_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
    .group('level');
  
  console.log('📊 Data Report:');
  console.log('===============');
  levelCounts?.forEach(({ level, count }) => {
    const stale = staleData?.find(s => s.level === level)?.count || 0;
    const freshness = ((count - stale) / count * 100).toFixed(1);
    console.log(`${level}: ${count} total, ${freshness}% fresh`);
  });
}
```

---

## 🎯 **Best Practices**

### **1. Data Ingestion**
- Always use upsert operations to prevent duplicates
- Implement proper error handling and retry logic
- Log detailed progress and error information
- Validate data before inserting

### **2. API Design**
- Use consistent response formats
- Include metadata (counts, timestamps)
- Implement proper error responses
- Add rate limiting for public endpoints

### **3. Database Management**
- Use proper indexes for query performance
- Implement data retention policies
- Monitor query performance
- Regular backup and recovery testing

### **4. Data Quality**
- Regular data freshness checks
- Cross-reference multiple sources when possible
- User feedback mechanisms for corrections
- Automated testing for data integrity

---

## 🚀 **Next Steps**

1. **Expand to All 50 States** (Priority 1)
2. **Add Los Angeles Local** (Priority 2)  
3. **Implement Data Freshness Monitoring** (Priority 3)
4. **Create Frontend UI** (Priority 4)
5. **Add More Major Cities** (Priority 5)

**Ready to build the most comprehensive civics database in the US!** 🇺🇸

---

*This guide will be updated as we expand the system. Keep it handy for reference!* 📚


