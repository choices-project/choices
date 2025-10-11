import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Always require real authentication - no E2E bypasses

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user interests from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('interests')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.error('Failed to fetch user interests:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user interests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      interests: userData?.interests || []
    });

  } catch (error) {
    logger.error('Error in interests GET:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Always require real authentication - no E2E bypasses

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { interests } = await request.json();
    
    if (!Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Interests must be an array' },
        { status: 400 }
      );
    }

    // Update user interests in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        interests: interests,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update user interests:', updateError);
      return NextResponse.json(
        { error: 'Failed to save interests' },
        { status: 500 }
      );
    }

    logger.info(`User ${user.id} updated interests:`, { interests });

    return NextResponse.json({
      success: true,
      message: 'Interests saved successfully',
      interests: interests
    });

  } catch (error) {
    logger.error('Error in interests POST:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
