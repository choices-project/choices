# Service Role Only Admin Access

## Overview
This system now uses only the Supabase service role key for admin access, eliminating the need for a specific admin user ID.

## Benefits
- **Simplified Security**: No need to manage admin user IDs
- **Full Access**: Service role bypasses all RLS policies
- **Reduced Complexity**: Fewer configuration requirements
- **Better Security**: No user-based admin access vulnerabilities

## Configuration
Only these environment variables are required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Security Notes
- Service role key provides full database access
- Bypasses all Row Level Security (RLS) policies
- Should be kept secure and never exposed to client-side code
- Consider rotating the service role key regularly

## API Access
All admin API routes now use service role authentication:
- `/api/admin/trending-topics`
- `/api/admin/generated-polls`
- `/api/admin/trending-topics/analyze`
- `/api/admin/generated-polls/[id]/approve`

## Migration Notes
- Removed `ADMIN_USER_ID` dependency
- Updated security policies
- Simplified authentication flow
- Enhanced security posture
