# Quick Test Guide: Email System

**Status:** ✅ **READY TO TEST**

---

## ✅ Pre-Flight Check

**All systems ready:**
- ✅ Resend package installed
- ✅ RESEND_API_KEY configured in .env.local
- ✅ Email service code integrated
- ✅ API endpoints created
- ✅ Cron job configured

---

## 🚀 Quick Test (5 minutes)

### **Step 1: Start Dev Server**
```bash
cd web
npm run dev
```

### **Step 2: Get a Platform ID**

**Option A: Use existing platform**
- Go to `/candidate/dashboard`
- Get platform ID from URL or browser console

**Option B: Create new platform**
- Go to `/candidate/declare`
- Complete wizard
- Note the platform ID from dashboard

### **Step 3: Test Welcome Email**
```bash
# Replace YOUR_PLATFORM_ID with actual ID
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_PLATFORM_ID&type=welcome"
```

**Expected:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailType": "welcome"
}
```

**Check your inbox!** 📧

---

## 🧪 Full Test Suite

### **Test All Email Types:**
```bash
PLATFORM_ID="your-platform-id-here"

curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=welcome"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=check_in"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=deadline_30"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=deadline_7"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=deadline_1"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=verification_prompt"
curl "http://localhost:3000/api/candidate/journey/send-email?platformId=$PLATFORM_ID&type=congratulations"
```

### **Test Cron Job:**
```bash
curl http://localhost:3000/api/cron/candidate-reminders
```

**Expected:**
```json
{
  "success": true,
  "message": "Processed X candidates",
  "checked": X,
  "sent": X,
  "skipped": X,
  "errors": 0,
  "details": [...]
}
```

---

## ✅ Success Indicators

**You'll know it's working when:**

- ✅ Test email arrives in your inbox
- ✅ Email has correct styling and content
- ✅ Links in email work correctly
- ✅ API returns success status
- ✅ Cron job endpoint responds
- ✅ No errors in server logs

---

## 🐛 Troubleshooting

### **Email not arriving?**
1. Check spam folder
2. Check Resend dashboard for logs
3. Verify API key is correct
4. Check server console for errors

### **API error?**
1. Verify platform ID is correct
2. Check you're logged in
3. Check server logs
4. Verify database connection

---

## 📊 Next Steps

After testing:

1. **Deploy to Production:**
   - Push changes to GitHub
   - Add `RESEND_API_KEY` to Vercel env vars
   - Verify cron job in Vercel dashboard

2. **Monitor:**
   - Check Resend dashboard for delivery rates
   - Monitor Vercel logs for cron execution
   - Track email open rates

3. **Verify in Production:**
   - Test email in production
   - Verify cron job runs daily
   - Monitor for issues

---

**You're all set! 🎉**

