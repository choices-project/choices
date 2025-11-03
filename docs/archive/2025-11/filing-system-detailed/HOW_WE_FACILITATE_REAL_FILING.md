# How We Actually Facilitate Real Filing

**Created:** January 30, 2025  
**Status:** 🎯 **DEFINITIVE GUIDE**

---

## 🎯 The Question

**"How can we make the user's journey from 'thought about being a candidate' to 'this is happening in a real way' and we are actually factually facilitating?"**

---

## ✅ What We Built (Foundation)

### **1. Journey Progress System** ✅
- **Tracks:** Where they are (declared → preparing → filing → filed → verified → active)
- **Shows:** What they need to do next
- **Calculates:** Urgency of next action
- **Displays:** On dashboard with checklist

**This gives us the INTELLIGENCE to facilitate.**

---

### **2. Filing Requirements System** ✅
- **Shows:** Exact requirements for their office
- **Links:** Direct to official filing portals
- **Warns:** About deadlines
- **Guides:** Step-by-step process

**This gives them the INFORMATION they need.**

---

## ❌ The Critical Gap: Active Outreach

### **What We're Missing:**

**We can TRACK and SHOW, but we can't REACH OUT.**

- ✅ We know where they are
- ✅ We know what they need to do
- ✅ We show it on dashboard
- ❌ **But:** We don't email them
- ❌ **But:** We don't remind them
- ❌ **But:** We don't follow up
- ❌ **But:** We don't know if they're stuck

**Result:** Many declare, then forget. Never actually file.

---

## 🚀 How to Actually Facilitate

### **The Complete System:**

#### **1. Declaration → Welcome** ✅ **PARTIAL**
**Current:**
- ✅ Dashboard shows journey progress
- ✅ Next action displayed
- ❌ **No welcome email**

**Needed:**
- Email sent 24 hours after declaration
- Subject: "Welcome! Here's your path to filing"
- Content: Next steps, checklist, links
- **Impact:** Reminds them, shows we care, guides them

---

#### **2. Preparation → Check-ins** ❌ **MISSING**
**Current:**
- ✅ Dashboard shows requirements
- ✅ Checklist visible
- ❌ **No active check-ins**

**Needed:**
- Email after 3 days if no activity: "How's your filing going?"
- Email after 7 days: "Ready to start filing?"
- Dashboard prompts if inactive
- **Impact:** Prevents abandonment, offers help

---

#### **3. Deadline → Urgent Reminders** ⚠️ **PARTIAL**
**Current:**
- ✅ Deadline shown on dashboard
- ✅ Warning colors for urgency
- ❌ **No email reminders**

**Needed:**
- Email 30 days before: "Your deadline is coming"
- Email 7 days before: "7 days left! File now!"
- Email 1 day before: "DEADLINE TOMORROW!"
- Dashboard urgent warnings
- **Impact:** Prevents missed deadlines

---

#### **4. Filing → Verification Prompts** ⚠️ **PARTIAL**
**Current:**
- ✅ Verification button on dashboard
- ✅ FEC verification works
- ❌ **No active prompts**

**Needed:**
- Email after filing deadline: "Did you file? Update status"
- Email after status updated: "Let's verify your filing!"
- Dashboard prompts to verify
- **Impact:** Higher verification rates

---

#### **5. Verification → Next Steps** ❌ **MISSING**
**Current:**
- ✅ Platform appears in Alternative Candidates
- ❌ **No celebration or next steps**

**Needed:**
- Email: "Congratulations! You're official!"
- Dashboard: Celebration, campaign resources
- Next steps guide
- **Impact:** Completes the journey, sets up success

---

## 💡 What "Actually Facilitating" Looks Like

### **User Experience:**

**Day 0: Declaration**
```
✅ User declares candidacy
✅ Redirected to dashboard
✅ Sees: "Welcome! Here's your journey"
✅ Sees: "Next: Review filing requirements"
✅ Sees: Checklist with 9 items
✅ Gets email: "Welcome! Here's your action plan"
```

**Day 1:**
```
✅ User opens email: "Welcome! Here's your action plan"
✅ Clicks link to dashboard
✅ Sees progress: "1 of 9 items complete"
✅ Sees next action: "Review filing requirements"
✅ Clicks action, marks complete
✅ Progress: "2 of 9 items complete"
```

**Day 3 (if no activity):**
```
✅ Gets email: "How's your filing going? Need help?"
✅ Dashboard shows: "You haven't been active in 3 days"
✅ Prompt: "Ready to continue?"
```

**30 Days Before Deadline:**
```
✅ Gets email: "Your filing deadline is in 30 days"
✅ Dashboard shows countdown
✅ Prompt: "Start filing now"
```

**7 Days Before Deadline:**
```
✅ Gets email: "7 DAYS LEFT! File now!"
✅ Dashboard: Urgent warning
✅ All filing resources prominent
✅ Direct links to file
```

**After Filing:**
```
✅ User updates: "I filed!"
✅ Gets email: "Great! Let's verify your filing"
✅ Dashboard: "Verify Now" button prominent
✅ One click to verify
```

**After Verification:**
```
✅ Gets email: "Congratulations! You're an official candidate!"
✅ Dashboard: Celebration banner
✅ Shows: "You appear in Alternative Candidates"
✅ Next steps: Campaign resources, community
```

---

## 🔧 What Needs to Be Built

### **CRITICAL (Do First):**

#### **1. Email Service** ❌
**Status:** NOT BUILT  
**Effort:** 1 day

**What:**
- Choose service (Resend recommended - simple, cheap)
- Set up API key
- Test sending

**Why Critical:** Can't facilitate without reaching out

---

#### **2. Welcome Email** ❌
**Status:** NOT BUILT  
**Effort:** 1 day

**Template:**
- Subject: "Welcome! Your path to filing for [Office]"
- Body:
  - Congratulations on declaring
  - Your next steps checklist
  - Link to dashboard
  - Filing requirements summary
  - Deadline information

**Why Critical:** First impression, sets expectations

---

#### **3. Scheduled Reminder Job** ❌
**Status:** NOT BUILT  
**Effort:** 1-2 days

**What:**
- Vercel Cron job (runs daily)
- Checks all candidates
- Determines who needs reminders
- Sends appropriate emails

**Why Critical:** Without this, reminders never get sent

---

#### **4. Reminder Email Templates** ❌
**Status:** NOT BUILT  
**Effort:** 1 day

**Templates Needed:**
- Check-in email (3 days, no activity)
- Deadline reminders (30, 7, 1 days)
- Verification prompts (after filing)
- Congratulations (after verification)

**Why Critical:** Need messages to send

---

### **IMPORTANT (Do Next):**

#### **5. Checklist Completion Tracking** ❌
**Status:** NOT BUILT  
**Effort:** 2-3 days

**What:**
- Database table for checklist items
- API to mark complete
- Persistence
- UI updates

**Why Important:** Track progress, know where they are

---

#### **6. Filing Completion Detection** ❌
**Status:** NOT BUILT  
**Effort:** 1-2 days

**What:**
- Detect when deadline passes
- Prompt: "Did you file?"
- Make it easy to update status
- Trigger verification prompt

**Why Important:** Know when to prompt for verification

---

## 📊 The Complete Facilitation System

### **Intelligence Layer** ✅ **DONE**
- Journey tracker knows where they are
- Next action calculator knows what's needed
- Reminder logic knows when to reach out

### **Display Layer** ✅ **DONE**
- Dashboard shows progress
- Shows checklist
- Shows next action
- Shows deadlines

### **Outreach Layer** ❌ **MISSING**
- Email service
- Reminder emails
- Follow-up emails
- Celebration emails

### **Tracking Layer** ⚠️ **PARTIAL**
- Journey stage tracked ✅
- Checklist completion ❌
- Activity tracking ⚠️
- Email sends ❌

---

## 🎯 The Path Forward

### **Week 1: Outreach Capability**
1. Set up email service (Resend)
2. Build welcome email template
3. Build reminder email templates
4. Create scheduled reminder job
5. Test end-to-end

**Result:** Can actively reach out to candidates

---

### **Week 2: Tracking & Follow-up**
6. Build checklist completion tracking
7. Add activity tracking
8. Build filing completion detection
9. Add verification prompts
10. Test complete flow

**Result:** Know where they are, can follow up appropriately

---

### **Week 3: Enhancement**
11. Add milestone celebrations
12. Build campaign resources
13. Add success metrics
14. Polish UX

**Result:** Complete facilitation system

---

## ✅ Success Criteria

### **We're "Actually Facilitating" When:**

1. ✅ **Every candidate gets welcome email** - Knows what to do
2. ✅ **Candidates get reminders** - Don't forget deadlines
3. ✅ **We know where they are** - Can help when stuck
4. ✅ **We follow up** - Don't leave them hanging
5. ✅ **We celebrate progress** - Encourages continuation
6. ✅ **High conversion rates** - 70%+ declaration → filing

### **Current vs. Target:**

**Current:**
- Declaration → Filing: ~30% (estimated)
- Active facilitation: 40% (tracking + display, no outreach)

**Target:**
- Declaration → Filing: 70%+
- Active facilitation: 100% (tracking + display + outreach + follow-up)

---

## 💡 Key Insight

**Facilitation = Intelligence + Display + Outreach + Tracking**

**We Have:**
- ✅ Intelligence (journey tracker)
- ✅ Display (dashboard component)
- ⚠️ Tracking (partial)
- ❌ Outreach (missing)

**To Actually Facilitate, We Must Add Outreach.**

**Outreach = Email reminders + Follow-ups + Celebrations**

**This is what makes the difference between "helpful tool" and "active facilitator."**

---

## 🚀 Immediate Next Steps

1. **Choose email service** (Resend recommended)
2. **Build welcome email** (template + send logic)
3. **Create scheduled job** (Vercel Cron)
4. **Build reminder templates** (5 templates)
5. **Test end-to-end** (declare → receive emails)

**Once these are done, we're actively facilitating - not just informing.**

---

**Last Updated:** January 30, 2025

