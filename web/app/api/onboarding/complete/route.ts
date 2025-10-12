import { NextResponse } from 'next/server';

import { createApiLogger } from '@/lib/utils/api-logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function POST() {
  const logger = createApiLogger('/api/onboarding/complete', 'POST');
  
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
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error updating onboarding status', updateError);
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
    logger.error('Onboarding completion error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

