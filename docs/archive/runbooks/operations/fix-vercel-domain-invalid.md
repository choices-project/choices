# Fixing "Invalid Configuration" for choices-app.com

**Issue:** Both `choices-app.com` and `www.choices-app.com` show "Invalid Configuration" in Vercel.

## Current Status

Your DNS records are currently pointing to AWS IPs instead of Vercel:
- `choices-app.com` → `13.248.243.5` and `76.223.105.230` (AWS CloudFront)
- `www.choices-app.com` → CNAME to `choices-app.com`

## Solution: Update DNS Records

### Step 1: Get Vercel DNS Records

1. In Vercel dashboard, click **"Edit"** on `choices-app.com`
2. Vercel will show you the exact DNS records needed
3. Common Vercel IPs (verify in dashboard):
   - `76.76.21.21`
   - `76.223.126.88`
   - Or use CNAME: `cname.vercel-dns.com`

### Step 2: Update DNS in Your Domain Registrar

**If using GoDaddy:**

1. Log into [GoDaddy](https://godaddy.com)
2. Go to **My Products** → **DNS** → Select `choices-app.com`
3. **Update A Records:**
   - Find existing A records for `@` (root domain)
   - **Delete** the AWS IPs (`13.248.243.5`, `76.223.105.230`)
   - **Add new A records** with Vercel IPs:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     TTL: 600
     ```
     ```
     Type: A
     Name: @
     Value: 76.223.126.88
     TTL: 600
     ```
   - **OR** use CNAME (simpler):
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     TTL: 600
     ```
4. **Update www CNAME:**
   - Find CNAME record for `www`
   - Update to:
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     TTL: 600
     ```

**If using Cloudflare:**

1. Log into [Cloudflare](https://cloudflare.com)
2. Select `choices-app.com` domain
3. Go to **DNS** → **Records**
4. **Update A Records:**
   - Delete existing A records pointing to AWS IPs
   - Add new A records:
     - Name: `@`
     - IPv4: `76.76.21.21` (or check Vercel for current IPs)
     - Proxy: **Off** (gray cloud, not orange)
   - Add second A record:
     - Name: `@`
     - IPv4: `76.223.126.88`
     - Proxy: **Off**
5. **Update www CNAME:**
   - Find `www` CNAME record
   - Update target to: `cname.vercel-dns.com`
   - Proxy: **Off**

### Step 3: Wait for DNS Propagation

1. DNS changes can take 5 minutes to 48 hours
2. Usually propagates within 1 hour
3. Check propagation:
   ```bash
   dig choices-app.com +short
   # Should show Vercel IPs, not AWS IPs
   ```

### Step 4: Refresh in Vercel

1. Go back to Vercel dashboard → **Settings** → **Domains**
2. Click **"Refresh"** button next to `choices-app.com`
3. Wait for verification (usually 1-5 minutes)
4. Status should change to **"Valid Configuration"**

### Step 5: Set as Default Domain

Once both domains show "Valid Configuration":

1. Click the **⋮** (three dots) menu next to `choices-app.com`
2. Select **"Set as Default Domain"**
3. The domain will show a **"Default"** badge

## Verification Commands

After updating DNS, verify with these commands:

```bash
# Check root domain
dig choices-app.com +short
# Should show Vercel IPs

# Check www subdomain
dig www.choices-app.com +short
# Should show cname.vercel-dns.com or Vercel IPs

# Check DNS propagation globally
# Use: https://www.whatsmydns.net/#A/choices-app.com
```

## Alternative: Use CNAME for Root Domain

Some registrars (like GoDaddy) support CNAME for root domain (ALIAS/ANAME):

1. **Delete all A records** for `@`
2. **Add CNAME record:**
   ```
   Type: CNAME (or ALIAS/ANAME)
   Name: @
   Value: cname.vercel-dns.com
   TTL: 600
   ```

This is simpler and automatically updates if Vercel changes IPs.

## Still Having Issues?

1. **Check Vercel Dashboard:**
   - Click "Edit" on the domain
   - Vercel shows exactly what records it expects
   - Compare with your DNS records

2. **Verify DNS Records Match:**
   - Use `dig` or online DNS checkers
   - Ensure no old records remain

3. **Contact Support:**
   - Vercel support can help verify DNS configuration
   - Your domain registrar support can help with DNS updates

