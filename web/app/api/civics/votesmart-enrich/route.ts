import { type NextRequest, NextResponse } from 'next/server';
import VoteSmartEnrichment from '@/lib/civics-2-0/votesmart-enrichment';

export async function GET(_request: NextRequest) {
  try {
    const enrichment = new VoteSmartEnrichment();
    
    // Get representatives needing enrichment
    const representatives = await enrichment.getRepresentativesNeedingEnrichment();
    
    return NextResponse.json({
      success: true,
      message: 'VoteSmart enrichment ready',
      representativesNeedingEnrichment: representatives.length,
      sampleRepresentatives: representatives.slice(0, 5)
    });
    
  } catch (error) {
    console.error('VoteSmart enrichment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get enrichment status' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  console.log('VoteSmart enrichment request received');
  try {
    const { action, representativeId, votesmartId, batchSize = 10 } = await _request.json();
    const enrichment = new VoteSmartEnrichment();
    
    switch (action) {
      case 'enrich_single':
        if (!representativeId || !votesmartId) {
          return NextResponse.json(
            { success: false, error: 'representativeId and votesmartId required' },
            { status: 400 }
          );
        }
        
        const success = await enrichment.enrichRepresentative(representativeId, votesmartId);
        
        return NextResponse.json({
          success,
          message: success ? 'Representative enriched successfully' : 'Enrichment failed'
        });
        
      case 'enrich_batch':
        const representatives = await enrichment.getRepresentativesNeedingEnrichment();
        const batch = representatives.slice(0, batchSize);
        
        const result = await enrichment.batchEnrichRepresentatives(batch);
        
        return NextResponse.json({
          success: true,
          message: `Batch enrichment complete`,
          results: result
        });
        
      case 'update_votesmart_ids':
        await enrichment.updateVoteSmartIds();
        
        return NextResponse.json({
          success: true,
          message: 'VoteSmart IDs updated from OpenStates data'
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('VoteSmart enrichment error:', error);
    return NextResponse.json(
      { success: false, error: 'Enrichment failed' },
      { status: 500 }
    );
  }
}
