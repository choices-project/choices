# Supabase CLI Setup Guide

**Created**: January 2025  
**Purpose**: Link Supabase CLI to project and generate TypeScript types

---

## Status

✅ **Supabase CLI Linked and Types Generated**
- CLI version: 2.54.11 (latest)
- Types file: `web/utils/supabase/database.types.ts`
- `server.ts` now imports types from `database.types.ts`

---

## Prerequisites

1. **Supabase CLI Installed** ✅
   - Version: 2.54.11 (latest)
   - Location: `/usr/local/bin/supabase`
   - Update: `brew upgrade supabase` (if using Homebrew)

2. **Supabase Project**
   - Project URL: Set in `NEXT_PUBLIC_SUPABASE_URL` environment variable
   - Project ID: Extracted from URL

3. **Access Token** (for linking remote project)
   - Get from: https://supabase.com/dashboard/account/tokens
   - Set as: `SUPABASE_ACCESS_TOKEN` environment variable

---

## Linking Options

### Option 1: Link to Remote Project (Recommended)

This links the CLI to your existing Supabase project without requiring Docker.

```bash
# 1. Get your access token from Supabase dashboard
# https://supabase.com/dashboard/account/tokens

# 2. Set the access token
export SUPABASE_ACCESS_TOKEN=your_token_here

# 3. Extract project ID from your URL
# If NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
# Then project ID is: xyzabc123

# 4. Link to the project
cd /Users/alaughingkitsune/src/Choices
supabase link --project-ref xyzabc123

# 5. Generate TypeScript types (or use npm script)
cd web && npm run types:generate
# OR manually:
# supabase gen types typescript --linked > web/utils/supabase/database.types.ts
```

### Option 2: Initialize Local Development

For local development with Docker (requires Docker Desktop running):

```bash
# 1. Initialize Supabase in the project
cd /Users/alaughingkitsune/src/Choices
supabase init

# 2. Start local Supabase instance (requires Docker)
supabase start

# 3. Link to remote project (optional, for syncing)
supabase link --project-ref your-project-id

# 4. Generate types from linked project
cd web && npm run types:generate
# OR manually:
# supabase gen types typescript --linked > web/utils/supabase/database.types.ts
```

---

## Type Generation

Types are automatically generated from the linked Supabase project:

```typescript
// web/utils/supabase/server.ts
import type { Database } from './database.types'
```

To regenerate types after schema changes:

```bash
cd web
npm run types:generate
```

The script automatically:
- Runs from the project root directory
- Filters out CLI output messages
- Generates types to `web/utils/supabase/database.types.ts`
- Uses the linked Supabase project (no manual configuration needed)

---

## Verification

After generating types, verify:

1. **Types file exists**:
   ```bash
   ls -lh web/utils/supabase/database.types.ts
   ```

2. **Types are valid**:
   ```bash
   cd web
   npm run type-check
   ```

3. **Imports work**:
   - Update `server.ts` to import from `database.types.ts`
   - Run TypeScript check to ensure no errors

---

## Automated Script

A helper script is available:

```bash
bash web/scripts/link-supabase-and-generate-types.sh
```

This script:
- Checks if Supabase CLI is installed
- Extracts project ID from environment
- Provides instructions for linking
- Shows command to generate types

---

## Troubleshooting

### "Cannot connect to Docker daemon"
- **Issue**: Docker not running (for local development)
- **Solution**: Start Docker Desktop, or use remote linking instead

### "Project not found"
- **Issue**: Wrong project ID or access token
- **Solution**: Verify project ID from Supabase dashboard URL
- **Solution**: Regenerate access token if expired

### "Permission denied"
- **Issue**: Access token doesn't have project access
- **Solution**: Check token permissions in Supabase dashboard

### "Command not found"
- **Issue**: Supabase CLI not in PATH
- **Solution**: Install globally: `npm install -g supabase`
- **Solution**: Or use npx: `npx supabase`

---

## Next Steps

✅ **Completed**:
1. ✅ Supabase CLI updated to 2.54.11
2. ✅ Types generated from linked project
3. ✅ `server.ts` updated to use generated types
4. ✅ Inline type definitions removed
5. ✅ Type generation script added to `package.json`

---

**Status**: ✅ Complete - Supabase CLI linked and types generated

