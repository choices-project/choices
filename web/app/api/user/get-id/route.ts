import { NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/user/get-id - Get current user ID (for security setup)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { 
          error: 'Supabase client not available',
          debug: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            cookies: cookieStore.getAll().map(c => c.name)
          }
        },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json(
        { 
          error: 'Authentication error',
          debug: {
            userError: userError.message,
            cookies: cookieStore.getAll().map(c => c.name),
            hasAuthCookies: cookieStore.getAll().some(c => c.name.includes('auth'))
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
            cookies: cookieStore.getAll().map(c => c.name),
            hasAuthCookies: cookieStore.getAll().some(c => c.name.includes('auth')),
            suggestion: 'Make sure you are logged in and try refreshing the page'
          }
        },
        { status: 401 }
      );
    }

    // Get user profile from ia_users table
    const {  } = await supabase
      .from('ia_users')
      .select('stable_id, verification_tier, is_active')
      .eq('stable_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: userProfile ? {
          stable_id: userProfile.stable_id,
          verification_tier: userProfile.verification_tier,
          is_active: userProfile.is_active
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
          message: error instanceof Error ? error.message : 'Unknown error',
          cookies: (await cookies()).getAll().map(c => c.name)
        }
      },
      { status: 500 }
    );
  }
}
