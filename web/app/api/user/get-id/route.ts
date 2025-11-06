import { cookies } from 'next/headers';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/user/get-id - Get current user ID (for security setup)
export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseServerClient();
  
  if (!supabase) {
    return errorResponse('Supabase client not available', 500, {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      cookies: (cookies().getAll()).map(c => c.name || 'unnamed')
    });
  }

  // Check authentication
  const supabaseClient = await supabase;
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError) {
    return authError('Authentication error');
  }
  
  if (!user) {
    return authError('Authentication required');
  }

  // Get user profile from user_profiles table
  const { data: userProfile, error: _profileError } = await supabaseClient
    .from('user_profiles')
    .select('user_id, trust_tier, is_active')
    .eq('user_id', user.id)
    .single();

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      profile: userProfile && !('error' in userProfile) ? {
        user_id: (userProfile as any).user_id,
        trust_tier: (userProfile as any).trust_tier,
        is_active: (userProfile as any).is_active
      } : null
    },
    instructions: {
      copy_user_id: user.id,
      files_to_update: [
        'database/security_policies.sql',
        'web/app/api/admin/trending-topics/analyze/route.ts',
        'web/app/api/admin/trending-topics/route.ts',
        'web/app/api/admin/generated-polls/route.ts',
        'web/app/api/admin/generated-polls/[id]/approve/route.ts'
      ],
      example_replacement: `const OWNER_USER_ID = '${user.id}';`,
      next_steps: [
        'Replace "your-user-id-here" with the user ID above',
        'Deploy security policies: node scripts/deploy-security-policies.js',
        'Restart development server',
        'Test admin access at /admin/automated-polls'
      ]
    }
  });
});
