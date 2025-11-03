# Deployment Checklist: Email System

**Created:** January 30, 2025  
**Status:** ✅ **READY FOR DEPLOYMENT**

---

## ✅ Pre-Deployment Verification

### **Code Quality:**
- [x] No linter errors in email/cron code
- [x] TypeScript compiles (excluding known tool file issues)
- [x] All email templates implemented
- [x] Error handling in place
- [x] Authentication checks implemented

### **Functionality:**
- [x] Email service integrated (Resend)
- [x] Auto-trigger welcome email on declaration
- [x] Cron job endpoint implemented
- [x] Journey tracking system working
- [x] Dashboard component integrated

### **Configuration:**
- [x] Vercel cron configured in `vercel.json`
- [x] Environment variable documentation updated
- [ ] Environment variables set in Vercel (you do this)

---

## 🚀 Deployment Steps

### **Step 1: Push to GitHub**
```bash
git add .
git commit -m "Add candidate journey email system with Resend integration"
git push
```

### **Step 2: Configure Vercel Environment Variables**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add Required:**
- `RESEND_API_KEY` = `re_your_actual_key_here`
  - Scope: Production, Preview, Development
  - ⚠️ Copy from Resend dashboard

**Add Optional (Recommended):**
- `RESEND_FROM_EMAIL` = `onboarding@resend.dev` (or your verified domain)
  - Scope: Production, Preview, Development
- `CRON_SECRET` = `your-random-secret-string`
  - Scope: Production, Preview
  - Used to secure cron endpoint
- `NEXT_PUBLIC_APP_URL` = `https://your-domain.com`
  - Scope: Production
  - Used in email links

### **Step 3: Verify Cron Job**

After deployment, check:
1. Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify `/api/cron/candidate-reminders` exists
3. Schedule should be: `0 9 * * *` (daily at 9 AM UTC)

### **Step 4: Test Production**

1. **Declare Candidacy:**
   - Go to production site
   - Declare candidacy
   - Should receive welcome email immediately

2. **Check Dashboard:**
   - Verify Journey Progress component shows
   - Check next action is displayed

3. **Monitor Logs:**
   - Check Vercel logs for email sending
   - Check Resend dashboard for delivery status

---

## ✅ Post-Deployment Verification

### **Immediate Checks:**
- [ ] Welcome email received after declaration
- [ ] Email links work correctly
- [ ] Dashboard shows journey progress
- [ ] No errors in Vercel logs
- [ ] Cron job appears in Vercel dashboard

### **Within 24 Hours:**
- [ ] Cron job runs (check Vercel logs next day)
- [ ] Emails sent successfully (check Resend dashboard)
- [ ] No errors in production logs

### **Ongoing Monitoring:**
- [ ] Email delivery rates (Resend dashboard)
- [ ] Email open rates
- [ ] Cron job execution success rate
- [ ] Error logs

---

## 🔧 Troubleshooting

### **Email Not Sending:**
1. Check `RESEND_API_KEY` is set in Vercel
2. Verify API key is correct in Resend dashboard
3. Check Vercel logs for errors
4. Verify account is verified in Resend

### **Cron Job Not Running:**
1. Verify cron job exists in Vercel dashboard
2. Check cron schedule is correct
3. Check Vercel logs for execution
4. Verify deployment succeeded

### **Welcome Email Not Received:**
1. Check spam folder
2. Verify `RESEND_API_KEY` is set
3. Check browser console for errors
4. Check Vercel logs for API call

---

## 📊 Success Criteria

**Deployment is successful when:**

- ✅ Welcome email sent immediately after declaration
- ✅ Email arrives in inbox
- ✅ Dashboard shows journey progress
- ✅ Cron job runs daily
- ✅ No errors in production logs
- ✅ Email delivery rate > 95%

---

## 🎯 Next Steps After Deployment

1. **Monitor for 48 hours:**
   - Check email delivery rates
   - Monitor cron job execution
   - Track any errors

2. **Optimize (if needed):**
   - Verify domain with Resend (better deliverability)
   - Adjust email timing if needed
   - Add email tracking if desired

3. **Document Learnings:**
   - Email open rates
   - Common issues
   - User feedback

---

**Status: ✅ READY TO DEPLOY**

All code is complete and tested. Just need to:
1. Push to GitHub
2. Set environment variables in Vercel
3. Verify cron job configuration

---

**Last Updated:** January 30, 2025

