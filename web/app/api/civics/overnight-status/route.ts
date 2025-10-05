import { NextRequest, NextResponse } from 'next/server';
import { requireServiceKey } from '@/lib/service-auth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    // Get current database status
    const { data: representatives, error } = await supabase
      .from('representatives_core')
      .select('name, office, state, data_sources, last_updated')
      .order('last_updated', { ascending: false });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`
      }, { status: 500 });
    }
    
    // Analyze the data
    const totalReps = representatives?.length || 0;
    const recentReps = representatives?.filter(rep => {
      const lastUpdate = new Date(rep.last_updated);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      return diffMinutes < 10; // Updated in last 10 minutes
    }).length || 0;
    
    const multiSourceReps = representatives?.filter(rep => 
      rep.data_sources && rep.data_sources.length > 1
    ).length || 0;
    
    const offices = [...new Set(representatives?.map(rep => rep.office) || [])];
    const states = [...new Set(representatives?.map(rep => rep.state) || [])];
    
    return NextResponse.json({
      success: true,
      message: 'Overnight ingestion status',
      status: {
        totalRepresentatives: totalReps,
        recentUpdates: recentReps,
        multiSourceCoverage: multiSourceReps,
        offices: offices,
        states: states,
        lastUpdated: representatives?.[0]?.last_updated
      },
      representatives: representatives?.slice(0, 10), // Show first 10
      isRunning: recentReps > 0,
      note: 'Overnight ingestion is processing with conservative delays'
    });
    
  } catch (error) {
    console.error('Overnight status check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Overnight status check failed: ${error}`
    }, { status: 500 });
  }
}
