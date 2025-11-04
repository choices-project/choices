# Archived: Old src/ Directory Structure

**Archived**: November 04, 2025  
**Reason**: Obsolete code from earlier architecture

## What Was This?

This was an old Next.js directory structure from when the project used a microservices backend:
- Identity Aggregation service (localhost:8081)
- Polls Orchestration service (localhost:8082)

## Why Archived?

1. **Architecture Changed**: Now using Supabase as unified backend
2. **Duplicate Structure**: Created confusion with current `app/`, `components/`, `lib/` directories
3. **Not In Use**: No active imports, only 1 lint error (vs 333+ in active code)
4. **Old API Patterns**: References outdated backend services

## Contents

```
src/
├── app/
│   ├── layout.tsx       (basic, outdated)
│   ├── page.tsx         (simple landing)
│   ├── polls/page.tsx
│   └── results/page.tsx
├── components/
│   └── WebAuthnAuth.tsx (old auth component)
└── lib/
    └── api.ts           (references localhost:8081/8082)
```

## Current Structure

Active code is in:
- `/app/` - Next.js 15 app directory with full routing
- `/components/` - Shared UI components  
- `/lib/` - Core utilities and stores
- `/features/` - Feature-based organization (analytics, polls, civics, etc.)

