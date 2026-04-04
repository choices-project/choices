# Performance Baseline

_Last updated: March 13, 2026_

Targets and quick wins for application performance. See `docs/ROADMAP.md` for full roadmap.

---

## Core Web Vitals Targets

| Metric | Target | Notes |
|--------|--------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Key pages: landing, dashboard, feed, polls, civics, representatives |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Avoid layout shifts from images, ads, dynamic content |
| **FID** / **INP** (First Input Delay / Interaction to Next Paint) | < 100ms | Responsiveness of clicks, taps, keyboard |

**Measurement options:**
- **Chrome DevTools** — Open DevTools → Lighthouse tab → Run analysis
- **PageSpeed Insights** — https://pagespeed.web.dev/ (production URL)
- **Vercel Analytics** — Enable in project settings for real-user metrics
- **Local script** — From `web/`: `npm run lighthouse:cwv` (requires dev server on port 3000, or pass URL: `./scripts/performance/lighthouse-cwv.sh https://www.choices-app.com`)

---

## Bundle Analysis

Run `npm run analyze` (or `ANALYZE=true npm run build`) to generate a bundle report. The `@next/bundle-analyzer` is already configured in `next.config.js`.

**Target:** Each route bundle < 100KB compressed (gzip).

---

## Quick Wins (Implemented)

- **Route prefetching** — PrefetchLink on polls, nav, rep cards; prefetch on rep list hover
- **Image optimization** — Next.js Image with webp/avif; `optimizePackageImports` for lucide-react, recharts, framer-motion
- **Skeleton loaders** — PollListSkeleton, RepresentativeCardSkeleton, FeedSkeleton reduce perceived load time
- **Standalone output** — Smaller Docker images via `output: 'standalone'`

---

## Quick Wins (Additional)

- **Representative list virtualization** — `@tanstack/react-virtual` for 50+ cards on civics/representatives (reduces DOM bloat)
- **Analytics chart accessibility** — `aria-labelledby` and sr-only summaries for screen readers
- **LCP hint** — Rep detail hero avatar uses `fetchPriority="high"` for above-fold image

## Planned Improvements

- **Code splitting** — Lazy-load admin, analytics, and heavy chart components where feasible
