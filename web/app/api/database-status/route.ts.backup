import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check if Supabase is configured
    const supabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
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
    const { data, error } = await supabase.from('ia_users').select('count').limit(1);
    
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
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
