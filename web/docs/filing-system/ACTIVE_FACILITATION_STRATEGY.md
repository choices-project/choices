# Active Facilitation Strategy: From Interest to Official Filing

**Created:** January 30, 2025  
**Status:** 🚀 **IMPLEMENTATION GUIDE**

---

## 🎯 The Goal

**Transform from "information provider" to "active facilitator"**

**Current State:** We show requirements, users do the rest  
**Target State:** We guide, remind, track, and celebrate every step

---

## 🔍 The Problem: The Gap

### **What Happens Now:**
1. User declares candidacy ✅
2. User sees filing requirements ✅
3. User leaves... ❌
4. **GAP:** We don't know if they're doing anything
5. **GAP:** We don't remind them
6. **GAP:** We don't follow up
7. **GAP:** Many never actually file

### **What Should Happen:**
1. User declares candidacy ✅
2. **IMMEDIATE:** Welcome email with action plan ✅
3. **IMMEDIATE:** Dashboard shows clear next steps ✅
4. **3 DAYS:** Check-in email if no progress ✅
5. **7 DAYS BEFORE DEADLINE:** Deadline reminder ✅
6. **1 DAY BEFORE DEADLINE:** Urgent reminder ✅
7. **AFTER FILING:** Verification prompt ✅
8. **AFTER VERIFICATION:** Congratulations + next steps ✅

---

## 🚀 Solutions Implemented

### **1. Journey Progress Tracker** ✅

**What it does:**
- Tracks candidate through 6 stages: declared → preparing → filing → filed → verified → active
- Shows checklist of required actions
- Displays next action with urgency
- Calculates progress percentage

**Location:**
- `web/lib/candidate/journey-tracker.ts` - Core logic
- `web/components/candidate/JourneyProgress.tsx` - UI component
- `web/app/api/candidate/journey/progress/route.ts` - API endpoint

**Features:**
- Stage detection based on platform status
- Next action calculation
- Deadline tracking
- Reminder triggers
- Progress visualization

---

### **2. Journey Progress Dashboard Component** ✅

**What it shows:**
- Overall progress bar
- Next action (color-coded by urgency)
- Deadline countdown
- Action item checklist
- Days since declaration
- Last active date

**Integration:**
- Appears on candidate dashboard
- Updates automatically
- Links to relevant actions

---

### **3. Post-Declaration Flow** ✅

**What happens:**
- Immediately after declaration, triggers welcome flow
- Sets up journey tracking
- Prepares for reminders

**Implementation:**
- API endpoint: `/api/candidate/journey/post-declaration`
- Called automatically after declaration
- Non-blocking (doesn't slow down declaration)

---

## 📋 What Still Needs Implementation

### **CRITICAL (Do First):**

#### **1. Email Reminder System** ❌

**What's Needed:**
- Email service integration (SendGrid, Resend, etc.)
- Email templates for each reminder type:
  - Welcome email (24 hours after declaration)
  - Check-in email (3 days, no activity)
  - Deadline reminder (30 days, 7 days, 1 day)
  - Verification reminder (3 days after filing)
  - Congratulations email (after verification)

**Implementation:**
```typescript
// web/lib/services/email/candidate-journey-emails.ts
export async function sendWelcomeEmail(platformId: string) {
  // Get platform and user info
  // Generate email with:
  // - Congratulations
  // - Next steps checklist
  // - Direct links to dashboard
  // - Filing requirements link
  // - Deadline info
}
```

**Timeline:** 1 week

---

#### **2. Scheduled Reminder Job** ❌

**What's Needed:**
- Cron job or scheduled function
- Checks all candidates daily
- Determines who needs reminders
- Sends appropriate emails

**Implementation Options:**
- **Vercel Cron Jobs** - Easy, built-in
- **Supabase Edge Functions** - Scheduled
- **External service** - GitHub Actions, etc.

**Timeline:** 3 days

---

#### **3. Dashboard Next Steps Widget** ⚠️ **PARTIAL**

**What's Needed:**
- Clear "What's Next" section
- Action buttons that actually do things
- Progress celebration
- Milestone recognition

**Current:** JourneyProgress component created, needs integration

**Timeline:** 2 days

---

#### **4. Checklist Completion Tracking** ❌

**What's Needed:**
- Database table for checklist progress
- API to mark items complete
- Persistence across sessions
- Visual progress indicators

**Implementation:**
- Add `candidate_journey_checklist` table
- Track completion per platform
- Update UI when items completed

**Timeline:** 3 days

---

### **IMPORTANT (Do Next):**

#### **5. Deadline Calculation Enhancement** ⚠️ **PARTIAL**

**Current:** Basic deadline calculation  
**Needed:** 
- Auto-calculate deadline when election date set
- Show on dashboard immediately
- Update reminders when deadline changes

**Timeline:** 2 days

---

#### **6. Filing Completion Detection** ❌

**What's Needed:**
- Prompt: "Did you file?" after deadline passes
- Make it easy to update status
- Auto-update if they verify via FEC

**Implementation:**
- Dashboard prompt after deadline
- One-click status update
- Link to verification

**Timeline:** 2 days

---

#### **7. Success Metrics Dashboard** ❌

**What's Needed:**
- Track conversion rates:
  - Declaration → Filing
  - Filing → Verification
  - Time to file
- Show candidates their progress
- Celebrate milestones

**Timeline:** 1 week

---

## 🎯 The Complete Active Facilitation Flow

### **Timeline of Interventions:**

```
Day 0: Declaration
  → Immediate: Welcome email + dashboard action plan
  → Dashboard: Shows journey progress, next steps

Day 1: 
  → Email: "Here's your personalized action plan"
  → Dashboard: Checklist visible, progress tracked

Day 3:
  → Email: "How's your filing going? Need help?"
  → Dashboard: Still shows if no progress

Day 7:
  → Email: "You've been preparing for a week. Ready to file?"
  → Dashboard: Filing guide wizard available

30 Days Before Deadline:
  → Email: "Your filing deadline is in 30 days"
  → Dashboard: Deadline countdown prominent

7 Days Before Deadline:
  → Email: "Deadline in 7 days! File now!"
  → Dashboard: Urgent warning, direct filing links

1 Day Before Deadline:
  → Email: "DEADLINE TOMORROW! File today!"
  → Dashboard: Critical warning, all resources visible

After Deadline:
  → Email: "Did you file? Update your status"
  → Dashboard: Prompt to update filing status

After Filing Status Updated:
  → Email: "Great! Let's verify your filing"
  → Dashboard: Verification button prominent

After Verification:
  → Email: "Congratulations! You're official. Here's what's next"
  → Dashboard: Celebration, campaign resources
```

---

## 💡 Key Principles

### **1. Never Leave Them Hanging**
- Every stage has a clear next action
- Never wonder "what do I do now?"

### **2. Timely Reminders**
- Not too frequent (annoying)
- Not too infrequent (forgotten)
- Right message at right time

### **3. Progress Celebration**
- Recognize milestones
- Show progress
- Encourage continuation

### **4. Make It Easy**
- One-click actions
- Direct links
- Clear instructions

### **5. Factual Facilitation**
- Not just information
- Actual help with actions
- Track what's done
- Follow up on what's not

---

## 📊 Success Metrics

### **What We'll Measure:**

**Conversion Funnel:**
- Declaration → Review Requirements: Target 90%+
- Review Requirements → Start Filing: Target 70%+
- Start Filing → Complete Filing: Target 80%+
- Complete Filing → Verify: Target 90%+

**Engagement:**
- Email open rates
- Dashboard visit frequency
- Time to file
- Days from declaration to filing

**Outcomes:**
- % who actually file
- % who verify
- % who become active candidates

---

## 🚀 Implementation Priority

### **Week 1: Critical Foundation**
1. ✅ Journey Progress Tracker (DONE)
2. ✅ Journey Progress Component (DONE)
3. ❌ Email service setup
4. ❌ Welcome email template
5. ❌ Scheduled reminder job

### **Week 2: Active Follow-up**
6. ❌ Check-in emails
7. ❌ Deadline reminder emails
8. ❌ Verification prompt emails
9. ❌ Dashboard enhancements

### **Week 3: Completion & Tracking**
10. ❌ Checklist completion tracking
11. ❌ Filing completion detection
12. ❌ Success metrics dashboard
13. ❌ Milestone celebrations

---

## ✅ What Makes This "Actually Facilitating"

### **Before (Passive):**
- ❌ Show requirements
- ❌ User remembers
- ❌ User does it themselves
- ❌ We don't know if they did it

### **After (Active):**
- ✅ Show requirements + track if reviewed
- ✅ Send reminders at right time
- ✅ Guide them step-by-step
- ✅ Know when they complete steps
- ✅ Celebrate progress
- ✅ Follow up if they're stuck
- ✅ Never leave them wondering "what's next?"

---

## 🎯 The Result

**When fully implemented, candidates will:**
1. ✅ Know exactly what to do next (always)
2. ✅ Get timely reminders (never miss deadlines)
3. ✅ Feel supported (not abandoned)
4. ✅ See their progress (encouraged to continue)
5. ✅ Actually file (high conversion rate)

**We're not just giving information - we're actively helping them succeed.**

---

**Last Updated:** January 30, 2025

