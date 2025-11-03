# Official Filing Integration Strategy

**Created:** January 30, 2025  
**Status:** 📋 **STRATEGIC PLANNING DOCUMENT**  
**Project Type:** Open Source

---

## 🎯 Vision

Enable users to officially file for candidacy directly through the Choices platform, making it the easiest way for grassroots candidates to enter electoral races.

---

## ⚠️ Current State vs. Vision

### **What We Have Now** ✅
- ✅ Collection of filing information (FEC ID, filing dates, etc.)
- ✅ Document upload (proof of filing)
- ✅ Filing status tracking
- ✅ Deadline reminders
- ✅ Verification workflow (admin review)

### **What We Don't Have Yet** ❌
- ❌ Direct submission to election authorities (FEC, Secretary of State, etc.)
- ❌ API integrations with official filing systems
- ❌ Automated filing verification via official APIs
- ❌ Electronic signature capture for official forms
- ❌ Payment processing for filing fees

**Current System = "Filing Preparation & Verification Platform"**  
**Vision = "End-to-End Official Filing Platform"**

---

## 🏛️ Official Filing Requirements by Jurisdiction

### **Federal Offices** (U.S. House, Senate, President)
- **Authority:** Federal Election Commission (FEC)
- **Filing Method:**
  - **Paper:** Mail physical forms
  - **Electronic:** FECFile software (Windows only) or web-based eFiling
  - **API:** Limited public API for candidate lookups (not filing)
- **Requirements:**
  - Statement of Candidacy (Form 2)
  - Statement of Organization (Form 1)
  - Filing fee: $0 (federal)
  - Signature required (can be electronic in some cases)
- **Deadline:** 15 days after raising/spending $5,000

### **State Offices** (Governor, State Legislature, etc.)
- **Authority:** State Secretary of State or Elections Division
- **Filing Method:** Varies by state
  - **California:** Online filing via Cal-Access
  - **New York:** Paper forms via mail or in-person
  - **Texas:** Online via TRACE system
  - **Florida:** Online via Division of Elections
- **Requirements:**
  - State-specific forms
  - Filing fees (varies: $0-$10,000+)
  - Signature (varies: electronic accepted in some states)
  - Residency verification
- **Deadline:** 60-90 days before primary (varies)

### **Local Offices** (City Council, Mayor, School Board)
- **Authority:** Local Board of Elections or City Clerk
- **Filing Method:** Highly variable
  - Some have online systems
  - Many require paper forms
  - In-person filing common
- **Requirements:**
  - Local forms
  - Filing fees (often $0-$500)
  - Signature requirements
  - Residency verification
- **Deadline:** 30-60 days before election (varies)

---

## 🔌 Integration Approaches (Ranked by Feasibility)

### **Approach 1: Partner with Existing Services** ⭐⭐⭐⭐⭐
**Best for: Open Source Project**

#### **Existing Platforms:**
1. **Turbovote / Democracy Works**
   - Handles voter registration
   - Could potentially expand to candidate filing
   - Partnership model possible

2. **Ballotpedia API**
   - Candidate information database
   - Not for filing, but for verification

3. **Vote.org**
   - Voter-focused, but might partner for candidate services

4. **VoteSmart / Vote411**
   - Candidate information
   - Could provide filing guidance

#### **Benefits:**
- ✅ Leverage existing infrastructure
- ✅ Reduce legal liability
- ✅ Faster implementation
- ✅ Built-in compliance

#### **Implementation:**
```typescript
// Example integration pattern
interface FilingService {
  submitFiling(candidateData: CandidateFilingData): Promise<FilingResult>
  verifyFiling(filingId: string): Promise<VerificationResult>
  getStatus(filingId: string): Promise<FilingStatus>
}

// Partner service adapter
class DemocracyWorksFilingService implements FilingService {
  async submitFiling(data: CandidateFilingData) {
    // Integrate with partner API
    // Handle authentication, signatures, payments
  }
}
```

---

### **Approach 2: Direct FEC Integration** ⭐⭐⭐⭐
**Best for: Federal Offices**

#### **FEC API Capabilities:**
- ✅ Public API for candidate lookups
- ✅ Real-time candidate data
- ✅ Committee information
- ❌ **No official filing API** (filing must be done via FECFile or web portal)

#### **Hybrid Approach:**
1. **Use FEC API for verification**
   ```typescript
   // Verify candidate filing via FEC API
   async function verifyFECFiling(fecId: string) {
     const response = await fetch(
       `https://api.open.fec.gov/v1/candidates/?candidate_id=${fecId}&api_key=${FEC_API_KEY}`
     )
     const data = await response.json()
     return data.results.length > 0
   }
   ```

2. **Guide users to official FEC filing**
   - Pre-fill forms from our data
   - Generate FEC-ready PDFs
   - Link to official FEC eFiling portal
   - Track filing status via API

#### **Implementation:**
```typescript
// FEC Filing Helper
class FECFilingHelper {
  // Generate FEC Form 2 (Statement of Candidacy) from our data
  generateForm2(candidate: CandidatePlatformRow): PDF {
    // Use PDF library to create official FEC form
    // Pre-fill with candidate data
    return filledForm
  }
  
  // Submit to FEC web portal (if API becomes available)
  // Or guide user through official process
  async submitToFEC(candidate: CandidatePlatformRow): Promise<string> {
    // Current: Generate forms and guide user
    // Future: Direct API submission if available
  }
}
```

---

### **Approach 3: State-by-State Integration** ⭐⭐⭐
**Best for: Comprehensive Coverage**

#### **States with Online Filing:**
1. **California** - Cal-Access System
   - Public API available
   - Electronic filing supported
   - Can integrate with official system

2. **Texas** - TRACE System
   - Online filing portal
   - Potential API access

3. **Florida** - Division of Elections
   - Online filing system
   - Public candidate database

4. **New York** - NYS Board of Elections
   - Limited online options
   - Mostly paper-based

#### **Implementation Strategy:**
```typescript
// State-specific filing adapters
interface StateFilingAdapter {
  state: string
  submitFiling(data: CandidateFilingData): Promise<FilingResult>
  verifyFiling(filingId: string): Promise<boolean>
  getRequirements(office: string): FilingRequirements
}

class CaliforniaFilingAdapter implements StateFilingAdapter {
  state = 'CA'
  
  async submitFiling(data: CandidateFilingData) {
    // Integrate with Cal-Access API
    // Handle authentication, forms, payments
  }
}

// Registry of adapters
const filingAdapters = new Map<string, StateFilingAdapter>([
  ['CA', new CaliforniaFilingAdapter()],
  ['TX', new TexasFilingAdapter()],
  ['FL', new FloridaFilingAdapter()],
  // ... add more as integrations are built
])
```

---

### **Approach 4: Form Generation & Submission Service** ⭐⭐⭐⭐
**Best for: Open Source Community Project**

#### **Concept:**
1. **Generate official forms** from our data
2. **Pre-fill** all available fields
3. **Guide users** through submission process
4. **Track status** via official APIs
5. **Verify** filing completion

#### **Benefits:**
- ✅ No direct filing liability
- ✅ Still provides massive value
- ✅ Works for all jurisdictions
- ✅ Community can contribute form templates

#### **Implementation:**
```typescript
// Form Generator Service
class FilingFormGenerator {
  // Generate jurisdiction-specific forms
  async generateForm(
    jurisdiction: string,
    candidate: CandidatePlatformRow
  ): Promise<FilledForm> {
    const template = await this.getFormTemplate(jurisdiction)
    return this.fillTemplate(template, candidate)
  }
  
  // Get submission instructions
  getSubmissionInstructions(jurisdiction: string): SubmissionGuide {
    return {
      method: 'online' | 'mail' | 'in-person',
      address: string,
      deadline: Date,
      fees: number,
      requiredDocuments: string[]
    }
  }
}

// Example: Generate FEC Form 2 PDF
const form2 = await formGenerator.generateForm('FEC', candidatePlatform)
// Returns: Pre-filled PDF ready for signature and submission
```

---

## 🛠️ Recommended Implementation Roadmap

### **Phase 1: Foundation (Months 1-2)** ✅ COMPLETE
- [x] Database schema for filing information
- [x] Document upload system
- [x] Filing status tracking
- [x] UI for filing information collection

### **Phase 2: Verification Integration (Months 3-4)**
- [ ] **FEC API Integration**
  - Verify candidate filings via FEC API
  - Auto-check filing status
  - Display official candidate information
- [ ] **State API Integrations (Top 5 States)**
  - California Cal-Access
  - Texas TRACE
  - Florida Division of Elections
  - New York Board of Elections
  - Illinois State Board of Elections

### **Phase 3: Form Generation (Months 5-6)**
- [ ] **PDF Form Generator**
  - FEC Form 2 (Statement of Candidacy)
  - FEC Form 1 (Statement of Organization)
  - State-specific forms (top 10 states)
- [ ] **Form Templates**
  - Community-contributed templates
  - Version control for form changes
  - Multi-language support

### **Phase 4: Submission Guidance (Months 7-8)**
- [ ] **Submission Wizard**
  - Step-by-step submission guide
  - Jurisdiction-specific instructions
  - Deadline tracking and reminders
  - Fee calculation and payment links
- [ ] **E-Signature Integration**
  - DocuSign API integration (optional)
  - Simple PDF signing
  - Signature verification

### **Phase 5: Direct Integration (Months 9-12)**
- [ ] **FEC eFiling Integration** (if API available)
- [ ] **State eFiling Integrations**
  - California Cal-Access API
  - Texas TRACE API
  - Other states as APIs become available
- [ ] **Payment Processing**
  - Stripe integration for filing fees
  - Fee calculation by jurisdiction

---

## 🤝 Open Source Community Approach

### **How Community Can Help:**

#### **1. Form Templates** 📄
- Community members can contribute form templates
- Version-controlled in repository
- Jurisdiction-specific folders
- Regular updates as forms change

```markdown
forms/
├── federal/
│   ├── fec-form-1.md (template)
│   └── fec-form-2.md (template)
├── california/
│   └── statement-of-candidacy.md
├── texas/
│   └── candidate-filing-form.md
└── ...
```

#### **2. State Adapters** 🔌
- Contributors can build state-specific filing adapters
- Standard interface for all adapters
- Documented API requirements
- Testing framework

#### **3. Filing Requirements Database** 📊
- Community-maintained database of:
  - Filing deadlines by jurisdiction
  - Filing fees
  - Required documents
  - Submission methods
  - Contact information

#### **4. Legal Review** ⚖️
- Legal volunteers can:
  - Review compliance requirements
  - Ensure disclaimers are accurate
  - Update jurisdiction-specific rules
  - Provide filing guidance

---

## ⚖️ Legal Considerations

### **Liability Protection:**
1. **Clear Disclaimers**
   - Platform is a tool, not official filing authority
   - Users responsible for verifying requirements
   - No guarantee of successful filing

2. **Partnership Model**
   - Partner with official services where possible
   - Reduce direct liability
   - Leverage existing compliance

3. **Open Source Benefits**
   - Community review of code
   - Transparent process
   - No proprietary filing service

### **Required Disclaimers:**
```typescript
const LEGAL_DISCLAIMERS = {
  filing: `
    This platform provides tools to assist with candidate filing but does not
    constitute official filing with election authorities. Candidates are
    responsible for:
    - Verifying all filing requirements with official authorities
    - Submitting forms to correct offices
    - Meeting all deadlines and requirements
    - Paying all required fees
  `,
  verification: `
    Filing verification is provided for informational purposes only.
    Official filing status should be confirmed directly with election
    authorities.
  `,
  liability: `
    This platform and its contributors are not responsible for:
    - Filing errors or omissions
    - Missed deadlines
    - Rejected filings
    - Legal consequences of filing errors
  `
}
```

---

## 🚀 Quick Wins (Can Start Now)

### **1. FEC Verification API** ⭐⭐⭐⭐⭐
```typescript
// Already possible - FEC has public API
async function verifyFECCandidate(fecId: string) {
  const apiKey = process.env.FEC_API_KEY
  const response = await fetch(
    `https://api.open.fec.gov/v1/candidates/?candidate_id=${fecId}&api_key=${apiKey}`
  )
  return response.json()
}
```
**Impact:** High - Verify federal candidates immediately  
**Effort:** Low - API already exists

### **2. Form Pre-filling** ⭐⭐⭐⭐
```typescript
// Generate pre-filled FEC forms
async function generateFECForm2(candidate: CandidatePlatformRow) {
  // Use PDF library to create FEC Form 2
  // Pre-fill with candidate data
  // Return downloadable PDF
}
```
**Impact:** Medium - Makes filing easier  
**Effort:** Medium - Need form templates

### **3. Filing Guide Generator** ⭐⭐⭐⭐⭐
```typescript
// Generate jurisdiction-specific filing guides
function getFilingGuide(state: string, office: string) {
  return {
    authority: getElectionAuthority(state, office),
    deadline: getFilingDeadline(state, office),
    fees: getFilingFees(state, office),
    forms: getRequiredForms(state, office),
    instructions: getSubmissionInstructions(state, office)
  }
}
```
**Impact:** High - Huge value for users  
**Effort:** Low - Database-driven

---

## 📊 Success Metrics

### **Short Term (6 months):**
- [ ] FEC verification for all federal candidates
- [ ] Form generation for top 5 states
- [ ] Filing guides for all 50 states
- [ ] 100+ candidates use platform for filing prep

### **Medium Term (12 months):**
- [ ] Direct API integration with 3+ states
- [ ] Automated verification for federal + 10 states
- [ ] 1,000+ candidates use platform
- [ ] Community contributes 20+ form templates

### **Long Term (24 months):**
- [ ] Official filing capability for federal + 20+ states
- [ ] E-signature integration
- [ ] Payment processing for filing fees
- [ ] 10,000+ candidates filed through platform

---

## 🎯 Recommended Next Steps

### **Immediate (This Week):**
1. **Add FEC API Integration**
   - Verify candidate filings
   - Display official FEC data
   - Auto-update filing status

2. **Create Filing Guide Database**
   - State-by-state requirements
   - Deadlines and fees
   - Submission instructions

### **Short Term (This Month):**
3. **Form Generation Service**
   - PDF generation library
   - FEC Form 2 template
   - Pre-fill from candidate data

4. **Partnership Outreach**
   - Contact Democracy Works
   - Contact Vote.org
   - Explore partnership opportunities

### **Medium Term (Next Quarter):**
5. **State API Integrations**
   - California Cal-Access
   - Texas TRACE
   - Florida Division of Elections

6. **Community Infrastructure**
   - Form template repository
   - Contributor guidelines
   - Testing framework

---

## 💡 Key Insight

**We don't need to build everything ourselves!**

As an open source project, we can:
- ✅ **Integrate** with existing services
- ✅ **Verify** using public APIs
- ✅ **Guide** users through official processes
- ✅ **Generate** pre-filled forms
- ✅ **Track** filing status automatically
- ✅ **Build community** of contributors

Even without direct submission APIs, we can provide **immense value** by making the filing process:
- **Easier** (pre-filled forms, clear instructions)
- **Faster** (automated verification, deadline tracking)
- **More accessible** (unified interface for all jurisdictions)
- **Transparent** (real-time status, official verification)

---

**Last Updated:** January 30, 2025  
**Next Review:** February 30, 2025

