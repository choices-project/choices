# Archived legacy auth pages

These files lived under `features/auth/pages/` and were **never mounted** in the App Router (`app/` owns routes).

| File | Superseded by |
|------|----------------|
| `page.tsx` | `app/auth/page.tsx` + `AuthPageClient.tsx` |
| `register/page.tsx` | `app/auth/register/page.tsx` (or `/auth?mode=signup`) |
| `verify/route.ts` | `app/auth/verify/route.ts` |

Removed from the tree on 2026-05-16 during post-auth redirect consolidation.
