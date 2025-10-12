import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/utils/logger';
import { getSupabaseServiceRoleClient } from '@/utils/supabase/server';

/**
 * Service Role Admin Middleware
 * 
 * This middleware uses the service role key to provide admin access
 * without requiring a specific admin user ID.
 */

export async function serviceRoleAdminAuth(request: NextRequest) {
  try {
    // Log the service role auth attempt
    devLog('Service role auth attempt:', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent')
    });

    // Use centralized service role client
    const supabase = await getSupabaseServiceRoleClient();

    // Service role key provides full admin access
    return { success: true, supabase };
  } catch (error) {
    devLog('Service role auth error:', error);
    return { success: false, error: 'Service role authentication failed' };
  }
}

export function requireServiceRoleAdmin() {
  return async (request: NextRequest) => {
    const auth = await serviceRoleAdminAuth(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Service role authentication failed' },
        { status: 500 }
      );
    }
    
    return auth;
  };
}