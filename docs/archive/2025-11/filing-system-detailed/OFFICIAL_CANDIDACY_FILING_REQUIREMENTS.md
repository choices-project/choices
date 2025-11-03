# Official Candidacy Filing Requirements

**Created:** January 30, 2025  
**Status:** 📋 **IMPLEMENTATION GUIDE**

---

## ⚠️ Important Legal Note

**The current system allows users to build candidate platforms, but does NOT yet fully facilitate official legal candidacy filing.** To be legally recognized as a candidate, users must file with the appropriate election authority (FEC, Secretary of State, local board of elections, etc.).

This document outlines what's needed to make the platform fully compliant with official candidacy declaration requirements.

---

## 🎯 Current Status

### ✅ What We Have
- User can declare intent to run for office
- Platform building functionality
- Basic verification flag (`verified: boolean`)
- Verification system exists (`CandidateVerificationSystem`) but not fully integrated

### ❌ What's Missing for Official Filing
- **Official filing ID/receipt tracking** - No way to store FEC ID, Secretary of State filing number, etc.
- **Filing date tracking** - No record of when official filing occurred
- **Proof of filing upload** - No document upload for filing receipts/confirmations
- **Filing deadline tracking** - No reminders or tracking of filing deadlines
- **Election authority integration** - No connection to FEC, state, or local filing systems
- **Ballot access confirmation** - No tracking of whether candidate is on official ballot

---

## 📋 Legal Requirements by Jurisdiction

### **Federal Offices (U.S. House, Senate, President)**
- **Filing Authority:** Federal Election Commission (FEC)
- **Required:** Statement of Candidacy (Form 2), Statement of Organization (Form 1)
- **FEC ID:** Unique identifier assigned upon filing
- **Deadline:** Typically 15 days after raising/spending $5,000
- **Verification:** Can verify via FEC.gov API or filing documents

### **State Offices (Governor, State Legislature, etc.)**
- **Filing Authority:** State Secretary of State or Elections Division
- **Required:** Statement of Candidacy, filing fees, signature requirements
- **Filing Number:** Unique ID from state election authority
- **Deadline:** Varies by state (typically 60-90 days before primary)
- **Verification:** Can verify via state election website or filing documents

### **Local Offices (City Council, Mayor, School Board, etc.)**
- **Filing Authority:** Local Board of Elections or City Clerk
- **Required:** Statement of Candidacy, filing fees, residency requirements
- **Filing Number:** Unique ID from local authority
- **Deadline:** Varies by locality (typically 30-60 days before election)
- **Verification:** Can verify via local election website or filing documents

---

## 🔧 Implementation Requirements

### **1. Database Schema Updates** ✅ DONE
See migration: `web/database/migrations/20250130_add_official_filing_fields.sql`

New fields added:
- `official_filing_id` - FEC ID, state filing number, etc.
- `official_filing_date` - Date of official filing
- `filing_jurisdiction` - Election authority (FEC, CA Secretary of State, etc.)
- `filing_document_url` - Uploaded proof of filing
- `filing_status` - not_filed, filed, pending_verification, verified, rejected
- `filing_deadline` - Deadline for filing
- `election_date` - Date of the election
- `ballot_access_confirmed` - Whether on official ballot
- `verification_method` - How verification was done
- `verified_at` - When verified
- `verified_by` - Admin who verified

### **2. UI Updates Needed**

#### **Declaration Wizard - Add "Official Filing" Step**
After platform builder, add step:
- Upload filing document/receipt
- Enter official filing ID
- Enter filing date
- Select filing jurisdiction
- Enter election date
- Enter filing deadline (if known)

#### **Filing Status Display**
- Show filing status on candidate dashboard
- Warn if filing deadline approaching
- Show verification status
- Link to filing authority website

#### **Admin Verification Interface**
- Review uploaded filing documents
- Verify against election authority APIs
- Mark as verified/rejected
- Add verification notes

### **3. API Integration**

#### **FEC API Integration** (Federal Offices)
```typescript
// Verify FEC filing
async function verifyFECFiling(fecId: string): Promise<boolean> {
  // Query FEC API: https://api.open.fec.gov/developers/
  const response = await fetch(`https://api.open.fec.gov/v1/candidates/?candidate_id=${fecId}`);
  return response.ok && (await response.json()).results.length > 0;
}
```

#### **State Election Authority APIs** (State Offices)
- Each state has different API/website structure
- Need to build state-specific verification
- Examples:
  - California: Secretary of State website scraping/API
  - New York: NYS Board of Elections API
  - Texas: Secretary of State API

#### **Manual Verification Fallback**
- Admin reviews uploaded documents
- Checks filing authority website manually
- Marks as verified after confirmation

### **4. Filing Deadline Tracking**

#### **Deadline Reminders**
- Email candidates X days before filing deadline
- Show countdown on candidate dashboard
- Warn if deadline passed without filing

#### **Deadline Database**
- Store standard filing deadlines by office/jurisdiction
- Update annually or as laws change
- Allow manual override for special elections

### **5. Document Upload**

#### **File Storage**
- Upload filing receipts/documents to secure storage
- Store URLs in `filing_document_url` field
- Support PDF, JPG, PNG formats
- Max file size: 10MB

#### **Document Validation**
- Check file type
- Verify file isn't corrupted
- Extract metadata (upload date, file size)

---

## 🚀 Implementation Roadmap

### **Phase 1: Database & Types** ✅ COMPLETE
- [x] Add official filing fields to database
- [x] Update TypeScript types
- [x] Create migration

### **Phase 2: UI Updates** 🔄 IN PROGRESS
- [ ] Add "Official Filing" step to declaration wizard
- [ ] Add file upload component for filing documents
- [ ] Update candidate dashboard to show filing status
- [ ] Add filing deadline warnings
- [ ] Create admin verification interface

### **Phase 3: Verification Integration** 📋 PLANNED
- [ ] Integrate FEC API for federal offices
- [ ] Build state-specific verification (start with top 5 states)
- [ ] Implement manual verification workflow
- [ ] Connect to existing `CandidateVerificationSystem`

### **Phase 4: Deadline Tracking** 📋 PLANNED
- [ ] Build filing deadline database/reference
- [ ] Create deadline reminder system
- [ ] Add deadline countdown to UI
- [ ] Email notifications

### **Phase 5: Legal Compliance Review** 📋 PLANNED
- [ ] Legal review of verification process
- [ ] Ensure compliance with election laws
- [ ] Add disclaimers (platform is not official filing authority)
- [ ] Document verification methodology

---

## ⚖️ Legal Disclaimers Required

The platform must include clear disclaimers:

1. **"This platform does not constitute official candidacy filing. Candidates must file with the appropriate election authority (FEC, Secretary of State, etc.) to be legally recognized."**

2. **"Verification on this platform does not guarantee ballot access. Ballot access is determined by the official election authority."**

3. **"Filing requirements and deadlines vary by jurisdiction. Candidates are responsible for knowing and meeting all legal requirements."**

---

## 📝 Example User Flow (After Implementation)

1. User declares intent to run for office
2. Builds platform (positions, experience, etc.)
3. **NEW:** Uploads official filing receipt/document
4. **NEW:** Enters official filing ID and date
5. **NEW:** System verifies filing (via API or manual review)
6. **NEW:** Admin verifies and marks as "verified"
7. Platform appears in alternative candidates display
8. **NEW:** System tracks filing deadline and sends reminders
9. **NEW:** Candidate dashboard shows filing status and ballot access

---

## 🔗 Resources

### **Federal**
- FEC: https://www.fec.gov/
- FEC API: https://api.open.fec.gov/developers/

### **State (Examples)**
- California: https://www.sos.ca.gov/elections/
- New York: https://www.elections.ny.gov/
- Texas: https://www.sos.texas.gov/elections/

### **Legal Research**
- National Conference of State Legislatures (NCSL): Candidate filing requirements by state
- Ballotpedia: Election filing deadlines and requirements

---

## ✅ Success Criteria

The system will be fully compliant when:
- [ ] Users can upload official filing documents
- [ ] Official filing information is stored and verified
- [ ] System can verify filings via election authority APIs
- [ ] Filing deadlines are tracked and candidates are notified
- [ ] Clear disclaimers explain legal requirements
- [ ] Admin interface allows manual verification
- [ ] Candidates can see their filing status and verification

---

**Last Updated:** January 30, 2025

