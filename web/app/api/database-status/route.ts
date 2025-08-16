import { NextResponse } from 'next/server';
import { getDatabaseStatus, testDatabaseConnection } from '@/lib/database-config';

export async function GET() {
  try {
    const status = getDatabaseStatus();
    const connectionTest = await testDatabaseConnection();
    
    return NextResponse.json({
      status,
      connectionTest,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        LOCAL_DATABASE: process.env.LOCAL_DATABASE,
        DATABASE_URL: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
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
