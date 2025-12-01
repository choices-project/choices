# Vercel Domain Configuration

**Last Updated:** November 2025  
**Status:** Production Ready

This guide explains how to configure custom domains in Vercel and set a default domain for your project.

## Setting a Default Domain in Vercel

### Step 1: Add Domain to Vercel Project

1. **Navigate to Vercel Dashboard:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project (e.g., `choices-platform`)

2. **Open Domain Settings:**
   - Click on **Settings** tab
   - Click on **Domains** in the left sidebar

3. **Add Domain:**
   - Click **Add Domain** button
   - Enter `choices-app.com`
   - Click **Add**

4. **Configure DNS:**
   - Vercel will provide DNS records to add
   - Add the required DNS records in your domain registrar (GoDaddy, etc.)
   - Common records:
     - **A Record:** `@` → Vercel IP addresses
     - **CNAME Record:** `www` → `cname.vercel-dns.com`
   - Wait for DNS propagation (can take up to 48 hours, usually < 1 hour)

### Step 2: Set as Default Domain

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Domains**
   - Find `choices-app.com` in the domain list
   - Click the **⋮** (three dots) menu next to the domain
   - Select **Set as Default Domain**

2. **Verify Default:**
   - The default domain will show a **Default** badge
   - All deployments will now use this domain as the primary URL

### Step 3: Add www Subdomain (Optional but Recommended)

1. **Add www Subdomain:**
   - Click **Add Domain**
   - Enter `www.choices-app.com`
   - Click **Add**

2. **Configure Redirect (Recommended):**
   - In domain settings, configure redirects:
     - `choices-app.com` → `www.choices-app.com` (or vice versa)
   - This ensures consistent URLs and better SEO

### Step 4: Verify Domain Status

1. **Check Domain Status:**
   - In Vercel dashboard, verify domain shows **Valid** status
   - All DNS records should be verified

2. **Test Domain:**
   ```bash
   curl -I https://choices-app.com
   # Should return 200 OK
   ```

3. **Check SSL Certificate:**
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - Certificate should be active within a few minutes
   - Verify in browser: `https://choices-app.com` should show secure lock icon

## DNS Configuration Examples

### GoDaddy DNS Configuration

1. **Log into GoDaddy:**
   - Go to [godaddy.com](https://godaddy.com)
   - Navigate to **My Products** → **DNS**

2. **Add A Records:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP - check Vercel dashboard for current IPs)
   TTL: 600
   ```

3. **Add CNAME Record:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 600
   ```

### Cloudflare DNS Configuration

1. **Log into Cloudflare:**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Select your domain

2. **Add DNS Records:**
   - **A Record:**
     - Name: `@`
     - IPv4: `76.76.21.21` (Vercel IP)
     - Proxy: Off (gray cloud)
   - **CNAME Record:**
     - Name: `www`
     - Target: `cname.vercel-dns.com`
     - Proxy: Off (gray cloud)

## Environment-Specific Domains

### Production Domain
- **Primary:** `choices-app.com`
- **Alternative:** `www.choices-app.com`
- **Vercel Default:** `choices-platform.vercel.app` (fallback)

### Staging Domain
- **Vercel Preview:** `choices-platform-staging.vercel.app`
- **Custom:** `staging.choices-app.com` (optional)

## Code Configuration

The application code has been updated to allow `choices-app.com` in origin validation:

**File:** `web/lib/http/origin.ts`

```typescript
allowedOrigins: [
  'https://choices-platform.vercel.app',
  'https://choices.app',
  'https://www.choices.app',
  'https://choices-app.com',
  'https://www.choices-app.com',
]
```

## Fixing "Invalid Configuration" Status

If your domain shows "Invalid Configuration" in Vercel:

1. **Click "Learn more" or "Edit" on the domain** to see what DNS records Vercel expects
2. **Update your DNS records** to match Vercel's requirements:
   - **For root domain (`choices-app.com`):** Use A records pointing to Vercel IPs
   - **For www subdomain:** Use CNAME pointing to `cname.vercel-dns.com`
3. **Wait for DNS propagation** (5 minutes to 48 hours, usually < 1 hour)
4. **Click "Refresh"** in Vercel dashboard to re-verify

### Common Issues:

**Issue:** Domain points to wrong IPs (e.g., AWS/CloudFront IPs instead of Vercel)
- **Solution:** Update A records to Vercel IPs (check Vercel dashboard for current IPs)

**Issue:** CNAME record missing or incorrect
- **Solution:** Ensure `www` CNAME points to `cname.vercel-dns.com`

**Issue:** DNS records not propagated yet
- **Solution:** Wait and click "Refresh" in Vercel dashboard

## Troubleshooting

### Domain Not Resolving

1. **Check DNS Propagation:**
   ```bash
   dig choices-app.com
   nslookup choices-app.com
   ```

2. **Verify DNS Records:**
   - Ensure A and CNAME records match Vercel requirements
   - Check TTL values (lower TTL = faster updates)

3. **Clear DNS Cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### SSL Certificate Issues

1. **Wait for Certificate Provisioning:**
   - Vercel automatically provisions SSL certificates
   - Can take 5-15 minutes after DNS verification

2. **Check Certificate Status:**
   - In Vercel dashboard → Domains
   - Look for SSL certificate status

3. **Force Certificate Renewal:**
   - Remove and re-add domain (last resort)
   - Vercel will automatically provision new certificate

### Domain Shows as Invalid

1. **Verify DNS Records:**
   - Ensure all required DNS records are present
   - Check that values match exactly (no trailing dots, correct IPs)

2. **Check Domain Ownership:**
   - Ensure domain is registered and active
   - Verify you have access to DNS settings

3. **Wait for Propagation:**
   - DNS changes can take up to 48 hours
   - Use DNS checker tools to verify globally

## Best Practices

1. **Use www Subdomain:**
   - Configure both `choices-app.com` and `www.choices-app.com`
   - Set up redirect from one to the other (choose one as canonical)

2. **Set Default Domain:**
   - Always set your primary domain as default in Vercel
   - This ensures consistent URLs in deployments

3. **Monitor Domain Status:**
   - Regularly check domain status in Vercel dashboard
   - Set up monitoring for domain expiration

4. **Keep DNS Records Updated:**
   - Vercel may update IP addresses
   - Check Vercel documentation for current IPs

5. **Use Environment Variables:**
   - Consider using `NEXT_PUBLIC_BASE_URL` for domain-specific configuration
   - Update in Vercel environment variables

## References

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS Configuration](https://vercel.com/docs/concepts/projects/domains/dns-records)
- [Vercel SSL Certificates](https://vercel.com/docs/concepts/projects/domains/ssl-certificates)

