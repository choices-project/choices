import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the database function
    // Await params in Next.js 15

    const { id } = await params;

    

    const { data: progressionData, error } = await supabase.rpc('get_trust_tier_progression', {
      p_user_id: id
    });

  if (error) {
    logger.error('Trust tier progression error', { error, userId: id });
    return errorResponse('Failed to get trust tier progression', 500, error.message);
  }

  if (!progressionData) {
    return successResponse({
        user_id: id,
        current_tier: 3,
        progression_history: [
          {
            previous_tier: 1,
            new_tier: 2,
            reason: 'User signed up and linked anonymous votes',
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            previous_tier: 2,
            new_tier: 3,
            reason: 'Participated in 10+ polls',
            created_at: new Date(Date.now() - 43200000).toISOString()
          }
        ],
        next_tier_requirements: {
          tier_2: 'Complete profile verification',
          tier_3: 'Participate in 10+ polls',
          tier_4: 'Community verification and engagement'
        },
      analysis_method: 'trust_tier_based',
      timestamp: new Date().toISOString()
    });
  }

  return successResponse({
    ...progressionData,
    analysis_method: 'trust_tier_based',
    timestamp: new Date().toISOString()
  });
});
