# Setup Instructions: Active Facilitation System

**Created:** January 30, 2025  
**Status:** 📋 **STEP-BY-STEP GUIDE FOR YOU**

---

## 🎯 Overview

This guide walks you through setting up the email reminder system that makes active facilitation possible.

**Time Required:** ~1 hour  
**Difficulty:** Easy

---

## ✅ Prerequisites

- [ ] Node.js installed
- [ ] Access to `.env.local` file
- [ ] Vercel account (for cron jobs)
- [ ] Resend account (free tier works)

---

## 📋 Step-by-Step Instructions

### **STEP 1: Sign Up for Resend** ⏱️ **10 minutes**

1. **Go to Resend:**
   - Visit: https://resend.com
   - Click "Sign Up" (top right)

2. **Create Account:**
   - Use your email
   - Verify your email address
   - Complete signup

3. **Verify Account:**
   - Check your email for verification link
   - Click to verify

**✅ Done when:** You can log into Resend dashboard

---

### **STEP 2: Get API Key** ⏱️ **5 minutes**

1. **Navigate to API Keys:**
   - In Resend dashboard, click "API Keys" (left sidebar)
   - Or go to: https://resend.com/api-keys

2. **Create New Key:**
   - Click "Create API Key"
   - Name it: `Choices Production` (or similar)
   - Permission: Full access
   - Click "Add"

3. **Copy Key:**
   - **IMPORTANT:** Copy the key immediately
   - It starts with `re_`
   - You won't be able to see it again
   - Store it securely

**✅ Done when:** You have API key copied

---

### **STEP 3: Add API Key to Project** ⏱️ **5 minutes**

1. **Open `.env.local`:**
   ```bash
   cd web
   # Open .env.local in your editor
   ```

2. **Add Resend Key:**
   ```bash
   # Add this line:
   RESEND_API_KEY=re_your_actual_key_here
   ```

3. **Optional - Set From Email:**
   ```bash
   # If you have a verified domain:
   RESEND_FROM_EMAIL=candidates@yourdomain.com
   
   # Otherwise, Resend will use their default (onboarding@resend.dev)
   ```

4. **Verify It's Added:**
   ```bash
   grep RESEND_API_KEY .env.local
   # Should show your key (don't share this!)
   ```

**✅ Done when:** Key is in `.env.local` file

---

### **STEP 4: Install Resend Package** ⏱️ **2 minutes**

```bash
cd web
npm install resend
```

**✅ Done when:** Package installs without errors

---

### **STEP 5: Test Email Sending** ⏱️ **10 minutes**

1. **Start Dev Server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Test Email Endpoint:**
   
   **Option A: Via Browser (if you have a platform):**
   ```
   http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_PLATFORM_ID&type=welcome
   ```
   
   **Option B: Via curl:**
   ```bash
   # First, declare candidacy to get a platform ID
   # Then test:
   curl "http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_PLATFORM_ID&type=welcome"
   ```

3. **Check Email:**
   - Check your inbox (and spam folder)
   - Should receive welcome email
   - Verify links work

**✅ Done when:** You receive test email

---

### **STEP 6: Set Up Vercel Cron Job** ⏱️ **15 minutes**

1. **Deploy to Vercel:**
   - Push your changes (with Resend integration)
   - Vercel will auto-deploy

2. **Configure Cron Job:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to "Settings" → "Cron Jobs"
   - Click "Create Cron Job"
   - Configure:
     - **Path:** `/api/cron/candidate-reminders`
     - **Schedule:** `0 9 * * *` (daily at 9 AM UTC)
     - **Timezone:** UTC
   - Click "Create"

3. **Set Cron Secret (Optional but Recommended):**
   - In Vercel, go to "Settings" → "Environment Variables"
   - Add: `CRON_SECRET` = (generate a random string)
   - This prevents unauthorized access to cron endpoint

4. **Test Locally First:**
   ```bash
   curl http://localhost:3000/api/cron/candidate-reminders
   ```
   - Should return JSON with candidate check results

**✅ Done when:** Cron job shows in Vercel dashboard

---

### **STEP 7: Test Complete Flow** ⏱️ **20 minutes**

1. **Declare Candidacy:**
   - Go to `/candidate/declare`
   - Complete wizard
   - Submit

2. **Check Dashboard:**
   - Go to `/candidate/dashboard`
   - Verify Journey Progress component shows
   - Check next action is displayed
   - Verify checklist appears

3. **Trigger Welcome Email (Manual):**
   ```bash
   # Get platform ID from dashboard or database
   curl -X POST http://localhost:3000/api/candidate/journey/send-email \
     -H "Content-Type: application/json" \
     -d '{"platformId":"YOUR_PLATFORM_ID","type":"welcome"}'
   ```

4. **Verify Email Received:**
   - Check inbox
   - Verify email content
   - Test links in email

**✅ Done when:** Complete flow works end-to-end

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] Resend account created
- [ ] API key in `.env.local`
- [ ] Resend package installed
- [ ] Test email sent successfully
- [ ] Cron job configured in Vercel
- [ ] Dashboard shows journey progress
- [ ] Welcome email works
- [ ] Email links work

---

## 🐛 Troubleshooting

### **Email Not Sending:**

**Check:**
1. ✅ API key is correct in `.env.local`
2. ✅ Resend account is verified
3. ✅ Package installed: `npm list resend`
4. ✅ Check browser console for errors
5. ✅ Check Resend dashboard for send logs

**Common Fixes:**
- Restart dev server after adding env var
- Verify API key starts with `re_`
- Check spam folder

---

### **Cron Job Not Running:**

**Check:**
1. ✅ Cron job exists in Vercel dashboard
2. ✅ Path is correct: `/api/cron/candidate-reminders`
3. ✅ Schedule is correct: `0 9 * * *`
4. ✅ Deployment succeeded
5. ✅ Check Vercel logs for cron execution

**Test Locally:**
```bash
curl http://localhost:3000/api/cron/candidate-reminders
```

---

### **Journey Progress Not Showing:**

**Check:**
1. ✅ Platform exists in database
- ✅ API endpoint works: `/api/candidate/journey/progress?platformId=...`
- ✅ Browser console for errors
- ✅ User is authenticated

**Test API:**
```bash
curl "http://localhost:3000/api/candidate/journey/progress?platformId=YOUR_PLATFORM_ID"
```

---

## 📊 What Gets Sent When

### **Automatic Emails:**

1. **Welcome Email** - 24 hours after declaration
2. **Check-in Email** - 3 days of no activity
3. **Deadline Reminders:**
   - 30 days before deadline
   - 7 days before deadline
   - 1 day before deadline
4. **Verification Prompt** - 3 days after filing (if not verified)
5. **Congratulations** - After verification (manual trigger)

### **Manual Triggers:**

- Test emails via API endpoint
- Admin can trigger any email type

---

## 🎯 Next Steps After Setup

Once email system is working:

1. **Monitor:**
   - Check Resend dashboard for delivery rates
   - Monitor Vercel logs for cron job execution
   - Track email open rates

2. **Enhance:**
   - Add more email templates
   - Improve email content
   - Add unsubscribe option
   - A/B test email content

3. **Scale:**
   - Verify domain with Resend (better deliverability)
   - Set up email tracking
   - Add email analytics

---

## ✅ Success Criteria

**You'll know it's working when:**

- ✅ Test email arrives in your inbox
- ✅ Welcome email sent after declaration
- ✅ Cron job runs daily (check Vercel logs)
- ✅ Reminders sent at right time
- ✅ Email open rates > 20%
- ✅ Candidates actually file (conversion increases)

---

## 📞 Support

**If you get stuck:**

1. Check error logs in:
   - Browser console
   - Vercel logs
   - Resend dashboard

2. Test each component separately:
   - Email sending
   - API endpoints
   - Cron job

3. Verify environment variables are loaded:
   ```bash
   # In dev server, should see Resend available
   ```

---

**Once you complete these steps, the active facilitation system will be fully operational!**

---

**Last Updated:** January 30, 2025

