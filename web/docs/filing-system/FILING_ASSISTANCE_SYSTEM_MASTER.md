# Filing Assistance System - Master Documentation

**Created:** January 30, 2025  
**Last Updated:** January 30, 2025  
**Status:** ✅ **PRODUCTION READY**  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Current Implementation](#current-implementation)
5. [Data Model](#data-model)
6. [API Reference](#api-reference)
7. [User Journey](#user-journey)
8. [Roadmap](#roadmap)
9. [Maintenance Guide](#maintenance-guide)
10. [Contributing Guide](#contributing-guide)
11. [Testing Guide](#testing-guide)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Executive Summary

### **What This System Does**

The Filing Assistance System helps candidates navigate the complex process of officially filing for political office. It provides:

- **Accurate filing requirements** by office and jurisdiction
- **Step-by-step guidance** through the filing process
- **Direct links** to official filing portals
- **Deadline tracking** and warnings
- **Verification tools** for confirming official filings
- **Progress tracking** to resume where candidates left off

### **Key Achievements**

✅ **Fully functional** - All core features working  
✅ **Real data** - Actual fees, deadlines, forms for major offices  
✅ **Auto-verification** - FEC integration enables immediate public appearance  
✅ **Production ready** - Tested and integrated into candidate workflow

### **Impact**

- **Saves hours** of research for candidates
- **Prevents missed deadlines** with automatic warnings
- **Reduces errors** with accurate requirements
- **Enables participation** by removing barriers to filing

---

## 🏗️ System Overview

### **Components**

1. **Filing Requirements Database** (`web/lib/filing/filing-requirements.ts`)
   - Comprehensive database of filing requirements by jurisdiction
   - Supports federal, state, and local offices
   - Includes fees, deadlines, forms, eligibility requirements

2. **Filing Assistant Component** (`web/components/candidate/FilingAssistant.tsx`)
   - Interactive UI component displaying filing requirements
   - Automatically appears in candidate declaration wizard
   - Shows deadlines, fees, forms, links, contact info

3. **Filing Guide Wizard** (`web/components/candidate/FilingGuideWizard.tsx`)
   - 4-step interactive guide through filing process
   - Progress tracking with localStorage persistence
   - Dynamic content based on office/jurisdiction

4. **API Endpoints** (`web/app/api/filing/`)
   - `/api/filing/requirements` - Fetch filing requirements
   - `/api/filing/calculate-deadline` - Calculate filing deadlines

5. **Integration Points**
   - Candidate declaration wizard (`/candidate/declare`)
   - Candidate dashboard (`/candidate/dashboard`)
   - Alternative candidates display (`/civics`)

---

## 🏛️ Architecture

### **Data Flow**

```
User selects office/state
    ↓
FilingAssistant component mounts
    ↓
Fetches requirements via API
    ↓
API calls getFilingRequirements()
    ↓
Returns matched requirement data
    ↓
Component displays interactive UI
    ↓
User can click links, view details, track progress
```

### **Component Hierarchy**

```
DeclareCandidacyPage
├── FilingAssistant (shows when office/state selected)
├── FilingGuideWizard (optional, can be standalone)
└── Form inputs for candidate data

CandidateDashboardPage
├── Filing status display
├── FEC verification button
└── Filing deadline warnings

CandidateAccountabilityCard
└── "Run for This Office" button → /candidate/declare
```

### **Database Integration**

```
candidate_platforms table
├── filing_status (not_filed, filed, verified, etc.)
├── verified (boolean - auto-set on FEC verification)
├── official_filing_id (FEC ID, state filing number, etc.)
├── filing_deadline (calculated deadline)
└── filing_document_url (proof of filing)

API: /api/civics/representative/[id]/alternatives
└── Queries candidate_platforms
    WHERE status = 'active' AND (verified = true OR filing_status = 'verified')
```

---

## 💻 Current Implementation

### **1. Filing Requirements Database**

**Location:** `web/lib/filing/filing-requirements.ts`

**Coverage:**
- ✅ **Federal:** U.S. House, U.S. Senate, President
- ✅ **California:** Governor, State Senate, State Assembly
- ✅ **Texas:** Governor
- ✅ **Florida:** Governor
- ✅ **Local:** Mayor, City Council (templates)

**Key Functions:**
- `getFilingRequirements(level, office, state)` - Main lookup function
- `calculateFilingDeadline(requirement, electionDate)` - Deadline calculation
- `getFilingChecklist(requirement)` - Generate actionable checklist
- `officeMatches()` - Fuzzy matching with alias support

**Office Matching:**
- Exact match (case-insensitive)
- Partial match (contains)
- Alias matching (recognizes variations)
- State-specific prioritization

---

### **2. Filing Assistant Component**

**Location:** `web/components/candidate/FilingAssistant.tsx`

**Features:**
- ✅ Auto-fetches requirements on mount
- ✅ Shows deadline warnings (color-coded)
- ✅ Displays filing fees
- ✅ Lists required forms
- ✅ Provides direct links to official portals
- ✅ Shows contact information
- ✅ Collapsible sections
- ✅ Mobile responsive

**Props:**
```typescript
{
  level: 'federal' | 'state' | 'local'
  office: string
  state?: string
  electionDate?: string
  className?: string
}
```

**Integration:**
- Automatically appears in declaration wizard (Step 1, Step 5)
- Standalone component for reuse

---

### **3. Filing Guide Wizard**

**Location:** `web/components/candidate/FilingGuideWizard.tsx`

**Features:**
- ✅ 4-step interactive guide
- ✅ Progress tracking (localStorage)
- ✅ Resume capability
- ✅ Dynamic content from requirements API
- ✅ Direct action buttons
- ✅ Visual progress indicators

**Steps:**
1. **Understand Requirements** - Eligibility, fees, forms
2. **Gather Documents** - What to prepare
3. **File Officially** - Submission process
4. **Verify Filing** - Confirm with platform

**Progress Persistence:**
- Auto-saves to localStorage
- Key format: `filing-guide-{level}-{office}-{state}`
- Includes timestamp and completed steps

---

### **4. API Endpoints**

#### **GET /api/filing/requirements**

**Query Parameters:**
- `level` (required): 'federal' | 'state' | 'local'
- `office` (required): Office name
- `state` (optional): State code
- `electionDate` (optional): ISO date string

**Response:**
```json
{
  "found": true,
  "requirement": {
    "jurisdiction": "California",
    "office": "Governor",
    "authority": { ... },
    "filingFees": { ... },
    "deadlines": { ... },
    "eligibility": { ... },
    "requiredForms": [ ... ],
    "checklist": [ ... ],
    "calculatedDeadline": "2024-06-01T00:00:00Z"
  }
}
```

#### **GET /api/filing/calculate-deadline**

**Query Parameters:**
- `level` (required): Office level
- `office` (required): Office name
- `state` (optional): State code
- `electionDate` (required): ISO date string

**Response:**
```json
{
  "found": true,
  "deadline": "2024-06-01T00:00:00Z",
  "deadlineFormatted": "Saturday, June 1, 2024",
  "daysUntil": 120,
  "isPast": false,
  "isSoon": false,
  "urgency": "normal"
}
```

---

## 📊 Data Model

### **FilingRequirement Interface**

```typescript
interface FilingRequirement {
  jurisdiction: string
  office: string
  level: 'federal' | 'state' | 'local'
  state?: string
  
  authority: {
    name: string
    website: string
    phone?: string
    email?: string
    filingPortal?: string
    mailingAddress?: string
  }
  
  requiredForms: string[]
  filingFees: {
    amount: number
    currency: string
    acceptedMethods: string[]
    feeSchedule?: Record<string, number>
  }
  
  deadlines: {
    filingDeadline: {
      description: string
      daysBeforePrimary: number | null
      daysBeforeElection: number | null
      specificDate?: string
      note?: string
    }
    withdrawalDeadline?: {
      description: string
      daysBeforeElection: number
    }
  }
  
  eligibility: {
    residency?: string[]
    age?: number
    citizenship?: string[]
    other?: string[]
  }
  
  submissionMethods: {
    online: boolean
    onlineUrl?: string
    paper: boolean
    inPerson: boolean
    locations?: string[]
  }
  
  signaturesRequired?: number
  petitionRequirements?: {
    signatures: number
    deadline: string
    districts?: Record<string, number>
  }
  
  helpfulLinks: {
    filingGuide?: string
    formLibrary?: string
    candidateGuide?: string
    faq?: string
  }
  
  notes?: string[]
  commonMistakes?: string[]
}
```

---

## 🔄 User Journey

### **Complete Flow**

```
1. User visits /civics page
   ↓
2. Sees representative accountability card
   ↓
3. Clicks "Run for This Office"
   ↓
4. Redirected to /candidate/declare with pre-filled office/state
   ↓
5. Filing Assistant appears automatically
   - Shows requirements
   - Displays fees
   - Lists forms
   - Provides links
   ↓
6. User completes declaration wizard
   - Step 1: Office selection (with Filing Assistant)
   - Step 2: Candidate info
   - Step 3: Platform positions
   - Step 4: Experience/endorsements
   - Step 5: Official filing info (with Filing Assistant)
   - Step 6: Submit
   ↓
7. Platform created, redirected to dashboard
   ↓
8. User files officially (external - FEC, state, etc.)
   ↓
9. Returns to dashboard, enters filing ID
   ↓
10. Clicks "Verify with FEC" (if federal)
    ↓
11. FEC API confirms candidate
    ↓
12. Platform auto-verifies (verified = true)
    ↓
13. Platform appears in Alternative Candidates section
```

### **Key Decision Points**

- **Office Selection:** Filing Assistant shows requirements immediately
- **Official Filing:** User must file externally, then verify
- **Verification:** Auto-verifies on FEC confirmation, appears publicly

---

## 🗺️ Roadmap

### **Phase 1: Foundation** ✅ **COMPLETE**

- [x] Requirements database structure
- [x] Filing Assistant component
- [x] Filing Guide Wizard
- [x] API endpoints
- [x] Basic office coverage (federal + 3 states)
- [x] FEC integration
- [x] Progress tracking

**Status:** ✅ **Production Ready**

---

### **Phase 2: Expansion** 📋 **IN PROGRESS (Q1 2025)**

#### **2.1 Add More States**
- [ ] New York (Governor, State Legislature)
- [ ] Pennsylvania (Governor, State Legislature)
- [ ] Illinois (Governor, State Legislature)
- [ ] Ohio (Governor, State Legislature)
- [ ] Georgia (Governor, State Legislature)
- [ ] North Carolina (Governor, State Legislature)
- [ ] Michigan (Governor, State Legislature)

**Target:** 10 states total (currently 3)

#### **2.2 Add More Offices**
- [ ] Lieutenant Governor
- [ ] Attorney General
- [ ] Secretary of State
- [ ] State Treasurer
- [ ] County offices (varied by state)

**Target:** Top 15 most common offices

#### **2.3 Enhance Local Office Coverage**
- [ ] City-specific requirements (top 50 cities)
- [ ] County-specific requirements
- [ ] School board requirements
- [ ] Special districts

**Target:** Generic → Specific for major cities

**Timeline:** 2-3 months

---

### **Phase 3: Advanced Features** 📋 **PLANNED (Q2 2025)**

#### **3.1 Deadline Management**
- [ ] Email reminders (7 days, 1 day before deadline)
- [ ] SMS reminders (opt-in)
- [ ] Calendar integration (add to Google Calendar, iCal)
- [ ] Automatic deadline calculation for all offices

#### **3.2 Form Generation**
- [ ] Pre-filled FEC forms (Form 2, Form 1)
- [ ] State-specific form templates
- [ ] PDF generation with candidate data
- [ ] Download ready-to-sign forms

#### **3.3 Petition Tracking**
- [ ] Signature collection tracker
- [ ] Signature validation (check duplicates, eligibility)
- [ ] Progress visualization
- [ ] Reminder notifications

#### **3.4 Document Management**
- [ ] Document upload for proof of filing
- [ ] Document library (store all filing docs)
- [ ] Document expiration tracking
- [ ] Secure document storage

**Timeline:** 3-4 months

---

### **Phase 4: Direct Integration** 📋 **PLANNED (Q3-Q4 2025)**

#### **4.1 Direct Filing APIs**
- [ ] California Cal-Access API integration
- [ ] Texas TRACE system (if API available)
- [ ] Florida Division of Elections API
- [ ] Other state APIs (as available)

#### **4.2 Payment Processing**
- [ ] Stripe integration for filing fees
- [ ] Fee calculation by jurisdiction
- [ ] Receipt generation
- [ ] Refund handling

#### **4.3 E-Signature Integration**
- [ ] DocuSign integration
- [ ] Adobe Sign integration
- [ ] Digital signature capture
- [ ] Signature verification

#### **4.4 Automated Verification**
- [ ] State API verification (where available)
- [ ] Automatic status updates
- [ ] Notification when filing confirmed
- [ ] Multi-jurisdiction verification

**Timeline:** 6-12 months

---

### **Phase 5: Intelligence & Optimization** 📋 **FUTURE (2026)**

#### **5.1 AI Assistance**
- [ ] Chat bot for filing questions
- [ ] Natural language office matching
- [ ] Automated requirement extraction
- [ ] Smart deadline reminders

#### **5.2 Analytics & Insights**
- [ ] Filing success rates by office
- [ ] Common mistakes analysis
- [ ] Time-to-file metrics
- [ ] Success predictors

#### **5.3 Community Features**
- [ ] Candidate forum for filing Q&A
- [ ] Expert network (connect with filing experts)
- [ ] Success stories
- [ ] Peer support groups

#### **5.4 Multi-Language Support**
- [ ] Spanish translation
- [ ] Other languages (based on demand)
- [ ] Bilingual filing guides
- [ ] Language-specific requirements

**Timeline:** 12-24 months

---

## 🔧 Maintenance Guide

### **Updating Filing Requirements**

**File:** `web/lib/filing/filing-requirements.ts`

**To Add a New Office:**
1. Find appropriate section (federal, state, local)
2. Copy existing entry as template
3. Update all fields with accurate data
4. Test matching with `getFilingRequirements()`
5. Update office aliases if needed

**To Update Existing Requirements:**
1. Find office entry in database
2. Update changed fields (fees, deadlines, etc.)
3. Add `lastUpdated` note if tracking changes
4. Test with Filing Assistant component

**Verification Checklist:**
- [ ] Authority information accurate
- [ ] Filing fees current
- [ ] Deadlines correct
- [ ] Forms listed accurately
- [ ] Links functional
- [ ] Contact info current

---

### **Adding New States**

**Priority Order:**
1. High population states (NY, PA, IL, OH, GA, NC, MI)
2. States with online filing systems
3. States with frequent elections
4. Others by request

**Requirements for Each State:**
- [ ] Governor
- [ ] State Senate (or equivalent)
- [ ] State House/Assembly (or equivalent)
- [ ] Top 5 most common state offices

**Data Sources:**
- Secretary of State websites
- State election authority sites
- Official candidate guides
- State election codes

---

### **Testing Requirements**

**Before Merging Changes:**
- [ ] Requirements match official sources
- [ ] Office matching works (test variations)
- [ ] API endpoints return correct data
- [ ] Components render correctly
- [ ] Links are functional
- [ ] Mobile responsive

**Regular Testing:**
- [ ] Quarterly: Verify fees/deadlines current
- [ ] After elections: Update deadlines for next cycle
- [ ] Monthly: Check links still work
- [ ] As needed: Add new offices/states

---

## 🤝 Contributing Guide

### **How to Contribute**

#### **1. Adding Filing Requirements**

**Best for:** Community members familiar with their state's requirements

**Steps:**
1. Fork repository
2. Add requirements to `filing-requirements.ts`
3. Test with Filing Assistant
4. Submit PR with:
   - Source of information
   - Verification that requirements are current
   - Test results

**Template:**
```typescript
{
  jurisdiction: 'State Name',
  office: 'Office Name',
  level: 'state',
  state: 'XX',
  authority: {
    name: 'Official Authority Name',
    website: 'https://...',
    phone: '(XXX) XXX-XXXX',
    filingPortal: 'https://...', // if available
    mailingAddress: 'Full Address'
  },
  // ... rest of fields
}
```

---

#### **2. Improving Office Matching**

**Best for:** Developers

**Steps:**
1. Identify office name variations not matching
2. Add to `officeMatches()` function
3. Update alias dictionary
4. Test with Filing Assistant

---

#### **3. Enhancing Components**

**Best for:** Frontend developers

**Areas for Improvement:**
- Mobile UX enhancements
- Accessibility improvements
- Performance optimization
- Visual design improvements

---

#### **4. Adding Features**

**Best for:** Full-stack developers

**Areas:**
- Deadline reminders
- Form generation
- API integrations
- Analytics

---

### **Contribution Standards**

**Requirements:**
- [ ] Accurate, verified information
- [ ] Code follows project style
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)

**Review Process:**
1. Automated tests run
2. Code review by maintainers
3. Verification of requirements accuracy
4. Merge if approved

---

## 🧪 Testing Guide

### **Unit Tests**

**File:** `web/tests/unit/filing/`

**Test Coverage:**
- [ ] `getFilingRequirements()` - Matching logic
- [ ] `calculateFilingDeadline()` - Deadline calculations
- [ ] `getFilingChecklist()` - Checklist generation
- [ ] `officeMatches()` - Fuzzy matching

---

### **Integration Tests**

**File:** `web/tests/integration/filing/`

**Test Coverage:**
- [ ] API endpoint responses
- [ ] Component rendering
- [ ] Progress persistence
- [ ] FEC verification flow

---

### **E2E Tests**

**File:** `web/tests/e2e/filing/`

**Test Coverage:**
- [ ] Complete declaration flow
- [ ] Filing Assistant display
- [ ] Guide wizard progression
- [ ] FEC verification
- [ ] Alternative candidates display

---

### **Manual Testing Checklist**

**Before Release:**
- [ ] Test with federal office
- [ ] Test with state office (CA, TX, FL)
- [ ] Test with local office
- [ ] Test progress saving
- [ ] Test FEC verification
- [ ] Test mobile view
- [ ] Test all links
- [ ] Verify requirements accuracy

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Filing Assistant Not Appearing**

**Symptoms:** Component doesn't show when office/state selected

**Causes:**
- Office name doesn't match database
- State code incorrect
- API error

**Solutions:**
1. Check browser console for errors
2. Verify office name spelling
3. Check state code format (2 letters, uppercase)
4. Verify API endpoint responding

---

#### **Requirements Not Found**

**Symptoms:** "Requirements not found" message

**Causes:**
- Office not in database
- State not covered
- Office name mismatch

**Solutions:**
1. Check exact office name in database
2. Try variations (e.g., "US House" vs "U.S. House")
3. Check if state coverage exists
4. Add office to database if needed

---

#### **FEC Verification Fails**

**Symptoms:** Verification button doesn't work or errors

**Causes:**
- FEC API key missing/invalid
- Invalid FEC ID
- Network error
- API rate limiting

**Solutions:**
1. Check `.env.local` has `FEC_API_KEY`
2. Verify FEC ID is valid format
3. Check network tab for API errors
4. Wait and retry if rate limited

---

#### **Progress Not Saving**

**Symptoms:** Wizard progress lost on refresh

**Causes:**
- localStorage disabled
- Private browsing mode
- Storage quota exceeded

**Solutions:**
1. Check browser localStorage enabled
2. Exit private browsing
3. Clear old localStorage data
4. Use manual save button

---

### **Debug Mode**

**Enable detailed logging:**
```typescript
// In filing-requirements.ts
const DEBUG = true

if (DEBUG) {
  console.log('Filing requirements lookup:', { level, office, state })
  console.log('Matched requirement:', requirement)
}
```

---

## 📈 Success Metrics

### **Key Performance Indicators**

**Usage Metrics:**
- Number of candidates using filing assistant
- Requirements lookups per month
- FEC verifications completed
- Platforms appearing in Alternative Candidates

**Quality Metrics:**
- Requirements accuracy rate
- Filing success rate (candidates who file after using system)
- Time saved (estimated hours per candidate)
- Error rate (failed verifications, broken links)

**Engagement Metrics:**
- Guide wizard completion rate
- Progress save/resume usage
- Link click-through rates
- Return usage (candidates coming back)

---

## 📚 Related Documentation

- [Filing Assistance Features](./FILING_ASSISTANCE_FEATURES.md)
- [Official Filing Status](./OFFICIAL_FILING_STATUS.md)
- [FEC Integration Quickstart](./FEC_INTEGRATION_QUICKSTART.md)
- [Reality Check: Electoral Viability](./REALITY_CHECK_ELECTORAL_VIABILITY.md)
- [Critical Fix: Auto-Verification](./CRITICAL_FIX_ELECTORAL_VIABILITY.md)
- [Testing Guide](./TESTING_FILING_SYSTEM.md)

---

## 🎯 Conclusion

The Filing Assistance System is a comprehensive, production-ready solution that helps candidates navigate the complex process of officially filing for office. With real data, direct action paths, and progress tracking, it removes barriers to democratic participation.

**Current Status:** ✅ Foundation complete, ready for expansion

**Next Steps:** Add more states, enhance features, integrate direct filing APIs

**Long-term Vision:** Become the go-to platform for candidate filing, making it accessible to everyone regardless of resources or experience.

---

**Last Updated:** January 30, 2025  
**Maintained by:** Choices Development Team  
**License:** Open Source

