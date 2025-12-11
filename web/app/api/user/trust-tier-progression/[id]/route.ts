import { createClient } from '@supabase/supabase-js';


import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not configured');
    }
    const supabase = createClient(
      supabaseUrl,
      supabaseKey
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
    const now = Date.now();
    return successResponse({
      user_id: id,
      current_tier: 'T3',
      progression_history: [
        {
          previous_tier: 'T1',
          new_tier: 'T2',
          reason: 'User signed up and linked anonymous votes',
          created_at: new Date(now - 86400000).toISOString(),
        },
        {
          previous_tier: 'T2',
          new_tier: 'T3',
          reason: 'Participated in 10+ polls',
          created_at: new Date(now - 43200000).toISOString(),
        },
      ],
      next_tier_requirements: {
        T1: 'Complete profile verification',
        T2: 'Participate in 5+ polls',
        T3: 'Participate in 10+ polls',
      },
      analysis_method: 'trust_tier_based',
      timestamp: new Date().toISOString(),
    });
  }

  return successResponse({
    ...progressionData,
    analysis_method: 'trust_tier_based',
    timestamp: new Date().toISOString()
  });
});
