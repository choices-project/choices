import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/user/get-id - Get current user ID (for security setup)
export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { 
          error: 'Supabase client not available',
          debug: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            cookies: (cookies().getAll()).map(c => c.name || 'unnamed')
          }
        },
        { status: 500 }
      );
    }

    // Check authentication
    const supabaseClient = await supabase;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      return NextResponse.json(
        { 
          error: 'Authentication error',
          debug: {
            userError: userError.message,
            cookies: (cookies().getAll()).map(c => c.name || 'unnamed'),
            hasAuthCookies: (cookies().getAll()).some(c => c.name.includes('auth'))
          }
        },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          debug: {
            cookies: (cookies().getAll()).map(c => c.name || 'unnamed'),
            hasAuthCookies: (cookies().getAll()).some(c => c.name.includes('auth')),
            suggestion: 'Make sure you are logged in and try refreshing the page'
          }
        },
        { status: 401 }
      );
    }

    // Get user profile from ia_users table
    const { data: userProfile, error: _profileError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, verification_tier, is_active')
      .eq('stable_id', String(user.id) as any)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: userProfile && !('error' in userProfile) ? {
          stable_id: (userProfile as any).stable_id,
          verification_tier: (userProfile as any).verification_tier,
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

  } catch (error) {
    devLog('Error in get user ID API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: {
          message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error',
          cookies: (cookies()).getAll().map(c => c.name)
        }
      },
      { status: 500 }
    );
  }
}
