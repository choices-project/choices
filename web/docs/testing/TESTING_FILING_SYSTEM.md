# Testing the Filing Assistance System

**Created:** January 30, 2025  
**Status:** 🧪 **TESTING GUIDE**

---

## 🎯 Testing Checklist

Use this checklist to test the complete filing assistance system end-to-end.

---

## ✅ Pre-Testing Setup

### **1. Verify Environment**
- [ ] Development server running (`npm run dev`)
- [ ] Database migrations applied
- [ ] FEC API key configured in `.env.local`
- [ ] User account created and logged in

### **2. Verify Features Enabled**
- [ ] `ALTERNATIVE_CANDIDATES` feature flag enabled
- [ ] `CANDIDATE_ACCOUNTABILITY` feature flag enabled
- [ ] Candidate platform system accessible

---

## 🧪 Test Scenario: Full Candidate Journey

### **Test 1: Office Selection & Filing Assistant**

**Steps:**
1. Navigate to `/candidate/declare`
2. Select office, level, state
3. **Expected:** Filing Assistant appears automatically showing requirements

**What to Check:**
- [ ] Filing Assistant component loads
- [ ] Shows correct office/state requirements
- [ ] Displays filing fees (if applicable)
- [ ] Shows deadlines
- [ ] Lists required forms
- [ ] Provides links to official portals

**Known Offices to Test:**
- [ ] **Federal:** "U.S. House of Representatives" (should show $0 fee, FEC info)
- [ ] **State:** "Governor" in California (should show $3,624 fee, Cal-Access)
- [ ] **State:** "Governor" in Texas (should show $3,750 fee, in-person filing)
- [ ] **Local:** "Mayor" (should show generic template)

---

### **Test 2: Filing Guide Wizard**

**Steps:**
1. While on declaration page, find Filing Guide Wizard (or navigate to it)
2. Go through all 4 steps
3. Use "Save Progress" button
4. Refresh page
5. **Expected:** Progress saved, can resume

**What to Check:**
- [ ] Wizard loads with correct office/state
- [ ] Step 1 shows actual eligibility requirements
- [ ] Step 1 shows actual filing fees
- [ ] Step 1 shows required forms
- [ ] Step 3 shows "File Online Now" button (if portal available)
- [ ] Step 3 shows official authority contact info
- [ ] Save progress works
- [ ] Progress persists after page refresh
- [ ] Can navigate between completed steps

**Test Progress Persistence:**
- [ ] Complete step 1, save, refresh → step 1 marked complete
- [ ] Complete step 2, save, refresh → steps 1-2 marked complete
- [ ] Close browser, reopen → progress still saved

---

### **Test 3: Complete Declaration Wizard**

**Steps:**
1. Complete all 6 steps of declaration wizard
2. Submit candidacy
3. **Expected:** Platform created, redirected to dashboard

**What to Check:**
- [ ] Step 1: Office selection works
- [ ] Filing Assistant appears in Step 1
- [ ] Filing Assistant appears in Step 5 (Official Filing)
- [ ] Can upload filing document
- [ ] Can enter official filing ID
- [ ] Submission succeeds
- [ ] Redirected to dashboard

---

### **Test 4: Candidate Dashboard**

**Steps:**
1. Navigate to `/candidate/dashboard`
2. View your platform
3. **Expected:** See filing status, verification options

**What to Check:**
- [ ] Platform details display correctly
- [ ] Filing status shows (not_filed initially)
- [ ] "Verify with FEC" button visible (if federal office)
- [ ] Official filing section displays
- [ ] Filing deadline warnings appear (if deadline set)

---

### **Test 5: FEC Verification (Federal Offices Only)**

**Steps:**
1. Enter a real or test FEC ID
2. Click "Verify with FEC"
3. **Expected:** Verification succeeds, status updates

**What to Check:**
- [ ] Verification API call succeeds
- [ ] Status updates to "verified"
- [ ] `verified = true` set automatically
- [ ] Platform appears in Alternative Candidates

**Test FEC IDs (Historical/Test):**
- Use a known FEC candidate ID from past elections
- Or test with invalid ID to verify error handling

---

### **Test 6: Alternative Candidates Display**

**Steps:**
1. Navigate to `/civics` page
2. Find a representative for the office you filed for
3. Click "Alternative Candidates" section
4. **Expected:** Your platform appears if verified

**What to Check:**
- [ ] Alternative candidates section loads
- [ ] Real candidates fetched from API
- [ ] Your platform appears (if `verified = true`)
- [ ] Shows candidate name, party, platform
- [ ] "Run for This Office" button works

---

## 🐛 Known Issues to Watch For

### **Office Matching**
- **Issue:** Office name variations might not match
- **Test:** Try "US House" vs "U.S. House of Representatives"
- **Expected:** Should match via fuzzy matching

### **State Requirements**
- **Issue:** Requirements might not exist for all states
- **Test:** Try offices in states not yet added (NY, PA, etc.)
- **Expected:** Should show generic guidance, not error

### **FEC Verification**
- **Issue:** API might fail or timeout
- **Test:** With invalid/old FEC ID
- **Expected:** Graceful error message, doesn't crash

---

## 📊 Success Criteria

### **Minimum Viable Test:**
✅ Declaration wizard completes successfully  
✅ Filing Assistant shows requirements  
✅ FEC verification works (if federal)  
✅ Platform appears in Alternative Candidates (if verified)

### **Full Success:**
✅ All filing requirements accurate  
✅ Progress tracking works  
✅ All links functional  
✅ Error handling graceful  
✅ Mobile responsive  
✅ Performance acceptable

---

## 🔍 What to Log During Testing

**Document:**
1. **Offices tested** - Which offices/states you tried
2. **Requirements accuracy** - Are fees/deadlines correct?
3. **Links functional** - Do all external links work?
4. **Errors encountered** - Any crashes or issues?
5. **User experience** - Is it intuitive? Any confusion?
6. **Performance** - Any slow loading?
7. **Mobile experience** - Test on phone if possible

---

## 🚀 Quick Test Sequence

**Fastest way to test everything:**

1. **Declare Candidacy** (5 min)
   - Go to `/candidate/declare`
   - Select "U.S. House of Representatives", "Federal", "CA"
   - Complete all steps, submit

2. **Check Filing Assistant** (2 min)
   - Verify it shows $0 fee, FEC info
   - Check all links work

3. **Test Guide Wizard** (3 min)
   - Go through wizard steps
   - Save progress, refresh, verify persistence

4. **FEC Verification** (2 min)
   - On dashboard, enter test FEC ID
   - Click verify, check status updates

5. **Check Alternative Candidates** (2 min)
   - Go to `/civics`
   - Find CA House rep, check alternatives section

**Total time: ~15 minutes**

---

## 📝 Testing Notes Template

```
Test Date: ___________
Tester: ___________

Office Tested: ___________
State: ___________

Requirements Accuracy:
- Fee: [ ] Correct  [ ] Incorrect  [ ] Missing
- Deadline: [ ] Correct  [ ] Incorrect  [ ] Missing
- Forms: [ ] Correct  [ ] Incorrect  [ ] Missing

Issues Found:
1. 
2. 
3. 

Worked Well:
1. 
2. 
3. 

Suggestions:
1. 
2. 
3. 
```

---

**Ready to test! Let's make sure this system actually works for real candidates!** 🎯

---

**Last Updated:** January 30, 2025

