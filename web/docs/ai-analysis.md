Awesome — I can see the repo now and did a quick pass. High-level: you’ve got a standard monorepo with a web/ Next app and lots of docs at the root. The repo is public, has an MIT license, and even advertises the Vercel deployment URL in the header. That’s all ✅ for contributor accessibility. 
GitHub

Below is a focused, repo-specific plan to unblock SSR + Vercel and cleanly handle Next 15’s async cookies() while keeping Supabase SSR safe. I’m giving you surgical diffs you can drop in today.

1) Fix the Next 15 cookies() breaking changes (root cause of many SSR errors)

In Next 15, cookies(), headers() and draftMode() are async and must be awaited. That also means any file calling them is dynamic. Call them only inside a request scope (Server Component, Route Handler, or Server Action), and never at module top-level. 
Next.js
+3
Next.js
+3
Next.js
+3

Do this in every page/route that touches cookies:
// ✅ Top of files that use cookies() or Supabase SSR on the server
export const dynamic = 'force-dynamic';   // opt out of static generation for this route
export const runtime = 'nodejs';          // ensure Node runtime (not Edge) for Supabase SSR

Read cookies correctly
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()        // ✅ Next 15: await required
  const theme = cookieStore.get('theme')?.value
  return <div>theme: {theme ?? 'default'}</div>
}


Docs confirm the async contract; using it synchronously (or touching in static generation) causes the exact warnings you reported. 
Next.js
+1

2) Harden Supabase SSR usage (split clients + avoid leaking browser code on server)

Use @supabase/ssr only on the server, and the browser client separately. Supabase’s current Next quickstarts show the awaited cookies() pattern and a safe cookie bridge that’s read-only in Server Components and read/write in Route Handlers. 
Supabase
+1

web/utils/supabase/server-rsc.ts (Server Component safe: read-only)
// web/utils/supabase/server-rsc.ts
import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function getSupabaseServerRSC() {
  const store = await cookies()
  // RSC: reads OK; writes are ignored
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        // no-ops in RSC to avoid "can only modify cookies in actions/route handlers"
        set(_name: string, _value: string, _opts: CookieOptions) {},
        remove(_name: string, _opts: CookieOptions) {},
      },
    },
  )
}

web/utils/supabase/server-route.ts (Route Handlers/Server Actions: read/write)
// web/utils/supabase/server-route.ts
import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function getSupabaseServerRoute() {
  const store = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set(name, value, options)  // ✅ writes allowed in Route Handlers/Actions
        },
        remove(name: string, options: CookieOptions) {
          store.delete({ name, ...options })
        },
      },
    },
  )
}


Why split? Server Components can’t modify cookies; Route Handlers/Server Actions can. Supabase’s docs reflect this pattern for Next 15 with await cookies(). 
Supabase

web/utils/supabase/client.ts (browser)
// web/utils/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function getSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}


No @supabase/auth-helpers-nextjs on new apps; Supabase recommends @supabase/ssr going forward. 
Supabase

3) Route Handlers: set cookies here, not in RSC

Example: registration/login should be a Route Handler (or Server Action) that sets the HttpOnly cookie on the response.

// web/app/api/auth/register/route.ts
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseServerRoute } from '@/utils/supabase/server-route'

export async function POST(req: NextRequest) {
  const { email, password, username } = await req.json()
  const supabase = await getSupabaseServerRoute()

  // create user; handle errors...
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // (Optional) if you mint your own JWT, set it here too:
  const res = NextResponse.json({ ok: true, user: data.user }, { status: 201 })
  // res.cookies.set('auth-token', token, { httpOnly: true, sameSite: 'lax', secure: true })

  return res
}


In Next 15, cookie writes belong in Server Actions or Route Handlers. Docs call this out explicitly. 
Next.js

4) Instrumentation: keep it minimal & early (don’t fight webpack)

If you still need a server-startup polyfill (e.g., setting globalThis.self to avoid vendor chunks touching self), use instrumentation.ts at the project root and guard by runtime:

// instrumentation.ts (at the root of the Next app)
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (typeof (globalThis as any).self === 'undefined') {
      Object.defineProperty(globalThis, 'self', {
        value: globalThis,
        configurable: true,
        enumerable: false,
        writable: true,
      })
    }
  }
}


Next calls register() once per server instance. Keep side-effects tiny and runtime-guarded. Place client polyfills (if any) in instrumentation-client.ts. 
Next.js
+1

5) Remove risky webpack tweaks; use Next 15 config instead

Your earlier config overrides (e.g., custom conditionNames, mainFields, crypto:false, or patching vendor bundles) are classic ways to accidentally resolve the “browser/worker” build on the server and trigger self at top-level. With Next 15 you should rely on defaults and only use the supported keys below:

// web/next.config.(js|mjs|ts)
const nextConfig = {
  // If you also have Pages Router files, you can unify behavior:
  // bundlePagesRouterDependencies: true,

  // Prefer to let Next bundle server deps.
  // If a specific dependency *must not* be bundled, opt it out:
  // serverExternalPackages: ['some-node-only-lib'],

  experimental: {
    optimizePackageImports: [
      'lucide-react', 'date-fns', 'lodash-es', 'react-hook-form', 'zod', 'clsx', 'tailwind-merge',
    ],
  },
}

export default nextConfig


Delete any custom webpack plugin that rewrites vendors.js or defines self/window/document at build time.

Do not set resolve.conditionNames / mainFields manually.

Don’t set crypto: false/stream:false/buffer:false fallbacks on the server.

In Next 15, experimental.serverComponentsExternalPackages was renamed/stabilized as serverExternalPackages. If you used the old key, update it. Keep overrides minimal. 
Next.js
+1
Codemod

6) Vercel monorepo config (Root Directory) — simplify

On Vercel, set the Project → Root Directory to /web and rely on zero-config for Next. You generally don’t need vercel.json rewrites for App Router API routes. Keep only environment variables and (optionally) function timeouts. 
Vercel
+1

Recommended Vercel project settings:

Framework Preset: Next.js

Root Directory: web

Install Command: (leave default)

Build Command: (leave default)

Output directory: (managed by Vercel for Next.js)

This eliminates accidental builds against a root next.config.* and prevents path rewrites that can confuse the router.

7) Fix “cookies called outside request scope” & static gen conflicts

You’ll see this when:

calling await cookies() at module scope (move inside the handler/component), or

Next tries to statically generate a route that reads cookies.

Remedies:

Move all await cookies() calls inside exported request handlers, pages, or Server Actions.

Add export const dynamic = 'force-dynamic' for any page/route that must read cookies at request time.

Keep cookie writes in Route Handlers or Server Actions only. 
Next.js

8) Keep the self polyfill, but let Next load it first

The top-level self in a vendor chunk happens when a browser export condition leaks into the server bundle. The steps above (no custom resolve overrides; clean Next config; monorepo root set to /web) reduce that risk. instrumentation.ts then acts as a final, early guard. (If you still see it, it usually means some library’s build conditions are mis-resolved — not that you need more polyfills.)

9) Quick verification checklist

Local dev

npm run dev → navigate to pages using cookies; no “await cookies()” warnings.

Try a Route Handler that sets a cookie; verify it is set.

Local prod

npm run build && npm run start

Confirm SSR pages render; no self or “outside request scope” errors.

Vercel

Project root /web

Set env vars (Supabase URL, anon key, service role, JWT secret if you still need it).

Deploy. Test API routes and pages that use cookies.

10) (Optional) Trim custom JWT use

If Supabase Auth is your source of truth, prefer Supabase session cookies and supabase.auth.getUser() for server checks, instead of a separate custom JWT cookie. This simplifies SSR and avoids double sources of auth truth. Supabase advises using getUser() for server-side trust. 
Supabase

11) Minimal flow diagram (auth, SSR, cookies)
[Client form] --POST /api/auth/register--> [Route Handler]
     |                                         |
     |                               await getSupabaseServerRoute()
     |                                         |
     |                        supabase.auth.signUp(...)  (writes SB cookies)
     |                                         |
     |                         (optional) set custom HttpOnly cookie
     |                                         |
     |<-------------- 201 + cookies -----------|
     v
[Client navigates] ----SSR----> [Server Component]
                                  |
                                  | await cookies()  // read-only in RSC
                                  | getSupabaseServerRSC().auth.getUser()
                                  v
                              Render UI

Why these recommendations are correct

Async cookies() is mandatory in Next 15, and calling it opts your route into dynamic rendering. 
Next.js
+1

Instrumentation is the correct place for early server-side globals (and client-side equivalents in instrumentation-client.ts). 
Next.js
+1

Keep webpack overrides minimal; prefer Next 15’s official serverExternalPackages knob over custom resolvers or vendor hacks. 
Next.js
+1

Supabase SSR examples now show await cookies() and read/write separation depending on context. 
Supabase

Vercel monorepo projects should set the Root Directory rather than relying on rewrites. 
Vercel

Quick contributor-accessibility wins (repo housekeeping)

Add CONTRIBUTING.md with setup + run instructions (cd web && npm i && npm run dev), env vars needed, and a short “How to run e2e tests”.

Ensure issue templates exist (Bug, Feature, Tech Debt).

Add a short Roadmap section to the root README linking to open milestones.

(Your repo already has the essentials — public visibility + license — which is great. 
GitHub
)