import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../utils/supabase/server';
import queryOptimizer from '../../../lib/database/query-optimizer';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test query optimizer
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing query optimizer...');
    
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('👤 Testing with user:', user.id);

    // Test getUserAnalytics
    console.log('🔍 Testing getUserAnalytics...');
    const analyticsResult = await queryOptimizer.getUserAnalytics(supabase, user.id);
    console.log('📊 Analytics result:', analyticsResult);

    // Test getUserPreferences
    console.log('🔍 Testing getUserPreferences...');
    const preferencesResult = await queryOptimizer.getUserPreferences(supabase, user.id);
    console.log('⚙️ Preferences result:', preferencesResult);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      analytics: analyticsResult,
      preferences: preferencesResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error as Error);
    return NextResponse.json(
      { error: 'Debug test failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

