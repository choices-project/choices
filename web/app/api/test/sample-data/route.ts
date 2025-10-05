import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get a sample representative to see what data we actually have
    const { data: representatives, error } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ error: 'Database query failed', details: error }, { status: 500 });
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json({ message: 'No representatives found' });
    }
    
    const sample = representatives[0];
    
    // Check what data we have vs what we expect
    const dataAnalysis = {
      basicInfo: {
        name: !!sample.name,
        party: !!sample.party,
        office: !!sample.office,
        level: !!sample.level,
        state: !!sample.state,
        district: !!sample.district
      },
      identifiers: {
        bioguide_id: !!sample.bioguide_id,
        openstates_id: !!sample.openstates_id,
        fec_id: !!sample.fec_id,
        google_civic_id: !!sample.google_civic_id
      },
      contacts: {
        primary_email: !!sample.primary_email,
        primary_phone: !!sample.primary_phone,
        primary_website: !!sample.primary_website,
        primary_photo_url: !!sample.primary_photo_url
      },
      metadata: {
        active: sample.active,
        data_quality_score: sample.data_quality_score,
        data_sources: sample.data_sources,
        last_updated: !!sample.last_updated,
        last_verified: !!sample.last_verified,
        verification_status: sample.verification_status
      }
    };
    
    return NextResponse.json({
      sample: sample,
      dataAnalysis: dataAnalysis,
      completeness: {
        basicInfo: Object.values(dataAnalysis.basicInfo).filter(Boolean).length / Object.keys(dataAnalysis.basicInfo).length * 100,
        identifiers: Object.values(dataAnalysis.identifiers).filter(Boolean).length / Object.keys(dataAnalysis.identifiers).length * 100,
        contacts: Object.values(dataAnalysis.contacts).filter(Boolean).length / Object.keys(dataAnalysis.contacts).length * 100,
        metadata: Object.values(dataAnalysis.metadata).filter(Boolean).length / Object.keys(dataAnalysis.metadata).length * 100
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Sample data analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
