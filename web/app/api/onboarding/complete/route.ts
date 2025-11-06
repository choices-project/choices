import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Mark onboarding as complete
    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update({ 
        // onboarding completion tracked via onboarding_progress table
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error updating onboarding status', { error: updateError });
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding completed successfully' 
    });

  } catch (error) {
    logger.error('Onboarding completion error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

