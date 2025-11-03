# Open Source Official Filing Strategy

**Created:** January 30, 2025  
**Status:** 🚀 **ACTIVE DEVELOPMENT**  
**Vision:** Make Choices the easiest way to officially file for candidacy

---

## 🎯 The Vision

**Enable users to officially file for candidacy directly through the Choices platform** - making it as easy as declaring candidacy, building a platform, and clicking "File Officially."

---

## ✅ What We Can Do NOW (Immediate Value)

### **1. FEC Verification Integration** ✅ IMPLEMENTED

**What it does:**
- Verify candidates against official FEC database
- Check if they're active for current election cycle
- Auto-update filing status when verified

**Implementation:**
- ✅ FEC API client created (`web/lib/integrations/fec.ts`)
- ✅ Verification endpoint created (`/api/candidate/verify-fec`)
- ✅ Can verify federal candidates instantly

**Next Steps:**
1. Add FEC verification button to candidate dashboard
2. Auto-verify when FEC ID is entered
3. Display official FEC candidate information

### **2. Filing Status Dashboard** ✅ IMPLEMENTED

**What it does:**
- Track filing status (not_filed, filed, pending_verification, verified)
- Show filing deadlines with warnings
- Display official filing information
- Link to filing documents

**Already Built:**
- ✅ Filing status display on dashboard
- ✅ Deadline tracking and warnings
- ✅ Document upload and storage

### **3. Form Generation Service** 📋 NEXT UP

**What we'll build:**
- Generate official FEC forms (Form 2, Form 1) pre-filled with candidate data
- Create downloadable PDFs ready for signature
- Guide users through official filing process

**Why this is huge:**
Even without direct API submission, pre-filled forms save candidates **hours** of work and reduce errors.

---

## 🚀 Path to Official Filing

### **Phase 1: Verification & Guidance** (Current - 3 months)
**Goal:** Verify filings and guide users to official processes

**Features:**
- ✅ FEC API verification
- ✅ Filing status tracking
- 📋 Form pre-filling (FEC Form 2, Form 1)
- 📋 Submission guides by jurisdiction
- 📋 Deadline tracking and reminders

**Value:** Candidates save time, reduce errors, get verified status

---

### **Phase 2: Direct Integration** (Months 4-12)
**Goal:** Enable direct submission where APIs exist

#### **Federal (FEC)**
- **Current:** FEC has public API for lookups, but **no filing API**
- **Workaround:** Generate forms → Guide to FEC eFiling portal → Verify via API
- **Future:** If FEC releases filing API, we integrate immediately

#### **State-by-State**
**Priority States (by population + API availability):**

1. **California** ⭐⭐⭐⭐⭐
   - Cal-Access system has API
   - Online filing supported
   - High candidate volume
   - **Impact:** ~40M people, huge candidate pool

2. **Texas** ⭐⭐⭐⭐
   - TRACE system
   - Online filing available
   - **Impact:** ~30M people

3. **Florida** ⭐⭐⭐⭐
   - Division of Elections online system
   - **Impact:** ~22M people

4. **New York** ⭐⭐⭐
   - Limited online options
   - Mostly paper-based
   - **Impact:** ~20M people

**Strategy:** Build adapters state-by-state as APIs become available

---

### **Phase 3: Partnership** (Months 6-12)
**Goal:** Partner with existing filing services

**Potential Partners:**
1. **Democracy Works / TurboVote**
   - Already handles voter registration
   - Could expand to candidate filing
   - Open to partnerships

2. **Ballotpedia**
   - Candidate database
   - Filing information
   - Possible data partnership

3. **Vote.org**
   - Voter-focused but mission-aligned
   - Could partner for candidate services

**Benefits:**
- Leverage existing infrastructure
- Reduce legal liability
- Faster implementation
- Built-in compliance

---

## 🤝 How Open Source Helps

### **1. Community Contributions**

**Form Templates:**
```markdown
forms/
├── federal/
│   ├── fec-form-1-template.md
│   └── fec-form-2-template.md
├── california/
│   └── statement-of-candidacy.md
└── community-contributed/
    └── ...
```

**Community members can:**
- Contribute form templates for their state
- Build state-specific adapters
- Maintain filing requirements database
- Review and test integrations

### **2. Legal Review**

**Open source benefits:**
- Transparent code (everyone can review)
- Community legal experts can contribute
- Faster compliance updates
- No proprietary lock-in

### **3. Testing & Verification**

**Community can:**
- Test filing processes in different states
- Verify API integrations
- Report issues and edge cases
- Contribute test cases

---

## 🛠️ Implementation Roadmap

### **Immediate (This Week)**
1. ✅ **FEC Verification** - Implemented
2. 📋 **Add FEC verification button** to dashboard
3. 📋 **Auto-verify on FEC ID entry**

### **Short Term (This Month)**
4. 📋 **Form Generator Service**
   - FEC Form 2 PDF generation
   - Pre-fill from candidate data
   - Downloadable ready-to-sign forms

5. 📋 **Filing Guide Generator**
   - Jurisdiction-specific instructions
   - Deadline calculator
   - Fee lookup

### **Medium Term (Next 3 Months)**
6. 📋 **California Integration**
   - Cal-Access API integration
   - Direct filing for CA candidates

7. 📋 **State Adapter Framework**
   - Standard interface for all states
   - Easy to add new states
   - Community-contributed adapters

### **Long Term (6-12 Months)**
8. 📋 **Partnership Integration**
   - Democracy Works / TurboVote
   - Unified filing service

9. 📋 **Payment Processing**
   - Stripe integration for filing fees
   - Automatic fee calculation

---

## 💡 Key Insight

**We don't need to build everything to provide massive value!**

Even without direct submission APIs, we can:
- ✅ **Verify** filings instantly (FEC API)
- ✅ **Generate** pre-filled forms (saves hours)
- ✅ **Guide** users through processes (reduces errors)
- ✅ **Track** filing status automatically (keeps candidates informed)
- ✅ **Remind** about deadlines (prevents missed filings)

This alone makes Choices **the easiest way to prepare for candidacy filing**.

---

## 🎯 Success Metrics

**6 Months:**
- 100+ candidates verified via FEC API
- Form generator used by 50+ candidates
- Filing guides for all 50 states

**12 Months:**
- Direct filing for federal + 3 states
- 1,000+ candidates filed through platform
- Community contributed 10+ state adapters

**24 Months:**
- Official filing available in 20+ states
- 10,000+ candidates filed
- Platform recognized as official filing tool

---

## 🔐 Legal Safeguards

**Always maintain:**
1. Clear disclaimers (platform is a tool, not authority)
2. User responsibility (they verify requirements)
3. Official verification (link to official sources)
4. No liability for filing errors

**Open source advantage:**
- Transparent code reduces liability concerns
- Community review catches issues
- No proprietary service to maintain

---

## 🚀 Let's Start NOW

**Next steps you can take today:**

1. **Set FEC API Key:**
   ```bash
   # Get free API key from: https://api.open.fec.gov/developers/
   echo "FEC_API_KEY=your_key_here" >> .env.local
   ```

2. **Test FEC Verification:**
   ```bash
   curl "http://localhost:3000/api/candidate/verify-fec?fecId=H8CA15018"
   ```

3. **Add verification button to dashboard:**
   - See `web/app/(app)/candidate/dashboard/page.tsx`
   - Add "Verify with FEC" button
   - Calls `/api/candidate/verify-fec`

4. **Contribute form templates:**
   - Create `web/forms/federal/fec-form-2-template.md`
   - Help candidates generate official forms

---

**The future is open source, transparent, and accessible to all candidates.** 🚀

---

**Last Updated:** January 30, 2025

