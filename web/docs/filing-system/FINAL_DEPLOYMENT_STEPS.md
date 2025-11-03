# Final Deployment Steps

**Created:** January 30, 2025  
**Status:** ✅ Ready to Commit & Deploy

---

## ✅ Pre-Deployment Checklist

- [x] All code complete and tested
- [x] CRON_SECRET added to Vercel
- [ ] RESEND_API_KEY added to Vercel (verify!)
- [ ] Changes committed
- [ ] Pushed/merged to main

---

## 🚀 Step-by-Step Deployment

### **Step 1: Verify Environment Variables in Vercel**

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Required:**
- ✅ `CRON_SECRET` - You added this!
- ⚠️ `RESEND_API_KEY` - **Verify this is set**
  - Scope: Production, Preview, Development
  - Get from: https://resend.com/api-keys

**Optional:**
- `RESEND_FROM_EMAIL` - Default: `onboarding@resend.dev`
- `NEXT_PUBLIC_APP_URL` - Your production URL

---

### **Step 2: Commit Changes**

```bash
# Review what will be committed
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add candidate journey email system with Resend integration

- Email service library with 7 email templates (welcome, check-in, deadline reminders, verification, congratulations)
- Auto-trigger welcome email on candidacy declaration
- Scheduled cron job for reminder emails (daily at 9 AM UTC)
- Journey tracking integration
- Comprehensive documentation and testing guides

Configuration:
- RESEND_API_KEY required in Vercel environment
- CRON_SECRET optional but recommended for cron security
- vercel.json configured for cron job (/api/cron/candidate-reminders)"
```

---

### **Step 3: Push to Main**

**Option A: Merge via Pull Request (Recommended)**
```bash
# Push feature branch
git push origin feature/nextjs-15-upgrade-clean

# Create PR on GitHub
# Review changes
# Merge to main
```

**Option B: Direct Push to Main**
```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature/nextjs-15-upgrade-clean

# Push to main (triggers deployment)
git push origin main
```

---

### **Step 4: Monitor Deployment**

**GitHub Actions:**
1. Go to: GitHub → Actions tab
2. Watch deployment workflow run:
   - Pre-deployment validation ✅
   - Build and test ✅
   - Deploy to staging ✅
   - Post-deployment checks ✅

**Vercel Dashboard:**
1. Go to: Vercel Dashboard → Your Project → Deployments
2. Watch deployment progress
3. Verify cron job appears in Settings → Cron Jobs

---

### **Step 5: Verify Deployment**

**Check Staging:**
```bash
# Test welcome email endpoint
curl "https://your-staging-url.vercel.app/api/candidate/journey/send-email?platformId=TEST_ID&type=welcome"

# Test cron endpoint (will fail without CRON_SECRET, that's expected)
curl "https://your-staging-url.vercel.app/api/cron/candidate-reminders"
```

**Verify Cron Job:**
1. Vercel Dashboard → Settings → Cron Jobs
2. Should see: `/api/cron/candidate-reminders`
3. Schedule: `0 9 * * *` (daily at 9 AM UTC)

**Test Full Flow:**
1. Go to staging site
2. Declare candidacy
3. Should receive welcome email immediately
4. Check dashboard shows journey progress

---

## ✅ Post-Deployment Verification

### **Immediate Checks:**
- [ ] Deployment succeeded in Vercel
- [ ] Cron job appears in Vercel dashboard
- [ ] No errors in Vercel logs
- [ ] GitHub Actions workflow completed

### **Within 24 Hours:**
- [ ] Cron job runs (check Vercel logs)
- [ ] Emails sent successfully (check Resend dashboard)
- [ ] No errors in production logs

### **Ongoing:**
- [ ] Monitor email delivery rates
- [ ] Monitor cron job execution
- [ ] Track email open rates
- [ ] Monitor error logs

---

## 🐛 Troubleshooting

### **Deployment Fails:**
1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Verify environment variables are set
4. Check for TypeScript/build errors

### **Cron Job Not Appearing:**
1. Verify `vercel.json` is committed
2. Check Vercel deployment succeeded
3. Wait a few minutes for sync
4. Manually check Vercel dashboard

### **Emails Not Sending:**
1. Verify `RESEND_API_KEY` is set in Vercel
2. Check Resend dashboard for errors
3. Check Vercel logs for API errors
4. Verify account is verified in Resend

---

## 📊 Success Criteria

**Deployment is successful when:**

- ✅ Code deployed to staging
- ✅ Cron job appears in Vercel dashboard
- ✅ Welcome email sent after declaration
- ✅ Dashboard shows journey progress
- ✅ No errors in logs
- ✅ GitHub Actions workflow passes

---

## 🎯 Next Steps After Deployment

1. **Monitor for 48 hours:**
   - Check email delivery rates
   - Monitor cron job execution
   - Track any errors

2. **Production Deployment (if needed):**
   - Use GitHub Actions workflow manual trigger
   - Select "production" environment
   - Verify all environment variables set

3. **Optimize (future):**
   - Verify domain with Resend (better deliverability)
   - Add email tracking
   - Monitor conversion rates

---

**You're ready! Commit and push to main to trigger deployment.** 🚀

---

**Last Updated:** January 30, 2025

