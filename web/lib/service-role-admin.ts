import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

/**
 * Service Role Admin Middleware
 * 
 * This middleware uses the service role key to provide admin access
 * without requiring a specific admin user ID.
 */

export async function serviceRoleAdminAuth(request: NextRequest) {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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