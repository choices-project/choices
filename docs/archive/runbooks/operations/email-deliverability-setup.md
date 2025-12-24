# Email Deliverability Setup Guide

**Last Updated:** November 2025  
**Status:** Production Ready

This guide covers email deliverability configuration for the Choices platform using Resend, including SPF, DKIM, and DMARC setup.

## Overview

Email deliverability depends on proper DNS configuration and authentication. This guide covers:

1. **SPF (Sender Policy Framework)** - Authorizes sending servers
2. **DKIM (DomainKeys Identified Mail)** - Cryptographically signs emails
3. **DMARC (Domain-based Message Authentication, Reporting & Conformance)** - Policy enforcement and reporting

## Prerequisites

- Domain DNS access (ability to add TXT records)
- Resend account with domain verification
- Access to Vercel environment variables

## Step 1: Domain Verification in Resend

1. Log into [Resend Dashboard](https://resend.com/domains)
2. Add your domain (e.g., `choices.vote`)
3. Resend will provide DNS records to add:
   - **SPF record** (TXT)
   - **DKIM records** (TXT, multiple)
   - **DMARC record** (TXT, optional but recommended)

## Step 2: DNS Configuration

**IMPORTANT:** These DNS records must be added in your **domain registrar or DNS provider** (e.g., Cloudflare, GoDaddy, Namecheap, Route 53), NOT in Resend. Resend only shows you what records to add.

### Where to Add DNS Records

**You add these records in your domain registrar/DNS provider, NOT in Resend.**

Resend just shows you what records to add. You need to:
1. Log into wherever you manage DNS for `choices-app.com` (where you bought the domain)
2. Add each record exactly as shown in Resend's interface
3. Save the changes
4. Come back to Resend and click "I've added the records"

### Step-by-Step for Common Providers

#### Cloudflare
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (`choices-app.com`)
3. Click **DNS** → **Records**
4. Click **Add record**
5. For each record from Resend:
   - **Type:** Select the type (TXT, MX, etc.)
   - **Name:** Enter the name (e.g., `resend._domainkey`, `send`, `_dmarc`)
   - **Content:** Paste the full value from Resend
   - **TTL:** Auto (or 3600)
   - Click **Save**
6. Repeat for all records shown in Resend

#### GoDaddy
1. Log into [GoDaddy](https://www.godaddy.com)
2. Go to **My Products** → **DNS** (next to your domain)
3. Scroll to **Records** section
4. Click **Add** for each record
5. Fill in:
   - **Type:** Select from dropdown
   - **Name:** Enter the name
   - **Value:** Paste the content from Resend
   - **TTL:** 1 hour (or 3600)
6. Click **Save**

#### Namecheap
1. Log into [Namecheap](https://www.namecheap.com)
2. Go to **Domain List** → Click **Manage** next to your domain
3. Click **Advanced DNS** tab
4. Click **Add New Record**
5. Fill in the fields from Resend
6. Click the checkmark to save

#### AWS Route 53
1. Log into [AWS Console](https://console.aws.amazon.com)
2. Go to **Route 53** → **Hosted zones**
3. Select your domain
4. Click **Create record**
5. Fill in the record details from Resend
6. Click **Create records**

#### Google Domains
1. Log into [Google Domains](https://domains.google.com)
2. Click your domain → **DNS**
3. Scroll to **Custom resource records**
4. Click **Manage custom records**
5. Add each record from Resend
6. Click **Save**

### SPF Record

Add a TXT record at your domain root:

```
Type: TXT
Name: @ (or your domain)
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

**Explanation:**
- `v=spf1` - SPF version 1
- `include:resend.com` - Authorizes Resend's sending servers
- `~all` - Soft fail for other senders (use `-all` for hard fail in production)

### DKIM Records

Resend provides multiple DKIM records. Add all of them as TXT records:

```
Type: TXT
Name: [selector]._domainkey (provided by Resend)
Value: [public key provided by Resend]
TTL: 3600
```

**Example:**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

### DMARC Record (Recommended)

Add a DMARC policy record:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com; ruf=mailto:dmarc-forensics@yourdomain.com; pct=100
TTL: 3600
```

**Policy Options:**
- `p=none` - Monitor only (recommended for initial setup)
- `p=quarantine` - Send failed emails to spam
- `p=reject` - Reject failed emails (use after monitoring)

**Reporting:**
- `rua=mailto:...` - Aggregate reports (daily summaries)
- `ruf=mailto:...` - Forensic reports (individual failures)

**Example (Production-Ready):**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@choices.vote; pct=100; sp=quarantine; aspf=r; adkim=r
```

## Step 3: Verify DNS Records

After adding DNS records, verify them:

1. **SPF Check:**
   ```bash
   dig TXT yourdomain.com | grep spf
   ```

2. **DKIM Check:**
   ```bash
   dig TXT resend._domainkey.yourdomain.com
   ```

3. **DMARC Check:**
   ```bash
   dig TXT _dmarc.yourdomain.com
   ```

4. **Online Tools:**
   - [MXToolbox SPF Check](https://mxtoolbox.com/spf.aspx)
   - [DKIM Validator](https://dkimvalidator.com/)
   - [DMARC Analyzer](https://dmarcian.com/dmarc-xml-parser/)

## Step 4: Resend Domain Verification

1. Return to Resend dashboard
2. Click "Verify Domain"
3. Resend will check DNS records
4. Wait for verification (can take up to 48 hours, usually < 1 hour)

**✅ Verification Complete:** Once verified, you can use your domain for sending emails.

## Step 5: Configure Environment Variables

Add to Vercel environment variables:

```bash
RESEND_API_KEY=re_...                    # Already configured
RESEND_FROM_EMAIL=noreply@yourdomain.com # Use verified domain
RESEND_WEBHOOK_SECRET=...                 # From Resend webhook settings
```

### Getting RESEND_WEBHOOK_SECRET

1. Go to Resend Dashboard → Webhooks
2. Create or edit webhook endpoint: `https://yourdomain.com/api/webhooks/resend`
3. Copy the webhook signing secret
4. Add to environment variables

## Step 6: Test Email Delivery

### Test Across Major Providers

Send test emails to:
- Gmail (gmail.com)
- Outlook (outlook.com, hotmail.com)
- Yahoo (yahoo.com)
- Apple Mail (icloud.com)

**Check:**
- Email arrives in inbox (not spam)
- SPF/DKIM pass in email headers
- No authentication warnings

### Check Email Headers

In Gmail:
1. Open email
2. Click "Show original" (three dots menu)
3. Look for:
   - `SPF: PASS`
   - `DKIM: PASS`
   - `DMARC: PASS`

## Step 7: Monitor DMARC Reports

DMARC reports are sent daily to the email address in your `rua` field.

**Report Contents:**
- Sending sources
- Authentication results (SPF/DKIM)
- Failure reasons
- Volume statistics

**Tools for Analysis:**
- [DMARC Analyzer](https://dmarcian.com/dmarc-xml-parser/)
- [Postmark DMARC Reports](https://postmarkapp.com/dmarc)

## Step 8: Handle Bounces and Complaints

The webhook handler (`/api/webhooks/resend`) automatically handles bounces and complaints:

1. **Bounces:**
   - ✅ Logs bounce events to `platform_analytics`
   - ✅ Categorizes as hard/soft bounce
   - ✅ **Hard bounces:** Immediately marks email as invalid in `user_privacy_preferences`
   - ✅ **Soft bounces:** Tracks bounce count, invalidates after 3 soft bounces
   - ✅ Updates `email_status` and `email_bounce_count` fields

2. **Complaints (Spam Reports):**
   - ✅ Logs complaint events to `platform_analytics`
   - ✅ Immediately unsubscribes user from all marketing and contact emails
   - ✅ Disables email notifications in `user_notification_preferences`
   - ✅ Sets `email_status` to `'complained'`

**Implementation Details:**
- Webhook signature verification is implemented using `RESEND_WEBHOOK_SECRET`
- All events are logged for analytics and monitoring
- User preferences are automatically updated to prevent future emails to invalid/complained addresses

**Monitoring:**
- Check `platform_analytics` table for `email_bounce` and `email_complaint` events
- Monitor bounce/complaint rates via analytics dashboard
- Set up alerts for high bounce/complaint rates (recommended: >5% bounce rate)

## Troubleshooting

### Emails Going to Spam

1. **Check SPF/DKIM/DMARC:**
   - Verify DNS records are correct
   - Wait for DNS propagation (up to 48 hours)
   - Use online validators

2. **Check Sender Reputation:**
   - Use [Sender Score](https://www.senderscore.org/)
   - Check [Google Postmaster Tools](https://postmaster.google.com/)

3. **Content Issues:**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use plain text alternative

### Webhook Signature Verification Failing

1. Verify `RESEND_WEBHOOK_SECRET` is set correctly
2. Check webhook URL matches Resend configuration
3. Ensure raw body is used for signature verification (not parsed JSON)

### DNS Propagation Delays

- TXT records can take 24-48 hours to propagate globally
- Use `dig` or online tools to check specific DNS servers
- Wait for verification before sending production emails

## Production Checklist

- [ ] Domain verified in Resend
- [ ] SPF record added and verified
- [ ] DKIM records added and verified
- [ ] **DMARC record added** (start with `p=none`, move to `p=quarantine` after monitoring)
- [ ] `RESEND_WEBHOOK_SECRET` configured in environment variables
- [ ] `RESEND_FROM_EMAIL` uses verified domain
- [ ] Webhook endpoint configured in Resend: `https://yourdomain.com/api/webhooks/resend`
- [ ] Test emails delivered to major providers (Gmail, Outlook, Yahoo)
- [ ] Webhook handler tested (send test bounce/complaint events via Resend dashboard)
- [ ] DMARC reports being received at configured email address
- [ ] Monitoring/alerting configured for bounce rates (recommended: alert if >5%)
- [ ] Bounce and complaint handling verified (check `user_privacy_preferences` table after test events)

**DMARC Policy Status:**
- ✅ Webhook signature verification implemented in code
- ⚠️ **Action Required:** Configure DMARC DNS record (see Step 2)
- ⚠️ **Action Required:** Set up email address to receive DMARC reports (`rua` field)

## References

- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction)
- [SPF Record Syntax](https://www.openspf.org/SPF_Record_Syntax)
- [DKIM Overview](https://dkim.org/)
- [DMARC Guide](https://dmarc.org/wiki/FAQ)

