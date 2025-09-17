# Agent A3: Electoral & Civics Data Types

**Created**: 2025-09-16  
**Scope**: Fix TypeScript `any` types in electoral and civics modules  
**Files**: 8 files, ~80 errors  
**Estimated Time**: 5-6 hours

## Target Files & Error Counts

### High Priority (Critical Errors)
1. **`lib/electoral/financial-transparency.ts`** - 25+ `any` types + unused vars
2. **`lib/integrations/google-civic/error-handling.ts`** - 12+ `any` types
3. **`lib/electoral/geographic-feed.ts`** - 6+ `any` types + unused vars
4. **`lib/civics/types.ts`** - 10+ `any` types

### Medium Priority
5. **`lib/integrations/congress-gov/error-handling.ts`** - 5+ `any` types
6. **`lib/integrations/fec/client.ts`** - 3+ `any` types
7. **`lib/integrations/congress-gov/client.ts`** - 1+ `any` type

### Lower Priority
8. **`lib/electoral/candidate-verification.ts`** - unused vars only
9. **`lib/electoral/feed-service.ts`** - unused vars only

## Detailed Error Analysis

### `lib/electoral/financial-transparency.ts` (25+ errors)
```typescript
// Lines with `any` types:
435:54  Error: Unexpected any. Specify a different type.
451:59  Error: Unexpected any. Specify a different type.
478:61  Error: Unexpected any. Specify a different type.
618:54  Error: Unexpected any. Specify a different type.
637:60  Error: Unexpected any. Specify a different type.
637:66  Error: Unexpected any. Specify a different type.
642:45  Error: Unexpected any. Specify a different type.
642:66  Error: Unexpected any. Specify a different type.
642:82  Error: Unexpected any. Specify a different type.
647:86  Error: Unexpected any. Specify a different type.
652:91  Error: Unexpected any. Specify a different type.
657:75  Error: Unexpected any. Specify a different type.
662:75  Error: Unexpected any. Specify a different type.
667:64  Error: Unexpected any. Specify a different type.
667:97  Error: Unexpected any. Specify a different type.
667:113 Error: Unexpected any. Specify a different type.
672:71  Error: Unexpected any. Specify a different type.
677:64  Error: Unexpected any. Specify a different type.
677:80  Error: Unexpected any. Specify a different type.
682:88  Error: Unexpected any. Specify a different type.
682:104 Error: Unexpected any. Specify a different type.

// Unused vars (many):
502:5  Warning: 'candidateId' is defined but never used.
503:5  Warning: 'cycle' is defined but never used.
504:5  Warning: 'independenceScore' is defined but never used.
// ... and many more
```

**Key Tasks**:
1. Define FEC API response types
2. Type campaign finance data structures
3. Create proper contribution and expenditure types
4. Fix unused variable warnings

### `lib/integrations/google-civic/error-handling.ts` (12+ errors)
```typescript
// Lines with `any` types:
20:31  Error: Unexpected any. Specify a different type.
49:22  Error: Unexpected any. Specify a different type.
49:52  Error: Unexpected any. Specify a different type.
100:34 Error: Unexpected any. Specify a different type.
100:64 Error: Unexpected any. Specify a different type.
209:30 Error: Unexpected any. Specify a different type.
286:65 Error: Unexpected any. Specify a different type.
307:66 Error: Unexpected any. Specify a different type.
327:47 Error: Unexpected any. Specify a different type.
327:77 Error: Unexpected any. Specify a different type.
336:28 Error: Unexpected any. Specify a different type.
```

**Key Tasks**:
1. Define Google Civic API error types
2. Type API response error structures
3. Create proper error handling interfaces
4. Type retry and fallback mechanisms

### `lib/electoral/geographic-feed.ts` (6+ errors)
```typescript
// Lines with `any` types:
453:23 Error: Unexpected any. Specify a different type.
478:23 Error: Unexpected any. Specify a different type.
488:32 Error: Unexpected any. Specify a different type.
489:44 Error: Unexpected any. Specify a different type.
514:21 Error: Unexpected any. Specify a different type.

// Unused vars:
400:38 Warning: 'location' is defined but never used.
443:32 Warning: 'location' is defined but never used.
452:5  Warning: 'location' is defined but never used.
453:5  Warning: 'currentOfficials' is defined but never used.
454:5  Warning: 'activeRaces' is defined but never used.
// ... and more
```

**Key Tasks**:
1. Define geographic and electoral district types
2. Type official and candidate data structures
3. Create proper location and jurisdiction types
4. Fix unused variable warnings

### `lib/civics/types.ts` (10+ errors)
```typescript
// Lines with `any` types:
42:25  Error: Unexpected any. Specify a different type.
95:30  Error: Unexpected any. Specify a different type.
129:30 Error: Unexpected any. Specify a different type.
164:30 Error: Unexpected any. Specify a different type.
197:30 Error: Unexpected any. Specify a different type.
232:30 Error: Unexpected any. Specify a different type.
246:39 Error: Unexpected any. Specify a different type.
262:26 Error: Unexpected any. Specify a different type.
377:26 Error: Unexpected any. Specify a different type.
412:14 Error: Unexpected any. Specify a different type.
```

**Key Tasks**:
1. Define civics data structure types
2. Type government official and agency data
3. Create proper policy and legislation types
4. Type civic engagement metrics

## Implementation Strategy

### 1. Create Electoral Type Definitions
Create `lib/electoral/types.ts`:
```typescript
// Financial Transparency Types
export interface FECContribution {
  contributor_id: string;
  contributor_name: string;
  contributor_type: 'individual' | 'committee' | 'organization';
  amount: number;
  date: string;
  candidate_id: string;
  committee_id: string;
  election_cycle: string;
}

export interface FECExpenditure {
  expenditure_id: string;
  payee_name: string;
  amount: number;
  date: string;
  purpose: string;
  candidate_id: string;
  committee_id: string;
  election_cycle: string;
}

export interface CampaignFinanceSummary {
  candidate_id: string;
  cycle: string;
  total_contributions: number;
  total_expenditures: number;
  cash_on_hand: number;
  debt: number;
  independence_score: number;
}

export interface IndustryContribution {
  industry: string;
  amount: number;
  percentage: number;
  candidate_id: string;
  cycle: string;
}

// Geographic and Electoral Types
export interface ElectoralDistrict {
  id: string;
  name: string;
  type: 'congressional' | 'state' | 'local';
  state: string;
  boundaries: GeoJSON.Feature;
  population: number;
  registered_voters: number;
}

export interface GovernmentOfficial {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  term_start: Date;
  term_end: Date;
  contact_info: ContactInfo;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
```

### 2. Create Civics Type Definitions
Create `lib/civics/types.ts`:
```typescript
// Civics Data Types
export interface GovernmentAgency {
  id: string;
  name: string;
  type: 'federal' | 'state' | 'local';
  jurisdiction: string;
  description: string;
  website: string;
  contact_info: ContactInfo;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  status: 'proposed' | 'active' | 'inactive' | 'repealed';
  effective_date: Date;
  expiration_date?: Date;
  jurisdiction: string;
  category: string;
  tags: string[];
}

export interface Legislation {
  id: string;
  title: string;
  bill_number: string;
  status: 'introduced' | 'committee' | 'floor' | 'passed' | 'vetoed';
  chamber: 'house' | 'senate';
  session: string;
  sponsors: string[];
  summary: string;
  full_text_url: string;
  last_action: string;
  last_action_date: Date;
}

export interface CivicEngagement {
  user_id: string;
  actions: CivicAction[];
  total_score: number;
  last_updated: Date;
}

export interface CivicAction {
  type: 'vote' | 'contact' | 'petition' | 'donation' | 'volunteer';
  description: string;
  date: Date;
  impact_score: number;
  verified: boolean;
}
```

### 3. Create Integration API Types
Create `lib/integrations/types.ts`:
```typescript
// Google Civic API Types
export interface GoogleCivicError {
  error: {
    code: number;
    message: string;
    status: string;
    details: Array<{
      '@type': string;
      field_violations: Array<{
        field: string;
        description: string;
      }>;
    }>;
  };
}

export interface GoogleCivicResponse<T> {
  kind: string;
  etag: string;
  data: T;
  error?: GoogleCivicError;
}

export interface RepresentativeInfo {
  offices: Office[];
  officials: Official[];
}

export interface Office {
  name: string;
  divisionId: string;
  levels: string[];
  roles: string[];
  sources: Source[];
  officialIndices: number[];
}

export interface Official {
  name: string;
  address: Address[];
  party: string;
  phones: string[];
  urls: string[];
  photoUrl: string;
  emails: string[];
  channels: Channel[];
}

// FEC API Types
export interface FECResponse<T> {
  results: T[];
  pagination: {
    page: number;
    per_page: number;
    count: number;
    pages: number;
  };
}

export interface FECError {
  error: {
    code: string;
    message: string;
    details: string;
  };
}

// Congress.gov API Types
export interface CongressGovResponse<T> {
  results: T[];
  pagination: {
    count: number;
    next: string;
    previous: string;
  };
}

export interface Bill {
  congress: number;
  bill_id: string;
  bill_type: string;
  number: string;
  title: string;
  short_title: string;
  introduced_date: string;
  sponsor: Sponsor;
  subjects: string[];
  summary: string;
  latest_action: LatestAction;
}

export interface Sponsor {
  bioguide_id: string;
  first_name: string;
  last_name: string;
  party: string;
  state: string;
}

export interface LatestAction {
  action_date: string;
  text: string;
}
```

### 4. Type Implementation Examples

#### Before (with `any`):
```typescript
export async function getCampaignFinance(
  candidateId: string,
  cycle: string
): Promise<any> {
  const response = await fecClient.getContributions(candidateId, cycle);
  return response.data;
}
```

#### After (properly typed):
```typescript
export async function getCampaignFinance(
  candidateId: string,
  cycle: string
): Promise<FECResponse<FECContribution>> {
  const response = await fecClient.getContributions(candidateId, cycle);
  return response.data;
}
```

## Testing Strategy

### 1. Unit Tests
- Test FEC API integration functions
- Test Google Civic API error handling
- Test geographic data processing
- Test civics data validation

### 2. Integration Tests
- Test external API integrations
- Test data transformation and mapping
- Test error handling and retry logic
- Test rate limiting and caching

### 3. Data Validation Tests
- Test FEC contribution data validation
- Test geographic boundary validation
- Test civics data integrity
- Test API response parsing

## Success Criteria

### Phase 1: Critical Fixes
- [ ] Zero `any` types in `financial-transparency.ts`
- [ ] Zero `any` types in `google-civic/error-handling.ts`
- [ ] Zero `any` types in `geographic-feed.ts`
- [ ] Zero `any` types in `civics/types.ts`

### Phase 2: Complete Module
- [ ] All 8 files have zero `any` types
- [ ] All unused variables prefixed with `_` or removed
- [ ] All API integrations properly typed
- [ ] Build passes for electoral and civics modules

### Phase 3: Validation
- [ ] `npm run build` completes successfully
- [ ] `npm run lint` passes with zero errors
- [ ] All TypeScript strict mode checks pass
- [ ] External API integrations work correctly

## File-by-File Checklist

### High Priority Files
- [ ] `lib/electoral/financial-transparency.ts` - 25+ `any` types + unused vars → 0
- [ ] `lib/integrations/google-civic/error-handling.ts` - 12+ `any` types → 0
- [ ] `lib/electoral/geographic-feed.ts` - 6+ `any` types + unused vars → 0
- [ ] `lib/civics/types.ts` - 10+ `any` types → 0

### Medium Priority Files
- [ ] `lib/integrations/congress-gov/error-handling.ts` - 5+ `any` types → 0
- [ ] `lib/integrations/fec/client.ts` - 3+ `any` types → 0
- [ ] `lib/integrations/congress-gov/client.ts` - 1+ `any` type → 0

### Lower Priority Files
- [ ] `lib/electoral/candidate-verification.ts` - unused vars → 0
- [ ] `lib/electoral/feed-service.ts` - unused vars → 0

## Notes

- Focus on external API integration types first
- Maintain compatibility with existing FEC and Google Civic APIs
- Test thoroughly as API changes can break data ingestion
- Coordinate with other agents for shared type definitions
- Use existing API documentation for type definitions
- Consider rate limiting and error handling in type definitions
