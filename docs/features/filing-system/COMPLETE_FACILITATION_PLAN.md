# Complete Facilitation Plan: From Interest to Official Filing

**Created:** January 30, 2025  
**Status:** 🎯 **DEFINITIVE ROADMAP**  
**Goal:** Actually facilitate candidates from "thinking about it" to "officially filed"

---

## 🎯 The Complete Journey We Must Facilitate

### **Stage 1: Interest** 
**Trigger:** User sees "Run for Office" button or visits `/candidate/declare`  
**Goal:** Convert interest to action

**What We Do:**
- ✅ Make it easy to start (one click)
- ✅ Show it's possible (alternative candidates visible)
- ✅ Lower barriers (free, simple)

---

### **Stage 2: Declaration**
**Trigger:** User completes declaration wizard  
**Goal:** Get them committed and informed

**What We Do:**
- ✅ Show filing requirements immediately
- ✅ Make declaration process easy
- ✅ **NEW:** Post-declaration welcome with action plan
- ✅ **NEW:** Set up journey tracking

---

### **Stage 3: Preparation** (THE CRITICAL GAP)
**Trigger:** Declaration complete  
**Goal:** Help them actually prepare and file

**What We Do NOW:** ⚠️ **INCOMPLETE**
- ✅ Show requirements
- ✅ Show deadlines
- ❌ **MISSING:** Track if they're preparing
- ❌ **MISSING:** Remind them to prepare
- ❌ **MISSING:** Guide them step-by-step

**What We Need:**
- ✅ Journey progress tracker (BUILT)
- ✅ Dashboard with checklist (BUILT)
- ❌ **Email reminders** (NOT BUILT)
- ❌ **Checklist completion tracking** (NOT BUILT)
- ❌ **Progress follow-up** (NOT BUILT)

---

### **Stage 4: Filing**
**Trigger:** Deadline approaching or user starts filing  
**Goal:** Help them complete filing successfully

**What We Do NOW:** ⚠️ **PARTIAL**
- ✅ Show filing portal links
- ✅ Show requirements
- ❌ **MISSING:** Track filing progress
- ❌ **MISSING:** Remind about deadline
- ❌ **MISSING:** Help if stuck

**What We Need:**
- ✅ Deadline warnings (PARTIAL - shows but doesn't remind)
- ❌ **Email reminders** (NOT BUILT)
- ❌ **Filing progress tracking** (NOT BUILT)
- ❌ **Completion prompts** (NOT BUILT)

---

### **Stage 5: Verification**
**Trigger:** User files officially  
**Goal:** Verify and confirm they're official

**What We Do NOW:** ✅ **GOOD**
- ✅ FEC verification works
- ✅ Auto-verification on FEC confirm
- ✅ Appears in Alternative Candidates
- ⚠️ **PARTIAL:** Have to prompt them to verify

**What We Need:**
- ❌ **Automatic prompts** to verify after filing
- ❌ **Follow-up if not verified**

---

### **Stage 6: Active Campaign**
**Trigger:** Verification complete  
**Goal:** Help them succeed as candidates

**What We Do NOW:** ❌ **MISSING**
- ❌ No campaign resources
- ❌ No community connection
- ❌ No ongoing support

**What We Need:**
- ❌ Campaign resources library
- ❌ Community forum
- ❌ Next steps guide

---

## 🔍 The Gap Analysis

### **Where We Lose Candidates:**

1. **Declaration → Preparation** ❌ **BIG GAP**
   - 30-50% abandon here (estimated)
   - Don't know what to do next
   - No reminder to continue
   - Lose momentum

2. **Preparation → Filing** ❌ **BIG GAP**
   - Another 20-30% abandon
   - Overwhelmed by requirements
   - Miss deadlines
   - Procrastinate

3. **Filing → Verification** ⚠️ **SMALLER GAP**
   - Some file but don't verify
   - Don't know they should verify
   - Don't know how to verify

---

## 🚀 What "Actually Facilitating" Means

### **Not Just Information:**
❌ Show requirements  
❌ Show deadlines  
❌ Show links

### **Active Facilitation:**
✅ **Track:** Know where they are in the process  
✅ **Remind:** Send timely reminders  
✅ **Guide:** Show exactly what to do next  
✅ **Celebrate:** Recognize progress  
✅ **Follow-up:** Don't let them fall through cracks  
✅ **Help:** Assist when stuck

---

## 📋 Implementation Checklist

### **PHASE 1: Foundation (Week 1)** ✅ **PARTIALLY DONE**

- [x] Journey progress tracker (built)
- [x] Journey progress component (built)
- [x] Dashboard integration (done)
- [ ] Email service setup
- [ ] Welcome email template
- [ ] Post-declaration trigger

**Status:** 60% complete

---

### **PHASE 2: Reminders (Week 2)**

- [ ] Email service integration (SendGrid/Resend)
- [ ] Scheduled reminder job (Vercel Cron or Supabase Edge Function)
- [ ] Welcome email (24 hours after declaration)
- [ ] Check-in email (3 days, no activity)
- [ ] Deadline reminder emails (30, 7, 1 days)
- [ ] Verification prompt email (after filing)

**Status:** 0% complete  
**Priority:** HIGH

---

### **PHASE 3: Progress Tracking (Week 2-3)**

- [ ] Checklist completion database table
- [ ] Mark checklist items complete
- [ ] Track document gathering progress
- [ ] Track form completion progress
- [ ] Visual progress indicators
- [ ] Milestone celebrations

**Status:** 20% complete (UI built, backend not)

---

### **PHASE 4: Active Guidance (Week 3)**

- [ ] Next action calculator (built, needs refinement)
- [ ] Action buttons that do things
- [ ] Filing completion detection
- [ ] Follow-up prompts
- [ ] Help resources

**Status:** 40% complete

---

### **PHASE 5: Post-Filing Support (Week 4)**

- [ ] Campaign resources library
- [ ] Community connection
- [ ] Next steps guide
- [ ] Ongoing support

**Status:** 0% complete

---

## 🎯 Critical Path to Success

### **To Actually Facilitate, We MUST Have:**

1. **✅ Journey Tracking** - DONE
   - Know where they are
   - Show progress
   - Display next action

2. **❌ Email Reminders** - NOT DONE
   - Welcome email
   - Check-in emails
   - Deadline reminders
   - Verification prompts

3. **❌ Progress Tracking** - PARTIAL
   - Checklist completion
   - Document tracking
   - Form tracking

4. **⚠️ Active Follow-up** - PARTIAL
   - Dashboard prompts
   - Action buttons
   - Help resources

---

## 💡 The Key Insight

**We can't facilitate what we don't track.**

**Current State:**
- We don't track if they reviewed requirements
- We don't track if they gathered documents
- We don't track if they started filing
- We don't know if they're stuck
- We don't know when to remind them

**With Tracking:**
- ✅ Know exactly where they are
- ✅ Send right reminder at right time
- ✅ Help when stuck
- ✅ Celebrate progress
- ✅ Never lose them

---

## 🚀 Immediate Action Plan

### **This Week:**

1. **Set up email service** (Day 1-2)
   - Choose service (Resend recommended)
   - Set up API key
   - Create email templates

2. **Build welcome email** (Day 2-3)
   - Template with next steps
   - Links to dashboard
   - Filing requirements summary

3. **Create scheduled job** (Day 3-4)
   - Vercel Cron job
   - Check candidates daily
   - Send appropriate reminders

4. **Test end-to-end** (Day 4-5)
   - Declare candidacy
   - Receive welcome email
   - See journey progress
   - Test reminders

---

### **Next Week:**

5. **Build checklist tracking** (Day 1-3)
   - Database table
   - API endpoints
   - UI updates

6. **Add deadline reminders** (Day 3-4)
   - Calculate deadlines
   - Schedule reminders
   - Send emails

7. **Add verification prompts** (Day 4-5)
   - Detect filing completion
   - Prompt to verify
   - Follow-up if not

---

## 📊 Success Metrics

### **Key Indicators:**

**Engagement:**
- Email open rate (target: 40%+)
- Dashboard visit frequency
- Checklist completion rate

**Conversion:**
- Declaration → Filing: Currently ~30% (target: 70%+)
- Filing → Verification: Currently ~60% (target: 90%+)
- Time to file: Currently unknown (target: <30 days)

**Completion:**
- % who complete all checklist items
- % who file before deadline
- % who verify after filing

---

## ✅ What "Actually Facilitating" Looks Like

### **Example User Journey (With Full Implementation):**

**Day 0: Declaration**
1. User declares candidacy
2. ✅ Receives immediate welcome email
3. ✅ Dashboard shows journey progress
4. ✅ Clear next action: "Review filing requirements"

**Day 1:**
5. ✅ Receives email: "Here's your action plan"
6. ✅ Dashboard shows checklist
7. ✅ User clicks "Review Requirements"
8. ✅ Checklist item marked complete

**Day 3:**
9. ✅ If no progress: Email "How's it going? Need help?"
10. ✅ Dashboard prompts: "Ready to start filing?"

**Day 14 (if 30-day deadline):**
11. ✅ Email: "Deadline in 16 days. Start filing now!"
12. ✅ Dashboard shows countdown

**Day 23:**
13. ✅ Email: "7 days until deadline! File now!"
14. ✅ Dashboard: Urgent warning

**Day 29:**
15. ✅ Email: "DEADLINE TOMORROW! File today!"
16. ✅ Dashboard: Critical warning, all resources visible

**After Filing:**
17. ✅ User updates status: "Filed"
18. ✅ Email: "Great! Let's verify your filing"
19. ✅ Dashboard: Verification button prominent

**After Verification:**
20. ✅ Email: "Congratulations! You're official!"
21. ✅ Dashboard: Celebration, next steps
22. ✅ Appears in Alternative Candidates

**Every step is guided, tracked, and celebrated.**

---

## 🎯 The Bottom Line

**To actually facilitate, we need:**

1. **Tracking** ✅ (Built)
2. **Reminders** ❌ (Must build)
3. **Guidance** ⚠️ (Partial)
4. **Celebration** ❌ (Must build)
5. **Follow-up** ❌ (Must build)

**Without these, we're just providing information - not actually facilitating.**

**With these, we actively help candidates succeed at every step.**

---

**Last Updated:** January 30, 2025

