import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { handleError, getUserMessage, getHttpStatus } from '@/lib/error-handler';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Check if Supabase is configured
    const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    
    if (!supabase) {
      return NextResponse.json({
        status: {
          environment: process.env.NODE_ENV,
          databaseType: 'mock',
          databaseEnabled: false,
          supabaseConfigured: supabaseConfigured,
          connectionSuccess: false
        },
        connectionTest: {
          success: false,
          error: 'Supabase client not available - using mock data'
        },
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
          SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'
        }
      });
    }
    
               // Test the connection
           const supabaseClient = await supabase;
           const { error } = await supabaseClient.from('ia_users').select('count').limit(1);
    
    return NextResponse.json({
      status: {
        environment: process.env.NODE_ENV,
        databaseType: 'supabase',
        databaseEnabled: true,
        supabaseConfigured: true,
        connectionSuccess: !error
      },
      connectionTest: {
        success: !error,
        error: error?.message || null
      },
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'
      }
    });
  } catch (error) {
    const appError = handleError(error as Error, { context: 'database-status' })
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json({
      error: userMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}
