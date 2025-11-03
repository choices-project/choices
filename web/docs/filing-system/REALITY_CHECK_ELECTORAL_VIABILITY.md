# Reality Check: What Actually Gets Candidates to the Ballot

**Created:** January 30, 2025  
**Status:** 🔍 **CRITICAL ANALYSIS**

---

## ⚠️ The Hard Question

**Does what we're building actually help users get to the "electorate ability stage" (i.e., being able to actually run for office)?**

**Short Answer:** Partially. We help significantly, but there's a critical gap.

---

## ✅ What ACTUALLY Works & Helps

### **1. Filing Information & Guidance** ✅ **REAL VALUE**
**What it does:**
- Shows exact requirements for their office/jurisdiction
- Provides filing fees, deadlines, forms needed
- Links directly to official filing portals
- Warns about deadlines

**Impact:**
- ✅ Saves hours of research
- ✅ Prevents missing deadlines (critical!)
- ✅ Reduces filing errors
- ✅ **Directly helps them file correctly**

**Status:** Fully functional and integrated

---

### **2. FEC Verification** ✅ **REAL VALUE**
**What it does:**
- Verifies federal candidates against official FEC database
- Updates filing status automatically
- Confirms candidate is in official system

**Impact:**
- ✅ Provides credibility (they're real, official candidates)
- ✅ Auto-updates their status
- ✅ Links their platform to official record

**Status:** Working (tested successfully)

---

### **3. Platform Building** ✅ **REAL VALUE**
**What it does:**
- Lets candidates build their platform in-app
- Stores positions, experience, contact info
- Professional presentation

**Impact:**
- ✅ Gives them a platform without technical skills
- ✅ Makes them look professional
- ✅ Centralizes their information

**Status:** Fully functional

---

## ❌ The Critical Gap

### **Appearing in "Alternative Candidates"**

**What's Required:**
Looking at `/api/civics/representative/[id]/alternatives/route.ts:81`:
```typescript
.eq('status', 'active')
.eq('verified', true)  // Only show verified platforms
```

**The Problem:**
There are TWO verification systems:
1. **`filing_status`** - Official filing status (updated by FEC verification)
2. **`verified`** (boolean) - Admin verification flag (defaults to `false`)

**Current Flow:**
1. ✅ User declares candidacy → Platform created (`verified = false`)
2. ✅ User files officially → External process
3. ✅ User verifies with FEC → `filing_status` updated to `verified`
4. ❌ **Platform still `verified = false`** → Admin must manually verify
5. ❌ **Doesn't appear in Alternative Candidates** until admin sets `verified = true`

**The Gap:**
- FEC verification confirms they're official candidates
- But they still need manual admin approval to appear publicly
- **This is a barrier to democratic participation**

---

## 🔧 What Needs to Happen

### **Option 1: Auto-Verify on FEC Verification** ⭐ **RECOMMENDED**
**Logic:**
- If FEC verification succeeds AND `filing_status = 'verified'`
- Automatically set `verified = true`
- Platform appears immediately

**Rationale:**
- FEC is official government verification
- If FEC says they're a candidate, they're a candidate
- No need for additional admin gatekeeping

**Implementation:**
```typescript
// In verify-fec route, after FEC verification succeeds:
await supabase
  .from('candidate_platforms')
  .update({ 
    filing_status: 'verified',
    verified: true,  // Auto-verify if FEC confirms
    verified_at: new Date().toISOString()
  })
  .eq('id', platformId)
```

**Impact:**
- ✅ Removes barrier
- ✅ Candidates appear immediately after FEC verification
- ✅ Democratic participation enabled

---

### **Option 2: Different Verification Levels**
**Logic:**
- `filing_status = 'verified'` → Verified by official source (FEC, etc.)
- `verified = true` → Admin-verified (optional additional check)

**For public display:**
- Show candidates where `filing_status IN ('filed', 'verified')` OR `verified = true`
- Prioritize officially verified candidates

**Impact:**
- ✅ Shows officially verified candidates immediately
- ✅ Allows additional admin verification for extra credibility
- ✅ More inclusive

---

## 📊 What Actually Gets Them to the Ballot

### **The Real Path to Electoral Viability:**

1. **Understanding Requirements** ✅ We help
   - Filing requirements lookup
   - Deadline warnings
   - Form guidance

2. **Gathering Documents** ✅ We help
   - Checklist
   - Requirements breakdown

3. **Filing Officially** ⚠️ We guide, but they must do it
   - Links to official portals
   - Step-by-step instructions
   - **We don't file for them (no APIs exist)**

4. **Getting Verified** ✅ We help (with gap)
   - FEC verification works
   - **But need to auto-verify to appear publicly**

5. **Appearing as Alternative Candidate** ❌ Currently blocked
   - Need `verified = true`
   - **Currently requires admin action**

6. **Building Campaign** ✅ We help
   - Platform building
   - Professional presentation
   - Contact information

---

## 🎯 The Missing Piece

**To actually help them get to electoral viability, we need:**

1. **Auto-verification on official verification** ⭐ **CRITICAL**
   - When FEC verifies → `verified = true` automatically
   - Or change API to show `filing_status = 'verified'` candidates

2. **Petition signature tracking** (if required)
   - Track signature collection
   - Validate signatures
   - Submit petitions

3. **Ballot access confirmation** (where available)
   - Track ballot qualification status
   - Confirm they're on the ballot
   - Display ballot status

4. **Campaign finance compliance** (federal)
   - Track filing deadlines
   - Remind about reports
   - Link to FEC reporting

---

## ✅ What We Should Do RIGHT NOW

### **Immediate Fix: Auto-Verify on FEC Verification**

**File:** `web/app/api/candidate/verify-fec/route.ts`

**Change:**
```typescript
// After FEC verification succeeds:
await supabase
  .from('candidate_platforms')
  .update({
    filing_status: 'verified',
    verified: true,  // AUTO-VERIFY - FEC confirmation is sufficient
    verified_at: new Date().toISOString(),
    official_filing_id: fecId,
    // ... other FEC data
  })
```

**Impact:**
- ✅ Candidates appear immediately after FEC verification
- ✅ No admin bottleneck
- ✅ Real democratic participation enabled

---

## 📊 Value Assessment

### **High Value (Actually Helps):**
1. ✅ Filing requirements lookup
2. ✅ Deadline warnings
3. ✅ Official filing links
4. ✅ FEC verification
5. ✅ Platform building

### **Medium Value (Helps but Limited):**
1. ⚠️ Filing checklist (useful but not critical)
2. ⚠️ Filing guide wizard (helpful but redundant with assistant)

### **Low Value (Nice to Have):**
1. 📋 Form generation (not yet implemented)
2. 📋 Video tutorials (not yet implemented)

---

## 🎯 Recommendation

**DO THIS NOW:**
1. **Auto-verify on FEC verification** - Removes barrier to appearing publicly
2. **Keep filing assistance** - Actually helps them file correctly
3. **Track what's working** - Measure how many candidates complete filing

**DEFER:**
1. Form generation - Can add later
2. Video tutorials - Can add later
3. Extra features - Focus on core value

**FOCUS:**
- Make sure candidates can actually appear after filing
- Make sure filing guidance is accurate and actionable
- Measure success: How many candidates file successfully?

---

## ✅ Bottom Line

**Are we helping them get to electoral viability?**

**YES, BUT:**
- ✅ Filing guidance = Real value
- ✅ FEC verification = Real value
- ❌ Appearing publicly = Currently blocked by admin verification
- ⚠️ Actually filing = They must do it (no APIs exist)

**To maximize value:**
1. Fix the verification gap (auto-verify on FEC confirmation)
2. Keep focusing on actionable guidance
3. Measure real outcomes (filing success rate)

**We're not feature bloating - we're solving real problems. But we need to fix the verification bottleneck to actually enable democratic participation.**

---

**Last Updated:** January 30, 2025

