# TypeScript Debugging Handout

## Summary

TypeScript compilation is currently blocked by a cluster of errors stemming from our recent Supabase schema sync and subsequent type-tightening work. The key hotspots are concentrated in the user/profile editing flows, PWA analytics utilities, poll adapters, and the civics orchestrator. A tarball containing all relevant sources lives at:

```
/Users/alaughingkitsune/choices-ts-debug.tar.gz
```

You can untar it anywhere to inspect the exact revisions we need help with.

### Goal

Help us resolve the remaining `tsc` failures so the project builds, after which we can resume Playwright/Jest runs. Feel free to modify the files in the archive or suggest patches.

## Environment Info

- Repository root: `/Users/alaughingkitsune/src/Choices`
- Node: 24.11.0 (Volta pin)
- npm: 11.6.1
- TypeScript check command: `npm run type-check` (calls `node ./scripts/run-with-timeout.js 180 tsc -p ../tsconfig.json --noEmit` from within `web`)
- Primary workspace: `web/`

## Current TypeScript Errors

Running `npm run type-check` inside `web/` produces (trimmed to most persistent issues):

```
lib/stores/userStore.ts(336,11): error TS2589: Type instantiation is excessively deep and possibly infinite.

lib/stores/userStore.ts(396,28): error TS2589: Type instantiation is excessively deep and possibly infinite.

features/profile/lib/profile-service.ts(145,5): error TS2412: Type '"public" | "private" | "friends" | undefined' is not assignable to type '"public" | "private" | "friends"'.

features/pwa/lib/PWAAnalytics.ts(715,31): error TS2769: No overload matches this call (Supabase `Date` conversion).
features/pwa/lib/PWAAnalytics.ts(771,31): error TS2769: No overload matches this call.

features/pwa/components/PWAUserProfile.tsx(50,67): error TS2322: Type 'ForwardRefExoticComponent<...>' is not assignable to type 'ComponentType<{ className?: string; }>'. (several similar lines).

features/voting/lib/pollAdapters.ts(90,5): error TS2552: Cannot find name 'contest'. Did you mean 'context'?

lib/integrations/unified-orchestrator.ts(778,7): error TS2322: Type 'ActiveCampaignData' is not assignable to type 'OrchestratorCampaignData'. (repeated at multiple call sites).
```

> **Note**: The list above reflects the state before the tarball was created. Some locations may have changed slightly, but the failing areas are the same.

## Key Files (included in tarball)

| File | Purpose |
| --- | --- |
| `web/lib/stores/userStore.ts` | Zustand store for auth/profile state – the biggest source of `TS2589` recursion errors. |
| `web/features/profile/lib/profile-service.ts` | Supabase profile transformations; strict type guards for privacy settings. |
| `web/features/profile/components/ProfileEdit.tsx` | Client-side profile editor; uses `userStore` and profile-service helpers. |
| `web/lib/stores/hashtagStore.ts` | Related store with similar optional-field-tightening. |
| `web/features/pwa/lib/PWAAnalytics.ts` | Supabase analytics inserts/queries; needs proper `Json` typing, `Date` parsing, etc. |
| `web/features/pwa/components/PWAUserProfile.tsx` | Uses Lucide icons with loose typing (ForwardRef). |
| `web/features/pwa/components/PWAVotingInterface.tsx` | Depends on poll adapter context typing. |
| `web/features/voting/lib/pollAdapters.ts` | Converts poll data into ballot structures; `contest` naming bug and optional context handling. |
| `web/features/polls/pages/[id]/PollClient.tsx` | Hooks up poll details to ballot creation; ensures context types align. |
| `web/features/analytics/lib/widgetRegistry.tsx` | Widget config merging (`dateRange` optional). |
| `web/features/feeds/lib/hashtag-polls-integration.ts` & client variant | Supabase client types and trending analytics. |
| `web/app/api/polls/route.ts` / `[id]/results/route.ts` | API handlers that rely on new Supabase types. |

## Reproduction Steps

```bash
cd /Users/alaughingkitsune/src/Choices/web
npm install  # only if dependencies changed
npm run type-check
```

Expect the errors listed above. No need to run build/test until `tsc` is clean.

## Context & Recent Changes

1. Regenerated Supabase types (`web/types/supabase.ts`) to include new tables (`poll_rankings`, extra columns) and tightened optional fields.
2. Updated profile-related components/stores to respect `exactOptionalPropertyTypes` (TS 5.7 default).
3. Adjusted PWA utilities (offline queue, analytics) to use stricter timestamp/Json typing.
4. Normalized poll adapters and poll client to account for optional vote counts.

## Desired Outcomes

- Resolve `TS2589` recursion in `userStore` by restructuring `ProfileEdit` drafting logic or reducing generic depth.
- Fix Supabase date/Json typing in `PWAAnalytics.ts`.
- Ensure `PWAUserProfile.tsx` icon typing satisfies `ComponentType<{ className?: string }>` (e.g., wrap icons or widen type).
- Clean up `pollAdapters.ts` to use `contest` object correctly and eliminate undefined spreads.
- Make `ActiveCampaignData` -> `OrchestratorCampaignData` conversion explicit so types line up.

## Tips / Constraints

- TypeScript is configured with `"exactOptionalPropertyTypes": true` across the project (TS 5.7).
- Zustand stores use `immer` middleware; replacing direct mutation with returns is allowed if it simplifies types.
- We prefer avoiding `any` where possible; `@ts-expect-error` is acceptable if it’s well-justified and localized.
- Keep environment ASCII-only unless existing files already contain Unicode glyphs.

## Hand-off Checklist

- [ ] Make sure to untar: `tar -xzf /Users/alaughingkitsune/choices-ts-debug.tar.gz`
- [ ] Run `npm run type-check` to confirm baseline.
- [ ] Apply fixes in-place, or provide patch diff we can apply.
- [ ] Re-run `npm run type-check` and optionally `npm run test:unit` / `npm run test:e2e:check` once types compile.

Thanks for jumping in! Let us know if you need any additional context or access to other parts of the repo.
