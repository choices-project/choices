# Alternative Candidates System

**Created:** January 30, 2025  
**Updated:** January 30, 2025  
**Status:** ✅ Implemented (UI) | ⚠️ Mock Data (No API Integration Yet)  
**Feature Flag:** `ALTERNATIVE_CANDIDATES: true`

> **See Also:** [Candidate Platform Builder](./CANDIDATE_PLATFORM_BUILDER.md) - Vision for users to declare candidacy and build platforms within the app

---

## 🎯 Overview

The Alternative Candidates system is a feature within the **Candidate Accountability Card** that showcases non-duopoly candidates (Independent, Green Party, etc.) running for the same office as the current representative. This feature aims to increase transparency and provide voters with information about alternatives to traditional major-party candidates.

---

## 🏗️ System Architecture

### **Integration Points**

#### **1. Component Integration**
- **Component:** `CandidateAccountabilityCard` (`web/components/civics/CandidateAccountabilityCard.tsx`)
- **Location:** Displayed on the `/civics` page for each representative
- **Trigger:** Part of the accountability card when `CANDIDATE_ACCOUNTABILITY` feature flag is enabled
- **Prop Interface:** `alternativeCandidates?: AlternativeCandidate[]`

#### **2. Feature Flag System**
```typescript
ALTERNATIVE_CANDIDATES: true  // Platform for non-duopoly candidates
```
- Controlled by: `web/lib/core/feature-flags.ts`
- Status: Enabled globally

#### **3. Display Integration**
The alternative candidates section appears:
- Below other accountability card tabs (Overview, Campaign Finance, Voting Record, Performance)
- As a collapsible section with "Show/Hide Alternatives" toggle
- Only visible when alternative candidates data exists

---

## 📊 Data Model

### **AlternativeCandidate Type**
```typescript
type AlternativeCandidate = {
  id: string;                    // Unique identifier
  name: string;                  // Candidate full name
  party: string;                 // Party affiliation (Independent, Green Party, etc.)
  platform: string[];            // Array of platform positions/issues
  experience: string;            // Background/qualifications
  endorsements: string[];        // Organizations endorsing the candidate
  funding: {
    total: number;               // Total campaign funding amount
    sources: string[];           // Funding sources (e.g., "Small Donors", "Grassroots")
  };
  visibility: 'high' | 'medium' | 'low';  // Candidate visibility level
};
```

### **Current Data Source**

⚠️ **IMPORTANT:** Currently uses **mock/demo data** only. No API integration exists yet.

- **Mock Data Location:** Hardcoded in `CandidateAccountabilityCard.tsx` (lines 229-256)
- **Fallback Behavior:** Component uses mock data if `alternativeCandidates` prop is empty
- **Data Flow:** 
  ```
  [No API] → Mock Data → Component Display
  ```

---

## 🎨 UI/UX Features

### **Visual Display**
1. **Section Header**
   - Title: "Alternative Candidates"
   - Toggle Button: "Show/Hide Alternatives" (blue link style)

2. **Candidate Cards**
   - Each candidate displayed in a bordered card
   - Candidate name and party badge
   - Visibility indicator (color-coded badge)
   - Platform points (bulleted list)
   - Experience description
   - Funding information (formatted currency)
   - Endorsement count

3. **Visibility Badges**
   - **High Visibility:** Green badge (`bg-green-100 text-green-800`)
   - **Medium Visibility:** Yellow badge (`bg-yellow-100 text-yellow-800`)
   - **Low Visibility:** Gray badge (`bg-gray-100 text-gray-800`)

### **User Interaction**
- **Toggle Visibility:** Users can show/hide the alternatives section
- **Collapsible:** Section starts collapsed (hidden) by default
- **State Management:** React state (`showAlternatives`) controls visibility

---

## 🔗 Integration with Civics Systems

### **1. Candidate Accountability Card**
- **Relationship:** Alternative candidates are a **sub-feature** of the accountability card
- **Dependencies:** 
  - Requires `CANDIDATE_ACCOUNTABILITY` feature flag to be enabled
  - Component must receive representative data

### **2. Civics Page Integration**
- **Location:** `/civics` page (`web/app/civics/page.tsx`)
- **Display Logic:**
  ```typescript
  {isFeatureEnabled('CANDIDATE_ACCOUNTABILITY') && (
    <CandidateAccountabilityCard
      representative={{...}}
      // alternativeCandidates prop NOT currently passed
      // Component falls back to mock data
    />
  )}
  ```

### **3. Data Systems (Potential Integrations)**

#### **A. Representative Database**
- **Table:** `representatives_core`
- **Status:** ✅ Active (1,273 representatives)
- **Connection:** Could be used to identify office/race and find challengers

#### **B. Candidate Database**
- **Table:** `candidates` (referenced in `GeographicService`)
- **Status:** ⚠️ Schema exists, integration pending
- **Potential Use:** Query alternative candidates by:
  - `ocd_division_id` (geographic location)
  - `office` (same office as incumbent)
  - `level` (federal, state, local)
  - `party` (filter for non-major-party)

#### **C. Geographic Service**
- **Service:** `GeographicService.findCandidatesByLocation()`
- **Capability:** Can search for candidates by location
- **Status:** ⚠️ Service exists but not connected to alternative candidates feature

#### **D. FEC Campaign Finance**
- **Table:** `civics_fec_minimal` (92 FEC records)
- **Connection:** Could enhance funding data for alternative candidates
- **Status:** Data exists but not linked to alternative candidates

---

## 📋 Current Implementation Status

### **✅ Completed**
- [x] UI component for displaying alternative candidates
- [x] Feature flag enabled
- [x] Integration with Candidate Accountability Card
- [x] Mock data structure defined
- [x] Collapsible show/hide functionality
- [x] Visibility level badges
- [x] Platform, funding, and endorsement display
- [x] E2E tests created (`candidate-accountability-alternatives.spec.ts`)

### **⚠️ Pending/Not Implemented**
- [ ] API endpoint for fetching alternative candidates
- [ ] Database integration to query real candidate data
- [ ] Connection to `candidates` table or external candidate sources
- [ ] Integration with `GeographicService` to find candidates by location
- [ ] Link to representative office/race to identify challengers
- [ ] Real-time candidate data (currently static mock data)
- [ ] FEC data integration for alternative candidate funding
- [ ] Candidate verification system

---

## 🚀 Future Integration Points

### **Recommended API Endpoint**
```
GET /api/v1/civics/representative/:id/alternatives
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "representative_id": "123",
    "office": "U.S. House (CA-15)",
    "alternatives": [
      {
        "id": "alt-1",
        "name": "Jordan Kim",
        "party": "Green Party",
        "platform": [...],
        "experience": "...",
        "endorsements": [...],
        "funding": {
          "total": 45000,
          "sources": [...]
        },
        "visibility": "medium"
      }
    ]
  }
}
```

### **Database Query Strategy**
1. **Identify Office/Race:** Use representative's office and district
2. **Find Challengers:** Query `candidates` table for:
   - Same `office` and `district`
   - Different `party` (exclude major parties: Democratic, Republican)
   - Active/verified candidates
3. **Enrich Data:** Join with:
   - FEC data for funding
   - Campaign finance records
   - Endorsement databases (if available)

### **Geographic Integration**
```typescript
// Potential integration pattern
const geographicService = new GeographicService();
const alternativeCandidates = await geographicService.findCandidatesByLocation(
  { state: representative.state, district: representative.district },
  {
    level: representative.level,
    office: representative.office,
    verified: true
  }
);
// Filter for non-major-party candidates
const alternatives = alternativeCandidates.filter(
  candidate => !['Democratic', 'Republican'].includes(candidate.party)
);
```

---

## 📝 Usage Example

### **Current Usage (Mock Data)**
```tsx
<CandidateAccountabilityCard
  representative={{
    id: 'rep-123',
    name: 'John Smith',
    office: 'U.S. House (CA-15)',
    // ... other representative data
  }}
  // alternativeCandidates prop omitted - uses mock data
/>
```

### **Future Usage (Real Data)**
```tsx
// In civics page or API route
const alternatives = await fetch(
  `/api/v1/civics/representative/${rep.id}/alternatives`
).then(r => r.json());

<CandidateAccountabilityCard
  representative={rep}
  alternativeCandidates={alternatives.data.alternatives}
/>
```

---

## 🔍 Testing

### **E2E Tests**
- **File:** `web/tests/e2e/candidate-accountability-alternatives.spec.ts`
- **Coverage:**
  - Section visibility when candidates exist
  - Show/Hide toggle functionality
  - Candidate information display
  - Platform, funding, endorsement rendering
  - Visibility level badges

### **Test Status**
- ✅ Test file created
- ⚠️ Tests use mocked API responses (no real data source yet)

---

## 📊 Related Features

### **Dependent Features**
- **CANDIDATE_ACCOUNTABILITY:** Required parent feature
- **CIVICS_REPRESENTATIVE_DATABASE:** Provides representative context
- **CIVICS_CAMPAIGN_FINANCE:** Could enhance funding data

### **Complementary Features**
- **CANDIDATE_CARDS:** General candidate display (separate from alternatives)
- **CIVICS_VOTING_RECORDS:** Compare voting records across candidates
- **CIVICS_ADDRESS_LOOKUP:** Identify candidates by geographic location

---

## 🎯 Purpose & Goals

### **Primary Goals**
1. **Transparency:** Show voters who else is running for office
2. **Democracy:** Increase visibility of non-duopoly candidates
3. **Informed Voting:** Provide platform and funding information for alternatives
4. **Competition:** Enable voters to compare all candidates, not just incumbents

### **Design Philosophy**
- **Non-Partisan:** Show all verified alternative candidates
- **Transparent:** Display funding sources and endorsements
- **Accessible:** Make it easy to discover and compare alternatives
- **Privacy-Safe:** No personal data collection required

---

## 📚 Related Documentation

- [Candidate Accountability Card](../components/CANDIDATE_ACCOUNTABILITY_CARD.md)
- [Civics Representative Database](../implementation/features/CIVICS_REPRESENTATIVE_DATABASE.md)
- [Campaign Finance Integration](../implementation/features/CIVICS_CAMPAIGN_FINANCE.md)
- [Feature Flags](../core/FEATURE_FLAGS_COMPREHENSIVE.md)

---

**Last Updated:** January 30, 2025  
**Next Review:** February 6, 2025

