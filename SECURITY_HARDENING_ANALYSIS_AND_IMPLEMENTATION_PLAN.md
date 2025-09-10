# Security Hardening Analysis & Implementation Plan

## Executive Summary

This document analyzes a comprehensive security hardening package for the Choices web application and provides a tailored implementation plan based on the current codebase analysis.

## Current Security Status

### ✅ **Current Strengths**
- **Next.js Version**: 14.2.32 (SECURE - meets >=14.2.25 requirement)
- **Node Version**: 22.19.0 (EXCELLENT - more secure than suggested Node 20)
- **Authentication**: Supabase-based with middleware protection; server-side auth planned
- **ESLint**: Comprehensive rules with security-focused configurations
- **TypeScript**: Strict type checking enabled
- **Pre-commit Hooks**: Already implemented with security checks
- **Middleware**: Will remain best-effort only; critical authz moves to server-side

### ⚠️ **Current Vulnerabilities**
- **Middleware Bypass Risk**: Authentication relies on middleware that can be bypassed; all authz critical paths must move to route handlers or server components with Supabase SSR checks
- **Supply Chain Risk**: `postbuild` script in package.json could be exploited
- **CI Security**: No script blocking in CI environment
- **Transitive Dependencies**: No version pinning for common attack vectors
- **Missing Security Headers**: No CSP, Trusted Types, or other security headers
- **No SAST/Secrets Scanning**: Missing CodeQL and secrets detection
- **JWT/Middleware Foot-guns**: Potential client-side JWT handling and middleware-only auth gates

## JWT/Middleware Security Refinements

### **Battle-Tested Auth Architecture (No IA/PoP)**

Based on security analysis, here's the recommended approach for Supabase + Next.js/Vercel:

#### **1. Middleware = UX Only, Never AuthZ**
```typescript
// middleware.ts - Keep for redirects and performance only
export function middleware(request: NextRequest) {
  // UX: Redirect logged-out users to /login
  // Performance: Route optimization
  // NEVER: Real authorization checks
}
```

**Repository Policy**: Add to README.md:
```markdown
## Security Policy
- **Middleware is UX-only**: Never implement authorization checks in middleware
- **Real authZ happens server-side**: All critical paths use route handlers with Supabase SSR
```

#### **2. Server-Side Auth Helper (Universal)**
```typescript
// web/lib/auth.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function requireUser(req: Request) {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { 
      user: null as const, 
      fail: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    };
  }
  return { user, fail: null as any };
}
```

**Usage in any route handler with cache guards:**
```typescript
// At top of route handlers using cookies/auth
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // For handlers using pg, crypto, or service role

export async function POST(req: Request) {
  const { user, fail } = await requireUser(req);
  if (!user) return fail();
  
  // ...authorized work...
  
  return NextResponse.json(data, {
    headers: { 
      'Cache-Control': 'no-store', 
      'Vary': 'Cookie' 
    },
  });
}
```

#### **3. Safe JWT Verification (If Needed)**
```typescript
// web/lib/jwt-verify.ts
import * as jose from 'jose';

const JWKS_URL = new URL(process.env.SUPABASE_JWKS_URL!);
const JWKS = jose.createRemoteJWKSet(JWKS_URL);

export async function verifySupabaseAccessToken(token: string) {
  const { payload, protectedHeader } = await jose.jwtVerify(token, JWKS, {
    algorithms: ['RS256'], // Only asymmetric algorithms for user tokens
    issuer: process.env.SUPABASE_ISS, // e.g., https://<project>.supabase.co/auth/v1
    audience: process.env.SUPABASE_AUD ?? 'authenticated',
    maxTokenAge: '10m', // Fail fast on stale tokens
  });
  
  // Optional hardening: require email_verified, app-specific claim, etc.
  if (payload.email_verified === false) throw new Error('Email not verified');
  return payload;
}

// For service-to-service flows only (never browser)
export async function verifyServiceToken(token: string) {
  return jose.jwtVerify(token, new TextEncoder().encode(process.env.SERVICE_SECRET!), {
    algorithms: ['HS256'], // Only for internal, non-browser flows
    issuer: process.env.SERVICE_ISS,
    audience: process.env.SERVICE_AUD,
  });
}
```

#### **4. Origin & CSRF Protection**
```typescript
// web/lib/http.ts
export function requireTrustedOrigin(req: Request) {
  // Only enforce on state-changing verbs; allow preview/branch URLs
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;
  
  const origin = req.headers.get('origin') ?? new URL(req.headers.get('referer') ?? '', 'http://x').origin;
  const allowed = [
    process.env.APP_ORIGIN!,                   // prod app
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ...(process.env.VERCEL ? ['https://*.vercel.app'] : []),
  ];
  
  if (!origin || !allowed.some(p => 
    origin === p || (p.endsWith('*.vercel.app') && origin.endsWith('.vercel.app'))
  )) {
    throw new Error('Untrusted origin');
  }
}
```

#### **5. Protected Route Template**
```typescript
// web/app/api/votes/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { requireTrustedOrigin } from '@/lib/http';

export async function POST(req: Request) {
  try {
    requireTrustedOrigin(req);
    const { user, fail } = await requireUser(req);
    if (!user) return fail();

    const body = await req.json();
    // ...perform server-side validated write using RLS or service role...
    return NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

#### **6. Database RLS (The Real Gate)**
```sql
-- Example: votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns their row"
ON votes FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

#### **6. Rate Limiting & Validation**
```typescript
// web/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

export const limiter = new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(10, '1 m') 
});

export async function requireRateLimit(key: string) {
  const { success, reset } = await limiter.limit(key);
  if (!success) {
    const r = NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    r.headers.set('Retry-After', Math.max(1, Math.ceil((reset - Date.now())/1000)).toString());
    throw r;
  }
}

// Usage in handlers: await requireRateLimit(user.id || ip);
```

```typescript
// web/lib/validation.ts
import { z } from 'zod';

const VoteSchema = z.object({ 
  choiceId: z.string().uuid() 
});

// Usage in handlers:
const body = VoteSchema.parse(await req.json());
```

### **Key Security Principles**
1. **Never store JWTs client-side** - Use Supabase SSR cookies only
2. **Middleware for UX only** - All real authz in route handlers
3. **Server-side verification** - If you must verify JWTs, use `jose` with strict claims
4. **RLS everywhere** - Database is the final gate
5. **Origin validation** - Reject untrusted origins
6. **Rate limiting** - Add IP/user limits on sensitive endpoints
7. **Input validation** - Use Zod schemas for all user inputs

## Security Package Analysis

### **A) App-Level Hardening**

#### 1. CI-Only npm Config (CRITICAL - Implement)
**File**: `/web/.npmrc.ci`
```ini
ignore-scripts=true
audit=true
fund=false
update-notifier=false
save-exact=true
prefer-offline=false
engine-strict=true
```
**Status**: ✅ **HIGHLY RECOMMENDED**
**Why**: Prevents supply chain attacks in CI environment

#### 2. Package.json Overrides (HIGH PRIORITY - Implement)
**Target**: Common supply chain attack vectors
```json
{
  "overrides": {
    "strip-ansi": "7.1.2",
    "ansi-styles": "5.2.0",
    "supports-color": "8.1.1",
    "color-convert": "2.0.1",
    "color-string": "1.9.1",
    "debug": "4.4.1",
    "eslint-plugin-import/debug": "3.2.7",
    "eslint-import-resolver-node/debug": "3.2.7",
    "eslint-module-utils/debug": "3.2.7"
  }
}
```
**Status**: ✅ **RECOMMENDED**
**Why**: Prevents malicious updates to transitive dependencies

#### 3. Next.js Version Guard (CRITICAL - Implement)
**File**: `/web/scripts/check-next-sec.js`
**Status**: ✅ **CRITICAL**
**Why**: Prevents accidental downgrades to vulnerable versions
**Current Status**: Your Next.js 14.2.32 is already secure

#### 4. Husky Hooks (MODIFY - Integrate with existing)
**Status**: ⚠️ **MODIFY EXISTING**
**Why**: You already have pre-commit hooks, integrate security checks instead of duplicating

#### 5. Node Version Pin (UPDATE - Match current)
**File**: `/web/.nvmrc`
**Current**: 22.19.0
**Status**: ✅ **UPDATE TO MATCH CURRENT**
**Why**: Node 22 is more secure than suggested Node 20

#### 6. Server-Side Auth (CRITICAL - Implement)
**Status**: ✅ **CRITICAL - HIGHEST PRIORITY**
**Why**: Current middleware-based auth is vulnerable to bypass attacks

### **B) Repo-Level Automation**

#### 7. GitHub Actions CI (HIGH PRIORITY - Implement)
**Status**: ✅ **RECOMMENDED**
**Why**: Provides deterministic, secure CI pipeline

#### 8. Dependabot (MEDIUM PRIORITY - Implement)
**Status**: ✅ **RECOMMENDED**
**Why**: Keeps dependencies updated automatically

#### 9. Nginx Defense (NOT APPLICABLE)
**Status**: ❌ **NOT RECOMMENDED**
**Why**: You're on Vercel, not self-hosted

## Implementation Priority Matrix

### **IMMEDIATE (Critical - Implement This Week)**
1. **Server-Side Auth Implementation**
   - Create `/web/lib/supabaseServer.ts` (with correct cookie handling)
   - Implement protected layouts and API routes
   - Replace middleware-only auth with server-side checks

2. **CI Security Hardening**
   - Add `.npmrc.ci` file
   - Update CI scripts to use `--ignore-scripts`
   - Secure `postbuild` script with CI guard

3. **Next.js Version Guard**
   - Add `scripts/check-next-sec.js`
   - Add `semver` dev dependency
   - Integrate into CI pipeline

### **SHORT TERM (High Priority - Next 2 Weeks)**
4. **Package Overrides & Node Version**
   - Add minimal overrides for critical dependencies
   - Add Node version constraint to package.json
   - Test thoroughly to ensure no conflicts

5. **Enhanced Audit Scripts**
   - Add `audit:high` script
   - Integrate with existing pre-commit hooks

6. **GitHub Actions CI**
   - Implement secure CI workflow
   - Add OSV scanning

### **MEDIUM TERM (Medium Priority - Next Month)**
7. **SAST & Secrets Scanning**
   - Add CodeQL workflow for JS/TS
   - Add GitLeaks secret scanning
   - Configure allowlists for false positives

8. **Security Headers & CSP**
   - Implement CSP with report-only mode first
   - Add comprehensive security headers
   - Test with Supabase integration

9. **Dependabot Configuration**
   - Set up automated dependency updates
   - Configure grouping for related packages

### **LONG TERM (Low Priority - Next Quarter)**
10. **Branch Protection Rules**
    - Require PR reviews (≥1)
    - Require status checks to pass:
      - Web CI (Secure)
      - CodeQL (JS/TS)
      - GitLeaks
    - Require up-to-date branches before merge
    - (Optional) Require signed commits
    - Disable force pushes

11. **Security Status Dashboard**
    - Add security status JSON endpoint
    - Include CodeQL/Leaks pass status
    - Create team visibility into security posture

12. **Global Node Version Enforcement**
    - Add `/.npmrc` with `engine-strict=true` to enforce Node version locally
    - Prevents "works on my machine" drift between dev and CI

## Detailed Implementation Plan

### **Phase 1: Critical Security Fixes (Week 1)**

#### 1.1 Server-Side Authentication (CORRECTED)
```typescript
// /web/lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name, options) => cookieStore.set(name, '', { ...options, maxAge: 0 }),
      },
    }
  );
}
```

#### 1.2 Protected Layout Pattern (ENHANCED)
```typescript
// /web/app/(protected)/layout.tsx
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

// Prevent auth state caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  return <>{children}</>;
}
```

#### 1.3 CI Security Configuration
```ini
# /web/.npmrc.ci
ignore-scripts=true
audit=true
fund=false
update-notifier=false
save-exact=true
prefer-offline=false
engine-strict=true
```

### **Phase 2: Enhanced Security (Week 2)**

#### 2.1 Package.json Updates (ENHANCED)
```json
{
  "engines": {
    "node": ">=22.18 <23"
  },
  "scripts": {
    "ci:install": "npm ci --ignore-scripts --userconfig .npmrc.ci",
    "audit:high": "npm audit --audit-level=high",
    "check:next-security": "node scripts/check-next-sec.js",
    "ci:verify": "npm run audit:high && npm run check:next-security",
    "postbuild": "node scripts/postbuild.js",
    "postbuild:local": "node scripts/postbuild.js",
    "vercel-build": "npm run build"
  },
  "overrides": {
    "strip-ansi": "7.1.2",
    "ansi-styles": "5.2.0",
    "supports-color": "8.1.1"
  }
}
```

#### 2.1.1 Postbuild Script Security
```javascript
// /web/scripts/postbuild.js
// Hard exit in CI to prevent supply chain attacks
if (process.env.CI) process.exit(0);

// ... real work for local dev only
console.log('Running postbuild for local development...');
```

#### 2.2 Next.js Security Guard (IMPROVED)
```javascript
// /web/scripts/check-next-sec.js
#!/usr/bin/env node
const req = require('module').createRequire(process.cwd() + '/package.json');
const semver = req('semver');

let installed = null;
try {
  installed = req('next/package.json').version; // <-- actual resolved version
} catch {
  console.log('ℹ️  next not installed yet; skipping security gate.');
  process.exit(0);
}

const ok = semver.satisfies(installed, '>=14.2.25 <15 || >=15.2.3');
if (!ok) {
  console.error(`❌ Next.js ${installed} is in a known vulnerable range (middleware bypass). Require >=14.2.25 or >=15.2.3.`);
  process.exit(1);
}
console.log(`✅ Next.js ${installed} passes security gate.`);
```

**Note**: The guard checks the installed Next.js version from node_modules/next/package.json to prevent false positives from semver ranges.

### **Phase 3: SAST & Secrets Scanning (Week 3)**

#### 3.1 CodeQL (SAST) - JavaScript/TypeScript
```yaml
# /.github/workflows/codeql-js.yml
name: CodeQL (JS/TS)
on:
  push:
    paths: [ "web/**", ".github/workflows/codeql-js.yml" ]
  pull_request:
    paths: [ "web/**", ".github/workflows/codeql-js.yml" ]
  schedule:
    - cron: "0 9 * * 1" # Mondays 09:00 UTC

permissions:
  contents: read
  security-events: write

jobs:
  analyze:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
          build-mode: none

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "web-js"
```

#### 3.2 GitLeaks - Secret Scanning
```yaml
# /.github/workflows/gitleaks.yml
name: GitLeaks
on:
  push:
    paths: [ "**/*", ".github/workflows/gitleaks.yml", ".gitleaks.toml" ]
  pull_request:
    paths: [ "**/*", ".github/workflows/gitleaks.yml", ".gitleaks.toml" ]
  schedule:
    - cron: "30 9 * * 1" # Mondays

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - name: Run GitLeaks
        uses: gitleaks/gitleaks-action@v2
        with:
          args: detect --no-banner -v --redact --source . --config .gitleaks.toml
```

```toml
# /.gitleaks.toml
title = "Choices – GitLeaks rules"

[allowlist]
description = "Ignore common false positives"
paths = [
  '''^node_modules/''',
  '''^web/.next/''',
  '''^web/out/''',
  '''^web/.husky/''',
  '''^web/public/security-status\.json$''',
]
regexes = [
  '''(?i)example[_-]?secret|dummy[_-]?key|not[a]?real|placeholder''',
]
```

### **Phase 4: Security Headers & CSP (Week 4)**

#### 4.1 Next.js Security Headers (CSP & Trusted Types)
```javascript
// /web/next.config.mjs (merge with existing config)
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self'",
  "require-trusted-types-for 'script'",
].join("; ");

const securityHeadersProd = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" }
];

const nextConfig = {
  async headers() {
    const headers = process.env.CSP_REPORT_ONLY === "1"
      ? [{ key: "Content-Security-Policy-Report-Only", value: csp }]
      : securityHeadersProd;
    return [{ source: "/(.*)", headers }];
  }
};

export default nextConfig;
```

**Note**: Enable Report-Only in production first (CSP_REPORT_ONLY=1) and review violations for 1–2 deploys, then enforce. Include *.supabase.co and *.supabase.in in connect-src.

### **Phase 5: Automation & Monitoring (Week 5)**

#### 5.1 GitHub Actions CI
```yaml
# /.github/workflows/web-ci.yml
name: Web CI (Secure)
on:
  push:
    paths: [ "web/**", ".github/workflows/web-ci.yml" ]
  pull_request:
    paths: [ "web/**", ".github/workflows/web-ci.yml" ]

jobs:
  build-and-audit:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    strategy:
      matrix: { node: [ "22.x" ] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Clean workspace
        run: rm -rf node_modules

      - name: Deterministic install (scripts blocked)
        run: npm run ci:install

      - name: Security audit (fail on high/critical)
        run: npm run audit:high

      - name: Next.js security gate
        run: npm run check-next-security

      - name: Build
        run: npm run build --if-present

      - name: OSV Scan (extra signal)
        uses: google/osv-scanner-action@v1
        with:
          scan-args: |
            -r .
```

#### 3.2 Dependabot Configuration
```yaml
# /.github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/web"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 10
    allow:
      - dependency-type: "direct"
      - dependency-type: "indirect"
    groups:
      nextjs:
        patterns: [ "next", "@next/*" ]
      lint:
        patterns: [ "eslint*", "@typescript-eslint/*" ]
      testing:
        patterns: [ "jest*", "@jest/*", "@testing-library/*" ]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
```

## Risk Assessment

### **High Risk (Address Immediately)**
- **Middleware Bypass**: Current auth can be circumvented
- **Supply Chain**: Postinstall scripts in CI environment
- **Version Drift**: No protection against vulnerable Next.js versions

### **Medium Risk (Address Soon)**
- **Transitive Dependencies**: No protection against malicious updates
- **CI Security**: No script blocking in automated environments

### **Low Risk (Address When Convenient)**
- **Dependency Updates**: Manual process for security updates
- **Monitoring**: No automated vulnerability scanning

## Testing Strategy

### **Security Testing Checklist**
- [ ] Server-side auth blocks unauthorized access
- [ ] Protected routes return 401/redirect when x-middleware-subrequest header is injected (regression test)
- [ ] CI installs without executing scripts
- [ ] Version guard prevents vulnerable Next.js versions
- [ ] Package overrides don't break existing functionality
- [ ] Audit scripts catch high-severity vulnerabilities
- [ ] CodeQL detects XSS/SSRF/path traversal issues
- [ ] GitLeaks catches secrets in commits
- [ ] Headers include CSP/Trusted-Types in production
- [ ] JWT verification enforces specific algorithms (no "none")
- [ ] PostgreSQL imports are server-only (no client-side leakage)
- [ ] Dependabot creates appropriate PRs

### **Integration Testing**
- [ ] Existing functionality remains intact
- [ ] Build process completes successfully
- [ ] Pre-commit hooks work with new security checks
- [ ] CI pipeline passes all security gates
- [ ] CSP doesn't break existing functionality (test with CSP_REPORT_ONLY=1)
- [ ] Security headers don't interfere with Supabase integration
- [ ] Node version enforcement works locally and in CI
- [ ] Trusted Types don't break existing inline scripts (monitor CSP reports)

## Rollback Plan

### **If Issues Arise**
1. **Server-side Auth**: Revert to middleware-only auth temporarily
2. **Package Overrides**: Remove overrides and test individually
3. **CI Changes**: Revert to previous CI configuration
4. **Scripts**: Disable new security scripts if they cause issues

### **Monitoring**
- Watch for build failures in CI
- Monitor for authentication issues
- Check for dependency conflicts
- Verify security scan results

## Conclusion

The security hardening package addresses real vulnerabilities in the current setup. The most critical issues are:

1. **Middleware bypass vulnerability** (CRITICAL)
2. **Supply chain risks** (HIGH)
3. **Version drift protection** (HIGH)

Implementation should prioritize server-side authentication and CI security hardening, as these provide the most significant security improvements with minimal risk to existing functionality.

## Next Steps

1. **Review this analysis** with the development team
2. **Prioritize implementation** based on risk assessment
3. **Implement Phase 1** (Critical fixes) immediately
4. **Test thoroughly** before proceeding to Phase 2
5. **Monitor** for any issues during rollout

## Current Dependency Analysis

### **Production Dependencies (32 packages)**

#### **Core Framework & Runtime**
- **next**: `14.2.32` ✅ **SECURE** (meets >=14.2.25 requirement)
- **react**: `18.2.0` ✅ **CURRENT** (LTS version)
- **react-dom**: `18.2.0` ✅ **CURRENT** (matches React version)

#### **Authentication & Security**
- **@supabase/supabase-js**: `2.55.0` ✅ **CURRENT** (latest stable)
- **@supabase/ssr**: `0.6.1` ✅ **CURRENT** (latest stable)
- **@supabase/auth-ui-react**: `0.4.7` ✅ **CURRENT** (latest stable)
- **@supabase/auth-ui-shared**: `0.1.8` ✅ **CURRENT** (latest stable)
- **bcryptjs**: `3.0.2` ⚠️ **CONSIDER UPGRADE** (pure JS, slower; consider bcrypt native or argon2)
- **jsonwebtoken**: `9.0.2` ⚠️ **CONSIDER UPGRADE** (works but consider jose for modern JOSE/JOSE-KDF support)
- **speakeasy**: `2.0.0` ⚠️ **CONSIDER UPGRADE** (low maintenance velocity; consider otplib or WebAuthn)

#### **UI Components & Styling**
- **@radix-ui/react-label**: `2.1.7` ✅ **CURRENT** (latest stable)
- **@radix-ui/react-progress**: `1.1.7` ✅ **CURRENT** (latest stable)
- **@radix-ui/react-separator**: `1.1.7` ✅ **CURRENT** (latest stable)
- **@radix-ui/react-slot**: `1.2.3` ✅ **CURRENT** (latest stable)
- **@radix-ui/react-tabs**: `1.1.13` ✅ **CURRENT** (latest stable)
- **@radix-ui/react-tooltip**: `1.2.8` ✅ **CURRENT** (latest stable)
- **lucide-react**: `0.539.0` ✅ **CURRENT** (latest stable)
- **framer-motion**: `12.23.12` ✅ **CURRENT** (latest stable)
- **tailwindcss**: `3.4.17` ✅ **CURRENT** (latest stable)
- **tailwind-merge**: `3.3.1` ✅ **CURRENT** (latest stable)
- **class-variance-authority**: `0.7.1` ✅ **CURRENT** (latest stable)
- **clsx**: `2.1.1` ✅ **CURRENT** (latest stable)

#### **Data & State Management**
- **@tanstack/react-query**: `5.59.0` ✅ **CURRENT** (latest stable)
- **zustand**: `5.0.2` ✅ **CURRENT** (latest stable)
- **recharts**: `2.12.7` ✅ **CURRENT** (latest stable)

#### **Utilities & Build Tools**
- **autoprefixer**: `10.4.21` ✅ **CURRENT** (latest stable)
- **postcss**: `8.5.6` ✅ **CURRENT** (latest stable)
- **dotenv**: `17.2.1` ✅ **CURRENT** (latest stable)
- **uuid**: `11.1.0` ✅ **CURRENT** (latest stable)
- **zod**: `4.1.3` ✅ **CURRENT** (latest stable)

#### **Database & External Services**
- **pg**: `8.13.1` ✅ **CURRENT** (latest stable)
- **qrcode**: `1.5.4` ✅ **CURRENT** (latest stable)

#### **Type Definitions (Production)**
- **@types/bcryptjs**: `2.4.6` ✅ **CURRENT** (latest stable)
- **@types/jsonwebtoken**: `9.0.10` ✅ **CURRENT** (latest stable)
- **@types/qrcode**: `1.5.5` ✅ **CURRENT** (latest stable)
- **@types/speakeasy**: `2.0.10` ✅ **CURRENT** (latest stable)

### **Development Dependencies (18 packages)**

#### **Testing Framework**
- **@jest/globals**: `30.1.2` ⚠️ **VERSION MISMATCH** (Jest 30.x mixed with Jest 29.x)
- **@types/jest**: `29.5.14` ⚠️ **VERSION MISMATCH** (Jest 30.x mixed with Jest 29.x)
- **jest**: `29.7.0` ⚠️ **VERSION MISMATCH** (Jest 30.x mixed with Jest 29.x)
- **jest-environment-jsdom**: `29.7.0` ⚠️ **VERSION MISMATCH** (Jest 30.x mixed with Jest 29.x)
- **@playwright/test**: `1.55.0` ✅ **CURRENT** (latest stable)
- **@testing-library/jest-dom**: `6.8.0` ✅ **CURRENT** (latest stable)
- **@testing-library/react**: `16.3.0` ✅ **CURRENT** (latest stable)
- **@testing-library/user-event**: `14.6.1` ✅ **CURRENT** (latest stable)

#### **TypeScript & Linting**
- **typescript**: `5.7.2` ✅ **CURRENT** (latest stable)
- **@typescript-eslint/eslint-plugin**: `8.18.2` ✅ **CURRENT** (latest stable)
- **@typescript-eslint/parser**: `8.18.2` ✅ **CURRENT** (latest stable)
- **eslint**: `8.57.1` ⚠️ **DEPRECATED** (version 8.x no longer supported)
- **eslint-config-next**: `14.2.32` ✅ **CURRENT** (matches Next.js version)

#### **Type Definitions (Development)**
- **@types/node**: `22.10.2` ✅ **CURRENT** (latest stable)
- **@types/pg**: `8.11.10` ✅ **CURRENT** (latest stable)
- **@types/react**: `18.3.17` ✅ **CURRENT** (latest stable)
- **@types/react-dom**: `18.3.5` ✅ **CURRENT** (latest stable)
- **@types/uuid**: `10.0.0` ✅ **CURRENT** (latest stable)

### **Security Risk Assessment by Category**

#### **🔴 HIGH RISK (Immediate Action Required)**
- **Jest Version Mismatch**: Mixed Jest 29.x and 30.x packages - **ALIGN VERSIONS** - Choose all Jest 30.x for consistency
- **eslint**: `8.57.1` - **PLAN UPGRADE** - 9.x introduces flat config and may require updates to eslint-config-next/plugins. Keep 8.x (patched) until ecosystem alignment, then schedule the migration.

#### **🟡 MEDIUM RISK (Monitor & Update)**
- **postbuild script**: `node scripts/check-server-bundle-for-browser-globals.mjs` - **SUPPLY CHAIN RISK** - Runs in CI without protection
- **bcryptjs**: `3.0.2` - **PERFORMANCE** - Pure JS implementation, consider bcrypt native or argon2 for server-side hashing
- **jsonwebtoken**: `9.0.2` - **MODERNIZATION** - Consider jose for modern JOSE/JOSE-KDF support and WebCrypto
- **speakeasy**: `2.0.0` - **MAINTENANCE** - Low maintenance velocity, consider otplib or WebAuthn for step-up auth

#### **🟢 LOW RISK (Well Maintained)**
- All other dependencies are current and well-maintained
- No known security vulnerabilities in current versions
- Good version alignment across related packages

### **Recommended Security Overrides (Unified)**

**Note**: This is the single source of truth for overrides - use this exact set:

```json
{
  "overrides": {
    "strip-ansi": "7.1.2",
    "ansi-styles": "5.2.0",
    "supports-color": "8.1.1",
    "color-convert": "2.0.1",
    "color-string": "1.9.1",
    "debug": "4.4.1"
  }
}
```

### **Immediate Actions Required**

1. **Fix Jest version mismatch**: Align all Jest packages to 30.x for consistency
2. **Secure postbuild script**: Add CI guard to prevent execution in automated environments
3. **Add package overrides**: Implement minimal overrides for common attack vectors
4. **Add semver dependency**: Required for Next.js version guard script
5. **Add global .npmrc**: Enforce Node version locally to prevent dev/CI drift
6. **Plan ESLint upgrade**: Schedule migration to 9.x when eslint-config-next ecosystem is ready

### **Version Pinning Strategy (Stability Tiers)**

| Tier | What | Pinning Strategy | Update Cadence |
|------|------|------------------|----------------|
| **T0 - Security-critical** | Next.js, React, Supabase, Node | Exact pins in package.json (no ^), guard + CI | Weekly Dependabot; auto-merge patch only after tests |
| **T1 - High-velocity infra** | Radix, Framer-motion, React-Query, Zustand, Tailwind, Lucide | Exact pins; allow Renovate/Dependabot to propose minor in grouped PRs | Weekly |
| **T2 - Tooling** | Jest, Playwright, ESLint, TS, @ts-eslint | Exact pins; schedule upgrades when ecosystems align | Bi-weekly |
| **T3 - Low-risk utilities** | uuid, zod, qrcode, clsx, cva | Exact pins; allow patch/minor grouped PRs | Weekly |

### **Dependency Monitoring Strategy**

1. **Weekly Dependabot updates** for all dependencies
2. **Monthly security audit** with `npm audit --audit-level=high`
3. **Quarterly major version reviews** for breaking changes
4. **Immediate updates** for any security advisories
5. **Commit lockfile** and always use `npm ci` in CI for determinism
6. **Auto-merge patches** only after tests pass; require review for minor/major updates

## Drop-in Security Enhancements

### **A) Global Node Version Enforcement**
```ini
# /.npmrc (repo root)
engine-strict=true
save-exact=true
```
**Purpose**: Enforces Node version locally and exact version pinning to prevent "works on my machine" drift between dev and CI.

### **B) NPM Toolchain Pinning**
```bash
# Pin the npm toolchain in package.json
cd web
npm pkg set packageManager="npm@$(npm -v)"
```
**Purpose**: Locks the lockfile semantics to your npm version for deterministic builds.

### **C) Enhanced Dependabot Configuration**
```yaml
# /.github/dependabot.yml (excerpt)
updates:
  - package-ecosystem: npm
    directory: /web
    schedule: { interval: weekly }
    groups:
      framework:
        patterns: [ "next", "@next/*", "react", "react-dom" ]
      supabase:
        patterns: [ "@supabase/*" ]
      ui:
        patterns: [ "framer-motion", "lucide-react", "@radix-ui/*", "tailwindcss", "class-variance-authority", "clsx" ]
      testing:
        patterns: [ "jest*", "@jest/*", "@testing-library/*", "@playwright/*" ]
      lint:
        patterns: [ "eslint*", "@typescript-eslint/*", "typescript" ]
```
**Purpose**: Groups related packages for easier review and reduces PR noise.

### **D) Jest Version Alignment**
```bash
# Fix Jest version mismatch - align all to Jest 30.x
npm install --save-dev jest@30.1.2 @jest/globals@30.1.2 @types/jest@30.1.2 jest-environment-jsdom@30.1.2
```
**Purpose**: Eliminates version conflicts and ensures consistent testing behavior.

### **E) Enhanced Playwright Security Regression Tests**
```typescript
// /web/tests/security.middleware-bypass.spec.ts
import { test, expect } from '@playwright/test';

test('server still blocks if x-middleware-subrequest is forged', async ({ request }) => {
  const res = await request.post('/api/votes', {
    headers: { 'x-middleware-subrequest': '1' },
    data: {}
  });
  expect([401, 403, 302, 307]).toContain(res.status());
});

test('protected route blocks when x-middleware-subrequest header is injected', async ({ request }) => {
  const res = await request.get('/api/protected', {
    headers: { 'x-middleware-subrequest': '1' }
  });
  expect([401, 302, 307]).toContain(res.status()); // unauthorized or redirected to login
});

test('origin validation blocks untrusted origins', async ({ request }) => {
  const res = await request.post('/api/votes', {
    headers: { 'origin': 'https://malicious-site.com' },
    data: {}
  });
  expect([403, 401]).toContain(res.status());
});
```
**Purpose**: Proves server-side gates block access even if someone forges the bypass header and validates origin protection.

### **F) JWT Security Enhancement**
```javascript
// In your JWT verification code
jwt.verify(token, SECRET, { algorithms: ['HS256','RS256'] })
```
**Purpose**: Enforces specific algorithms and disallows "none" algorithm attacks.

### **G) PostgreSQL Server-Only Import Pattern**
```javascript
// In route handlers/server components only
const { Pool } = await import('pg')
```
**Purpose**: Ensures PostgreSQL is never statically imported in client code.

### **H) Nginx Mitigation Note**
**Status**: Not applicable (Vercel deployment)
**Mitigation**: Server-side checks in route handlers are the primary defense against middleware bypass attacks on Vercel.

## Current GitHub Workflows Analysis

### **Existing Workflows**

#### **1. CI Workflow (`.github/workflows/ci.yml`)**
- **Triggers**: Push to main, PRs to main
- **Node Version**: 22 (✅ matches your .nvmrc)
- **Current Issues**:
  - Uses `npm ci` (✅ good)
  - No script blocking (❌ security risk)
  - No security audits (❌ missing)
  - No Next.js version guard (❌ missing)
  - Environment variable naming inconsistency (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vs `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

#### **2. Security Watch Workflow (`.github/workflows/security-watch.yml`)**
- **Triggers**: Daily cron, manual dispatch, PRs
- **Current Features**:
  - Daily security audits (✅ good)
  - Fails on high/critical vulnerabilities (✅ good)
  - Dependency review disabled for private repo (⚠️ expected)
- **Missing Features**:
  - No CodeQL integration
  - No GitLeaks secret scanning
  - No OSV scanning

#### **3. Date Mandate Workflow (`.github/workflows/date-mandate.yml`)**
- **Purpose**: Validates documentation dates in PRs
- **Status**: ✅ Working correctly, no security concerns

### **Workflow Security Gaps**
1. **No script blocking in CI** - Major supply chain risk
2. **No Next.js version guard** - Could allow vulnerable versions
3. **No SAST/Secrets scanning** - Missing CodeQL and GitLeaks
4. **Environment variable inconsistency** - Could cause deployment issues

### **Enhanced Security Headers (Two CSP Profiles)**
```javascript
// web/next.config.mjs
const isDev = process.env.NODE_ENV === 'development';

// Production CSP (tight)
const prodCSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self'",
  "require-trusted-types-for 'script'"
].join('; ');

// Development CSP (looser for React devtools/HMR)
const devCSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "require-trusted-types-for 'script'"
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: isDev ? devCSP : prodCSP
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains' // Start without preload
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  },
  {
    key: 'Origin-Agent-Cluster',
    value: '?1'
  }
];

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### **Enhanced CI Workflow (Recommended)**
```yaml
# /.github/workflows/web-ci.yml (replace existing ci.yml)
name: Web CI (Secure)
on:
  push:
    paths: [ "web/**", ".github/workflows/web-ci.yml" ]
  pull_request:
    paths: [ "web/**", ".github/workflows/web-ci.yml" ]

jobs:
  build-and-audit:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    strategy:
      matrix: { node: [ "22.x" ] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Clean workspace
        run: rm -rf node_modules

      - name: Deterministic install (scripts blocked)
        run: npm run ci:install

      - name: Debug Next.js version
        run: node -e "console.log('Next.js version:', require('next/package.json').version)"

      - name: Next.js security gate
        run: npm run check:next-security

      - name: Security audit (fail on high/critical)
        run: npm run audit:high

      - name: Server-only import test
        run: |
          echo "Checking for client-side PostgreSQL imports..."
          if grep -r "import.*pg" app/ components/ --include="*.ts" --include="*.tsx" | grep -v "await import"; then
            echo "::error::PostgreSQL imports found in client code"
            exit 1
          fi
          echo "✅ No client-side PostgreSQL imports found"

      - name: Build
        run: npm run build --if-present

      - name: OSV Scan (extra signal)
        uses: google/osv-scanner-action@v1
        with:
          scan-args: |
            -r .
```

## "Make It So" Command Block

**Safe to run** - This brings your repo to a consistent, locked, auditable state:

```bash
# from repo root
set -euo pipefail

# 1) Local discipline so dev == CI
printf "engine-strict=true\nsave-exact=true\n" > .npmrc

# 2) Web workspace hardening
cd web

# Pin npm toolchain used to create the lockfile
npm pkg set packageManager="npm@$(npm -v)"

# Engines + CI install script are already in your doc, but ensure they're set
npm pkg set engines.node=">=22.18 <23"
npm pkg set scripts.ci:install="npm ci --ignore-scripts --userconfig .npmrc.ci"
npm pkg set scripts.audit:high="npm audit --audit-level=high"
npm pkg set scripts.check:next-security="node scripts/check-next-sec.js"
npm pkg set scripts.ci:verify="npm run audit:high && npm run check:next-security"

# 3) Unify overrides to the full set (one source of truth)
npm pkg set overrides.strip-ansi="7.1.2"
npm pkg set overrides.ansi-styles="5.2.0"
npm pkg set overrides.supports-color="8.1.1"
npm pkg set overrides.color-convert="2.0.1"
npm pkg set overrides.color-string="1.9.1"
npm pkg set overrides.debug="4.4.1"

# 4) Align Jest to a single major (30.x)
npm i -D jest@30.1.2 @jest/globals@30.1.2 @types/jest@30.1.2 jest-environment-jsdom@30.1.2

# 5) Ensure a lockfile exists before ci (handles your previous npm ci error)
test -f package-lock.json || npm i --package-lock-only

# 6) Deterministic, script-free install + security checks
npm run ci:install
npm run ci:verify

# 7) Optional: quick duplicate dedupe (debug/ansi families)
npm dedupe || true
```

## Refined Security Recommendations Summary

### **✅ What to Implement Now (High Impact, Low Risk)**

1. **Run the "Make It So" command block** - Fixes all version and configuration issues
2. **Implement server-side auth architecture** - Use the `requireUser` helper in all route handlers
3. **Add enhanced security headers** - HSTS, CSP, and comprehensive protection
4. **Replace CI workflow** - Use the enhanced secure version with script blocking
5. **Add CodeQL and GitLeaks workflows** - Complete SAST/secrets scanning coverage

### **🔧 Key Architectural Changes**

1. **Middleware = UX Only** - Never use for real authorization
2. **Server-side auth everywhere** - All critical paths use `requireUser` helper
3. **Origin validation** - Reject untrusted origins on state-changing routes
4. **RLS as final gate** - Database policies are the ultimate security layer
5. **No client-side JWTs** - Use Supabase SSR cookies only

### **🚀 Implementation Priority**

1. **Immediate**: Run "Make It So" command block
2. **Short-term**: Implement server-side auth helpers and enhanced CI
3. **Medium-term**: Add CodeQL, GitLeaks, and enhanced security headers
4. **Long-term**: Consider JWT modernization and ESLint 9 migration

## Reviewer-Friendly Summary

### **Security Architecture Overview**

- **Real authZ is only in server handlers/components** using Supabase SSR cookies
- **Middleware is UX only** - redirects and performance, never authorization
- **User tokens are verified** (when needed) with JWKS and strict alg/issuer/audience; no client-side JWT storage
- **RLS default deny**; privileged paths require Node runtime + server-only service role
- **CSRF is handled** by Origin/Referer checks on state-changing verbs (+ optional double-submit token)
- **Responses with user data** use `Cache-Control: no-store` and `Vary: Cookie`
- **CI installs with `--ignore-scripts`**, runs audits, Next version gate, CodeQL & GitLeaks
- **Versions are exact-pinned**; Dependabot groups upgrades; overrides are minimal and unified

### **Key Security Patterns**

1. **Cache Guards**: All auth routes use `dynamic = 'force-dynamic'`, `revalidate = 0`
2. **Runtime Isolation**: Handlers using pg/crypto/service role use `runtime = 'nodejs'`
3. **JWT Separation**: RS256 for user tokens (JWKS), HS256 only for service-to-service
4. **Origin Validation**: Method-gated, supports Vercel preview URLs
5. **Rate Limiting**: Upstash/Vercel KV with sliding window
6. **Input Validation**: Zod schemas for all user inputs
7. **CSP Profiles**: Tight production, looser development for HMR

## Future Modernization Opportunities

### **Optional Security Upgrades (Queued for Later)**

#### **JWT Modernization**
- **Current**: `jsonwebtoken@9.0.2`
- **Target**: `jose` (modern JOSE/JOSE-KDF support, WebCrypto, clearer APIs)
- **Benefits**: Better algorithm handling, WebCrypto integration, avoids jsonwebtoken pitfalls
- **Timeline**: When convenient, not urgent

#### **TOTP/HOTP Modernization**
- **Current**: `speakeasy@2.0.0`
- **Target**: `otplib` or WebAuthn with passkeys
- **Benefits**: Better maintenance velocity, or eliminate OTP secrets entirely with passkeys
- **Timeline**: Consider during next auth enhancement cycle

#### **Password Hashing Enhancement**
- **Current**: `bcryptjs@3.0.2` (pure JS)
- **Target**: `bcrypt` (native) or `argon2` or `crypto.scrypt`
- **Benefits**: Better performance for server-side hashing
- **Timeline**: If doing server-side credential handling

#### **ESLint 9 Migration**
- **Current**: `eslint@8.57.1`
- **Target**: `eslint@9.x` with flat config
- **Benefits**: Modern configuration, better performance
- **Timeline**: When eslint-config-next ecosystem is ready

---

*This document should be updated as implementation progresses and new security considerations arise.*
