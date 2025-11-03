# Testing Email System

**Created:** January 30, 2025  
**Status:** ✅ **READY FOR TESTING**

---

## ✅ Pre-Test Checklist

Before testing, verify:

- [x] Resend package installed (`npm install resend`)
- [ ] `RESEND_API_KEY` in `.env.local`
- [ ] Dev server can start
- [ ] You have a candidate platform ID (or can create one)

---

## 🧪 Test 1: Email Service Module

**Test:** Verify email service loads and generates templates

```bash
# Run test script
cd web
node scripts/test-email-system.js
```

**Expected:** All checks pass ✅

---

## 🧪 Test 2: Email Template Generation

**Test:** Verify email templates generate HTML

**Method:** Unit test or manual check

**Expected:** All 7 email types generate valid HTML
- ✅ welcome
- ✅ check_in
- ✅ deadline_30
- ✅ deadline_7
- ✅ deadline_1
- ✅ verification_prompt
- ✅ congratulations

---

## 🧪 Test 3: Email API Endpoint

**Prerequisites:**
1. Start dev server: `npm run dev`
2. Be logged in
3. Have declared candidacy (get platform ID)

**Test Command:**
```bash
# Replace YOUR_PLATFORM_ID with actual ID
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_PLATFORM_ID&type=welcome"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailType": "welcome"
}
```

**Check:**
- ✅ API returns success
- ✅ Email arrives in inbox
- ✅ Email content is correct
- ✅ Links work

---

## 🧪 Test 4: Email Types

Test each email type:

```bash
# Welcome email
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=welcome"

# Check-in email
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=check_in"

# Deadline reminders
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=deadline_30"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=deadline_7"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=deadline_1"

# Verification prompt
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=verification_prompt"

# Congratulations
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=ID&type=congratulations"
```

**Expected:** All emails send successfully and arrive in inbox

---

## 🧪 Test 5: Cron Job Endpoint

**Test:** Verify cron job endpoint works

```bash
# Local test (will fail auth if CRON_SECRET is set, but should work without)
curl http://localhost:3000/api/cron/candidate-reminders
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Processed X candidates",
  "checked": X,
  "sent": X,
  "skipped": X,
  "errors": 0
}
```

**Check:**
- ✅ Endpoint responds
- ✅ Checks candidates correctly
- ✅ Sends emails to those who need reminders
- ✅ Skips those who don't need reminders

---

## 🧪 Test 6: Complete Journey Flow

**Test:** End-to-end journey with email reminders

**Steps:**

1. **Declare Candidacy:**
   - Go to `/candidate/declare`
   - Complete wizard
   - Submit

2. **Check Dashboard:**
   - Go to `/candidate/dashboard`
   - Verify Journey Progress component shows
   - Check next action is displayed
   - Verify checklist appears

3. **Trigger Welcome Email:**
   ```bash
   curl "http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_ID&type=welcome"
   ```

4. **Verify Email:**
   - Check inbox
   - Verify content
   - Test links

5. **Simulate Journey:**
   - Update platform status to trigger different stages
   - Test different email types
   - Verify reminders at right times

---

## 🐛 Troubleshooting

### **Email Not Sending:**

**Check:**
1. ✅ `RESEND_API_KEY` in `.env.local`
2. ✅ Restart dev server after adding env var
3. ✅ API key is correct (starts with `re_`)
4. ✅ Resend account is verified
5. ✅ Check Resend dashboard for send logs

**Common Issues:**
- API key not loaded: Restart dev server
- Invalid API key: Check Resend dashboard
- Account not verified: Verify email in Resend

---

### **Cron Job Not Working:**

**Check:**
1. ✅ Endpoint exists: `/api/cron/candidate-reminders`
2. ✅ Vercel cron configured in `vercel.json`
3. ✅ `CRON_SECRET` set if using authorization
4. ✅ Deployment succeeded

**Test Locally:**
```bash
curl http://localhost:3000/api/cron/candidate-reminders
```

---

### **API Errors:**

**Check:**
1. ✅ Platform ID is correct
2. ✅ User is authenticated (for manual sends)
3. ✅ Platform exists in database
4. ✅ User email exists in `user_profiles`

**Debug:**
- Check browser console
- Check server logs
- Check Resend dashboard for errors

---

## ✅ Success Criteria

**System is working when:**

- ✅ Test email arrives in inbox
- ✅ All 7 email types send successfully
- ✅ Email content is correct
- ✅ Links in emails work
- ✅ Cron job endpoint responds
- ✅ Cron job sends reminders correctly
- ✅ Complete journey flow works

---

## 📊 What to Monitor

**After Testing:**

1. **Email Delivery:**
   - Check Resend dashboard for delivery rates
   - Monitor bounce rates
   - Track open rates

2. **Cron Job:**
   - Check Vercel logs for execution
   - Monitor errors
   - Verify schedule

3. **User Experience:**
   - Test complete journey
   - Verify emails help users
   - Check dashboard updates

---

**Last Updated:** January 30, 2025

