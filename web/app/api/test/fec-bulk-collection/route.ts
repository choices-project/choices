import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Get all existing representatives from our database
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(10); // Test with first 10

    if (fetchError) {
      return NextResponse.json({ 
        error: `Failed to fetch representatives: ${fetchError.message}`,
        status: 'failed'
      }, { status: 500 });
    }

    console.log(`🧪 Testing FEC bulk collection for ${representatives?.length || 0} representatives...`);
    
    const results = [];
    
    for (const rep of representatives || []) {
      try {
        // Convert database record to RepresentativeData format
        const repData = {
          id: rep.id,
          name: rep.name,
          party: rep.party,
          office: rep.office,
          level: rep.level,
          state: rep.state,
          district: rep.district,
          bioguideId: rep.bioguide_id,
          openstatesId: rep.openstates_id,
          fecId: rep.fec_id,
          googleCivicId: rep.google_civic_id,
          contacts: [],
          socialMedia: [],
          photos: [],
          activity: [],
          dataSources: rep.data_sources || [],
          qualityScore: rep.data_quality_score || 0,
          lastUpdated: new Date(rep.last_updated)
        };

        // Get FEC data for this representative
        const fecData = await pipeline.getFECData(repData);
        
        if (fecData) {
          // Update the representative with FEC data
          const { error: updateError } = await supabase
            .from('representatives_core')
            .update({
              // Add FEC ID if we found one
              fec_id: fecData.electionCycle ? `FEC-${Date.now()}` : rep.fec_id,
              
              // Add campaign finance summary fields
              total_receipts: fecData.totalReceipts,
              total_disbursements: fecData.totalDisbursements,
              cash_on_hand: fecData.cashOnHand,
              individual_contributions: fecData.individualContributions,
              pac_contributions: fecData.pacContributions,
              party_contributions: fecData.partyContributions,
              self_financing: fecData.selfFinancing,
              
              // Update data sources to include FEC
              data_sources: [...(rep.data_sources || []), 'fec'].filter((v, i, a) => a.indexOf(v) === i),
              
              // Update quality score
              data_quality_score: Math.min(100, (rep.data_quality_score || 0) + 20),
              
              last_updated: new Date().toISOString()
            })
            .eq('id', rep.id);

          if (updateError) {
            results.push({ 
              id: rep.id, 
              name: rep.name, 
              status: 'failed', 
              error: updateError.message 
            });
          } else {
            results.push({ 
              id: rep.id, 
              name: rep.name, 
              status: 'success',
              fecData: {
                totalReceipts: fecData.totalReceipts,
                totalDisbursements: fecData.totalDisbursements,
                individualContributions: fecData.individualContributions,
                selfFinancing: fecData.selfFinancing
              }
            });
          }
        } else {
          results.push({ 
            id: rep.id, 
            name: rep.name, 
            status: 'no_fec_data',
            reason: 'No FEC data found for this representative'
          });
        }

        // Rate limiting - wait between FEC API calls
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      } catch (error) {
        results.push({ 
          id: rep.id, 
          name: rep.name, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'FEC bulk collection completed',
      results: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        noData: results.filter(r => r.status === 'no_fec_data').length,
        failed: results.filter(r => r.status === 'failed').length,
        details: results
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `FEC bulk collection failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
