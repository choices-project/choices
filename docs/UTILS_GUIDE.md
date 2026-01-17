# Utilities Guide (Canonical Helpers)

Last updated: 2025‑11‑16  
Scope: Web app (`web/`), canonical utilities under `@/lib/**`

This guide documents the supported, canonical utilities for common tasks (dates, browser detection, CORS, logging, etc.). Prefer these helpers over ad‑hoc implementations and avoid re‑introducing deprecated paths (enforced by ESLint).

---

## Date/Time Helpers

Import from `@/lib/utils/format-utils`:

```ts
import { nowISO, formatISODateOnly } from '@/lib/utils/format-utils';

const timestamp = nowISO();                 // e.g., "2025-11-16T21:03:55.123Z"
const dateOnly = formatISODateOnly(timestamp); // e.g., "2025-11-16"
```

Use these in place of direct `new Date().toISOString()` and `toISOString().split('T')[0]`.

---

## Browser Utilities (Client‑Side)

Import from `@/lib/utils/browser-utils`:

```ts
import { detectBrowser, getRedirectStrategy, navigateTo } from '@/lib/utils/browser-utils';

const info = detectBrowser();         // { name, version, isMobile, supportsServerRedirects }
const strategy = getRedirectStrategy(); // 'server' | 'client' | 'hybrid'
navigateTo('/dashboard', strategy);     // safe navigation; prefers server when supported
```

Server‑safe wrappers for DOM access live in `@/lib/utils/ssr-safe`:

```ts
import { isBrowser, safeNavigate } from '@/lib/utils/ssr-safe';

if (isBrowser()) {
  safeNavigate('/profile');
}
```

---

## API Response & CORS Helpers (Routes)

Import from `@/lib/api`:

```ts
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { corsPreflightResponse, withCors } from '@/lib/api/response-utils';

export const OPTIONS = async () => corsPreflightResponse(['GET', 'POST']);

export const GET = withErrorHandling(async () => {
  const res = successResponse({ ok: true });
  return withCors(res, { origin: '*', methods: ['GET'] });
});
```

Note: Legacy modules `@/lib/utils/cors`, `@/lib/utils/http`, `@/lib/http`, and `@/lib/utils/csrf*` were removed. Use the helpers above and rely on route‑level protection/middleware.

---

## Origin/HTTP Validation (Server)

Import from `@/lib/http/origin`:

```ts
import { requireTrustedOrigin } from '@/lib/http/origin';

export const POST = async (request: Request) => {
  try {
    requireTrustedOrigin(request);
    // proceed
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid origin' }), { status: 403 });
  }
};
```

---

## Logger

Import from `@/lib/utils/logger`:

```ts
import logger, { devLog, logError } from '@/lib/utils/logger';

logger.info('Processing job', { id });
logger.warn('Slow response', { ms });
logger.error('Unexpected error', err);
devLog('Non‑blocking debug info', { details: '...' }); // development‑only
logError('Action failed', err);
```

---

## Trending Hashtags (Canonical)

Import from `@/lib/trending/TrendingHashtags`:

```ts
import { trendingHashtagsTracker } from '@/lib/trending/TrendingHashtags';

const list = await trendingHashtagsTracker.getTrendingHashtags(20);
```

Note: The feature‑local duplicate was removed; always use the lib version.

---

## Device Detection (Canonical)

Prefer `@/lib/utils/browser-utils` for browser detection. For stateful device info, use the centralized `deviceStore`:

```ts
import { useDeviceStore } from '@/lib/stores/deviceStore';
const isMobile = useDeviceStore(s => s.isMobile);
```

---

## ESLint Guardrails (Do Not Use)

The following legacy paths are blocked and will error in CI:
- `@/lib/utils/http`, `@/lib/http` → use `@/lib/http/origin`
- `@/lib/utils/cors`, `@/lib/utils/csrf*` → use `@/lib/api/response-utils` and route‑level protections
- `@/features/feeds/lib/TrendingHashtags` → use `@/lib/trending/TrendingHashtags`

---

## Contributing New Utilities

1) Add to `@/lib/utils/**` (or a domain‑specific `@/lib/**` folder).  
2) Consider server/client safety (avoid unguarded DOM usage).  
3) Export via a local index if useful across features; avoid broad barrel re‑exports if unstable.  
4) Add short usage to this guide (PR welcome).

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

