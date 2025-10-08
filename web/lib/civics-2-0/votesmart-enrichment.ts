import { createClient } from '@supabase/supabase-js';

// VoteSmart API integration for data enrichment
export class VoteSmartEnrichment {
  private supabase: any;
  private apiKey: string;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.apiKey = process.env.VOTESMART_API_KEY || '';
  }

  // VoteSmart API endpoints
  private readonly VOTESMART_BASE_URL = 'https://api.votesmart.org';
  
  // Get candidate bio from VoteSmart
  async getCandidateBio(votesmartId: string) {
    try {
      const response = await fetch(
        `${this.VOTESMART_BASE_URL}/CandidateBio.getBio?key=${this.apiKey}&candidateId=${votesmartId}&o=JSON`
      );
      const data = await response.json();
      return data.candidateBio;
    } catch (error) {
      console.error('VoteSmart bio error:', error);
      return null;
    }
  }

  // Get candidate ratings from VoteSmart
  async getCandidateRatings(votesmartId: string) {
    try {
      const response = await fetch(
        `${this.VOTESMART_BASE_URL}/Rating.getCandidateRating?key=${this.apiKey}&candidateId=${votesmartId}&o=JSON`
      );
      const data = await response.json();
      return data.rating;
    } catch (error) {
      console.error('VoteSmart ratings error:', error);
      return null;
    }
  }

  // Get candidate positions from VoteSmart
  async getCandidatePositions(votesmartId: string) {
    try {
      const response = await fetch(
        `${this.VOTESMART_BASE_URL}/CandidateBio.getDetailedBio?key=${this.apiKey}&candidateId=${votesmartId}&o=JSON`
      );
      const data = await response.json();
      return data.bio;
    } catch (error) {
      console.error('VoteSmart positions error:', error);
      return null;
    }
  }

  // Get candidate voting records from VoteSmart
  async getCandidateVotingRecord(votesmartId: string) {
    try {
      const response = await fetch(
        `${this.VOTESMART_BASE_URL}/Votes.getByOfficial?key=${this.apiKey}&candidateId=${votesmartId}&o=JSON`
      );
      const data = await response.json();
      return data.votes;
    } catch (error) {
      console.error('VoteSmart voting record error:', error);
      return null;
    }
  }

  // Enrich representative with VoteSmart data
  async enrichRepresentative(representativeId: string, votesmartId: string) {
    try {
      console.log(`🔍 Enriching representative ${representativeId} with VoteSmart ${votesmartId}`);

      // Get all VoteSmart data in parallel
      const [bio, ratings, positions, votingRecord] = await Promise.all([
        this.getCandidateBio(votesmartId),
        this.getCandidateRatings(votesmartId),
        this.getCandidatePositions(votesmartId),
        this.getCandidateVotingRecord(votesmartId)
      ]);

      // Update representative with enriched data
      const { error: updateError } = await this.supabase
        .from('representatives_optimal')
        .update({
          votesmart_id: votesmartId,
          votesmart_bio: bio,
          votesmart_ratings: ratings,
          votesmart_positions: positions,
          votesmart_voting_record: votingRecord,
          data_quality_score: this.calculateEnrichedQuality(bio, ratings, positions, votingRecord),
          data_sources: ['openstates-people', 'votesmart'],
          last_updated: new Date().toISOString()
        })
        .eq('id', representativeId);

      if (updateError) {
        console.error('Error updating representative:', updateError);
        return false;
      }

      console.log(`✅ Successfully enriched representative ${representativeId}`);
      return true;

    } catch (error) {
      console.error('VoteSmart enrichment error:', error);
      return false;
    }
  }

  // Calculate data quality score with VoteSmart enrichment
  private calculateEnrichedQuality(bio: any, ratings: any, positions: any, votingRecord: any) {
    let score = 50; // Base score from OpenStates

    if (bio && bio.candidate) {
      if (bio.candidate.photo) score += 10;
      if (bio.candidate.birthDate) score += 5;
      if (bio.candidate.profession) score += 5;
    }

    if (ratings && ratings.length > 0) score += 15;
    if (positions && positions.issue) score += 10;
    if (votingRecord && votingRecord.length > 0) score += 10;

    return Math.min(score, 100);
  }

  // Get representatives needing VoteSmart enrichment
  async getRepresentativesNeedingEnrichment() {
    const { data, error } = await this.supabase
      .from('representatives_optimal')
      .select('id, name, votesmart_id, data_quality_score')
      .or('votesmart_id.is.null,votesmart_id.eq.')
      .order('data_quality_score', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error getting representatives:', error);
      return [];
    }

    return data;
  }

  // Batch enrich multiple representatives
  async batchEnrichRepresentatives(representatives: any[]) {
    console.log(`🚀 Starting batch enrichment for ${representatives.length} representatives`);

    let successCount = 0;
    let errorCount = 0;

    for (const rep of representatives) {
      if (rep.votesmart_id) {
        const success = await this.enrichRepresentative(rep.id, rep.votesmart_id);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Batch enrichment complete: ${successCount} success, ${errorCount} errors`);
    return { successCount, errorCount };
  }

  // Get VoteSmart ID from OpenStates data
  extractVoteSmartId(openstatesData: any): string | null {
    if (openstatesData.other_identifiers) {
      const votesmartId = openstatesData.other_identifiers.find(
        (id: any) => id.scheme === 'votesmart'
      );
      return votesmartId ? votesmartId.identifier : null;
    }
    return null;
  }

  // Update representatives with VoteSmart IDs from OpenStates data
  async updateVoteSmartIds() {
    console.log('🔍 Updating VoteSmart IDs from OpenStates data...');

    const { data: representatives, error } = await this.supabase
      .from('representatives_optimal')
      .select('id, openstates_raw_data')
      .is('votesmart_id', null);

    if (error) {
      console.error('Error getting representatives:', error);
      return;
    }

    let updatedCount = 0;

    for (const rep of representatives) {
      if (rep.openstates_raw_data) {
        const votesmartId = this.extractVoteSmartId(rep.openstates_raw_data);
        
        if (votesmartId) {
          const { error: updateError } = await this.supabase
            .from('representatives_optimal')
            .update({ votesmart_id: votesmartId })
            .eq('id', rep.id);

          if (!updateError) {
            updatedCount++;
          }
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} representatives with VoteSmart IDs`);
  }
}

export default VoteSmartEnrichment;
