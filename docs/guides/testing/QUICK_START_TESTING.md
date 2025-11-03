# Quick Start: Testing the Filing System

**For:** User Testing as Guinea Pig 🐹  
**Created:** January 30, 2025

---

## 🚀 Quick Setup

### **1. Start Dev Server**
```bash
cd web
npm run dev
```

### **2. Navigate to Candidate Declaration**
- Go to: `http://localhost:3000/candidate/declare`
- OR navigate from Civics page → Find a rep → Click "Run for This Office"

---

## 🎯 Recommended Test Sequence

### **Test 1: Federal Office (Easiest)**
1. **Office:** "U.S. House of Representatives"
2. **Level:** Federal
3. **State:** CA (or your state)
4. **District:** Leave blank or enter your district

**What to Check:**
- ✅ Filing Assistant appears automatically
- ✅ Shows $0 filing fee (federal)
- ✅ Shows FEC filing portal link
- ✅ Shows "15 days after $5,000" deadline info

---

### **Test 2: State Office (CA, TX, FL)**
1. **Office:** "Governor" (or "State Senate", "State Assembly")
2. **Level:** State
3. **State:** CA (for best data coverage)

**What to Check:**
- ✅ Filing Assistant shows real fee (CA Governor = $3,624)
- ✅ Shows Cal-Access portal link
- ✅ Shows 75-day deadline
- ✅ Shows petition signature requirements (65 for Governor)

---

### **Test 3: Filing Guide Wizard**
1. On declaration page, scroll to Filing Guide Wizard section
2. Click through all 4 steps
3. Click "Save Progress"
4. Refresh page

**What to Check:**
- ✅ Step 1 shows actual eligibility requirements
- ✅ Step 3 shows "File Online Now" button (if available)
- ✅ Progress saves and persists after refresh

---

### **Test 4: Complete Declaration**
1. Complete all 6 steps of declaration
2. Submit
3. Check dashboard at `/candidate/dashboard`

**What to Check:**
- ✅ Platform saves successfully
- ✅ Dashboard shows your platform
- ✅ "Verify with FEC" button visible (if federal)

---

### **Test 5: FEC Verification** (Federal Only)
1. Get a real FEC candidate ID (or test with known ID)
2. Enter in dashboard "Official Filing" section
3. Click "Verify with FEC"

**What to Check:**
- ✅ Verification succeeds
- ✅ Status updates to "verified"
- ✅ Platform appears in Alternative Candidates

---

## 📝 What to Report

**Please note:**
1. **What worked well** ✅
2. **What was confusing** ❓
3. **What didn't work** ❌
4. **What's missing** 🔍
5. **Requirements accuracy** - Are fees/deadlines correct?

---

## 🐛 If You Encounter Issues

### **Filing Assistant Not Appearing:**
- Check browser console for errors
- Verify office/state are selected
- Try refreshing page

### **Requirements Not Found:**
- Try exact office name match
- Check state abbreviation is correct (CA, TX, FL)
- Verify office level matches (federal/state/local)

### **FEC Verification Fails:**
- Check FEC API key in `.env.local`
- Verify FEC ID is valid
- Check network tab for API errors

---

## 🎯 Success Metrics

**The test is successful if:**
1. ✅ You can declare candidacy without confusion
2. ✅ Filing requirements are helpful and accurate
3. ✅ You know what to do next (file officially)
4. ✅ Progress tracking works
5. ✅ FEC verification works (if testing federal)

---

## 💡 Testing Tips

1. **Start Simple:** Test federal office first (most complete data)
2. **Check Real Data:** Verify fees/deadlines match actual requirements
3. **Test Persistence:** Close browser, reopen, check progress saved
4. **Try Different Offices:** Test state offices in CA, TX, FL
5. **Mobile Test:** Try on phone if possible

---

**You're all set! Start testing and let me know what you find!** 🚀

---

**Last Updated:** January 30, 2025

