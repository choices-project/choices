# Your Definitive Steps: Make Active Facilitation Real

**Created:** January 30, 2025  
**Status:** 🎯 **READY FOR YOU - CODE IS BUILT**

---

## 🎯 The Situation

**What's Built:** ✅ 95% complete  
**What You Need to Do:** ⚠️ 30 minutes of setup

**The Code:**
- ✅ Email service library
- ✅ Email templates (7 types)
- ✅ Email sending API
- ✅ Scheduled cron job
- ✅ Journey tracking
- ✅ Dashboard component

**The Gap:**
- ❌ Email service account (Resend)
- ❌ API key configuration
- ❌ Package installation
- ❌ Deploy & test

---

## 📋 YOUR DEFINITIVE STEPS (In Order)

### **STEP 1: Sign Up for Resend** ⏱️ **10 minutes**

1. **Visit:** https://resend.com
2. **Click:** "Sign Up" (top right)
3. **Create Account:**
   - Use your email
   - Verify your email (check inbox)
4. **Done when:** You can log into Resend dashboard

---

### **STEP 2: Get API Key** ⏱️ **5 minutes**

1. **In Resend Dashboard:**
   - Click "API Keys" (left sidebar)
   - Or go to: https://resend.com/api-keys

2. **Create Key:**
   - Click "Create API Key"
   - Name: `Choices Production`
   - Permission: Full access
   - Click "Add"

3. **Copy Key:**
   - **CRITICAL:** Copy the key immediately (starts with `re_`)
   - You won't see it again
   - Store securely

**✅ Done when:** You have API key copied

---

### **STEP 3: Add API Key to Project** ⏱️ **5 minutes**

1. **Open `.env.local`:**
   ```bash
   cd web
   # Open .env.local in your editor
   ```

2. **Add This Line:**
   ```bash
   RESEND_API_KEY=re_your_actual_key_here
   ```
   (Replace `re_your_actual_key_here` with your actual key)

3. **Verify:**
   ```bash
   grep RESEND_API_KEY .env.local
   # Should show: RESEND_API_KEY=re_...
   ```

**✅ Done when:** Key is in `.env.local`

---

### **STEP 4: Install Resend Package** ⏱️ **2 minutes**

```bash
cd web
npm install resend
```

**✅ Done when:** Package installs without errors

---

### **STEP 5: Test Email Sending** ⏱️ **15 minutes**

1. **Start Dev Server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Declare Candidacy (as yourself):**
   - Go to: http://localhost:3000/candidate/declare
   - Complete the wizard
   - Submit

3. **Get Your Platform ID:**
   - Go to: http://localhost:3000/candidate/dashboard
   - Check the URL or browser console for platform ID
   - Or check database directly

4. **Test Email Endpoint:**
   ```bash
   # Replace YOUR_PLATFORM_ID with actual ID
   curl "http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_PLATFORM_ID&type=welcome"
   ```

5. **Check Email:**
   - Check your inbox
   - Check spam folder
   - Should receive welcome email
   - Test links in email

**✅ Done when:** You receive test email

---

### **STEP 6: Deploy & Configure Cron** ⏱️ **15 minutes**

1. **Commit & Push:**
   ```bash
   git add .
   git commit -m "Add email reminder system"
   git push
   ```

2. **Vercel Auto-Deploys:**
   - Vercel picks up push automatically
   - Wait for deployment to complete
   - Check Vercel dashboard

3. **Verify Cron Job:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to "Settings" → "Cron Jobs"
   - Should see: `/api/cron/candidate-reminders` scheduled for `0 9 * * *`
   - If not, add it manually:
     - Path: `/api/cron/candidate-reminders`
     - Schedule: `0 9 * * *`

4. **Set Environment Variable (Production):**
   - In Vercel Dashboard: "Settings" → "Environment Variables"
   - Add: `RESEND_API_KEY` = (your key)
   - Add to: Production, Preview, Development
   - Redeploy if needed

**✅ Done when:** Cron job shows in Vercel, environment variable set

---

### **STEP 7: Test Complete Flow** ⏱️ **20 minutes**

1. **Declare Candidacy (in production or locally):**
   - Complete wizard
   - Submit

2. **Verify Dashboard:**
   - Go to `/candidate/dashboard`
   - Journey Progress component should show
   - Next action displayed
   - Checklist visible

3. **Trigger Welcome Email:**
   ```bash
   # Production
   curl -X POST https://your-domain.com/api/candidate/journey/send-email \
     -H "Content-Type: application/json" \
     -d '{"platformId":"YOUR_PLATFORM_ID","type":"welcome"}'
   ```

4. **Verify Email Received:**
   - Check inbox
   - Verify content
   - Test links

**✅ Done when:** Complete flow works end-to-end

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] Resend account created
- [ ] API key in `.env.local`
- [ ] API key in Vercel environment variables
- [ ] `resend` package installed
- [ ] Test email sent successfully
- [ ] Test email received
- [ ] Cron job configured in Vercel
- [ ] Dashboard shows journey progress
- [ ] Email links work
- [ ] Complete flow works

---

## 🎯 What Happens After You Complete These Steps

### **Automatic Reminders Will:**
1. ✅ Send welcome email 24 hours after declaration
2. ✅ Send check-in email after 3 days of no activity
3. ✅ Send deadline reminders (30, 7, 1 days before)
4. ✅ Send verification prompts after filing
5. ✅ Send congratulations after verification

### **The System Will:**
- ✅ Track every candidate's journey
- ✅ Calculate next actions automatically
- ✅ Determine when reminders are needed
- ✅ Send emails at the right time
- ✅ Update progress automatically

---

## 🐛 If Something Goes Wrong

### **Email Not Sending:**
- ✅ Check API key is correct
- ✅ Restart dev server after adding env var
- ✅ Check Resend dashboard for send logs
- ✅ Verify account is verified
- ✅ Check spam folder

### **Cron Job Not Running:**
- ✅ Verify cron job exists in Vercel
- ✅ Check path is correct: `/api/cron/candidate-reminders`
- ✅ Check schedule: `0 9 * * *`
- ✅ Verify deployment succeeded
- ✅ Check Vercel logs

### **Dashboard Not Showing:**
- ✅ Check API endpoint works
- ✅ Verify platform exists
- ✅ Check browser console for errors
- ✅ Verify user is authenticated

---

## 📊 Timeline

### **Your Setup (30 minutes):**
- Step 1: 10 min
- Step 2: 5 min
- Step 3: 5 min
- Step 4: 2 min
- Step 5: 15 min
- Step 6: 15 min (can be async)
- Step 7: 20 min (testing)

**Total: ~1 hour**

### **System Activation:**
- ✅ Immediate after setup
- ✅ Cron job runs daily at 9 AM UTC
- ✅ Emails sent automatically
- ✅ No further action needed

---

## 🚀 Success Indicators

**You'll know it's working when:**

- ✅ Test email arrives in inbox
- ✅ Welcome email sent after declaration
- ✅ Cron job runs daily (check Vercel logs)
- ✅ Reminders sent at right time
- ✅ Dashboard shows journey progress
- ✅ Candidates get help automatically

---

## 📞 Support Resources

**Documentation:**
- `web/docs/filing-system/SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `web/docs/filing-system/YOUR_ACTION_PLAN.md` - Overview and context

**Code:**
- `web/lib/services/email/candidate-journey-emails.ts` - Email service
- `web/app/api/candidate/journey/send-email/route.ts` - Email API
- `web/app/api/cron/candidate-reminders/route.ts` - Cron job

---

## ✅ Summary

### **What You Do (30-60 minutes):**
1. Sign up for Resend
2. Get API key
3. Add to `.env.local`
4. Install package
5. Test email
6. Deploy & configure

### **What Happens (Automatic):**
- ✅ Reminders sent daily
- ✅ Candidates get help
- ✅ Journey tracked
- ✅ Progress monitored

### **Result:**
- ✅ Active facilitation enabled
- ✅ High conversion rates
- ✅ Candidates don't fall through cracks
- ✅ System helps automatically

---

**Once you complete Steps 1-6, the system is fully operational!**

---

**Last Updated:** January 30, 2025

