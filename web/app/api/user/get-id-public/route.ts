// NextRequest import removed - not used
import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/user/get-id-public - Temporary endpoint for security setup
// This endpoint is for setup purposes only and should be removed after configuration
export async function GET() {
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

    // Get all cookies for debugging
    const allCookies = cookies().getAll();
    const authCookies = allCookies.filter(c => c.name.includes('auth') || c.name.includes('supabase'));

    // Try to get user from session
    const supabaseClient = await supabase;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      return NextResponse.json(
        { 
          error: 'Authentication error',
          debug: {
            userError: userError.message,
            cookies: allCookies.map(c => c.name || 'unnamed'),
            authCookies: authCookies.map(c => c.name || 'unnamed'),
            suggestion: 'Try logging out and back in, or check if you can access /dashboard'
          }
        },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'No authenticated user found',
          debug: {
            cookies: allCookies.map(c => c.name || 'unnamed'),
            authCookies: authCookies.map(c => c.name || 'unnamed'),
            suggestion: 'You need to be logged in to get your user ID'
          },
          instructions: [
            '1. Go to http://localhost:3000/login',
            '2. Log in with your credentials',
            '3. Try accessing /dashboard to verify you are logged in',
            '4. Then try this endpoint again'
          ]
        },
        { status: 401 }
      );
    }

    // Get user profile from ia_users table
    const { data: userProfile, error: _profileError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, verification_tier, is_active')
      .eq('stable_id', String(user.id))
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: userProfile && !('error' in userProfile) ? {
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
          'Test admin access at /admin/automated-polls',
          'REMOVE THIS ENDPOINT after setup is complete'
        ]
      },
      security_note: 'This endpoint is for setup purposes only and should be removed after configuration'
    });

  } catch (error) {
    devLog('Error in get user ID public API:', error);
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
