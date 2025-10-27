/**
 * FEC Service
 * 
 * Service for Federal Election Commission data operations
 * Handles campaign finance transparency, independence scoring, and "bought off" detection
 */

import { createClient } from '@supabase/supabase-js';

export interface FECCycle {
  cycle: number;
  cycle_name: string;
  start_date: string;
  end_date: string;
  election_date: string;
  is_current: boolean;
  is_upcoming: boolean;
  is_completed: boolean;
  data_available: boolean;
}

export interface FECCandidate {
  candidate_id: string;
  name: string;
  office?: string;
  party?: string;
  state?: string;
  district?: string;
  incumbent_challenge_status?: string;
  candidate_status?: string;
  candidate_inactive?: string;
  election_years: number[];
  election_districts: string[];
  first_file_date?: string;
  last_file_date?: string;
  last_f2_date?: string;
  active_through?: number;
  principal_committees: string[];
  authorized_committees: string[];
  total_receipts: number;
  total_disbursements: number;
  cash_on_hand: number;
  debt: number;
  last_updated: string;
  created_at: string;
  data_source: string;
  is_efiling: boolean;
  is_processed: boolean;
}

export interface FECCommittee {
  committee_id: string;
  committee_name: string;
  committee_type?: string;
  committee_designation?: string;
  committee_organization_type?: string;
  committee_party?: string;
  committee_state?: string;
  committee_district?: string;
  treasurer_name?: string;
  treasurer_city?: string;
  treasurer_state?: string;
  treasurer_zip?: string;
  custodian_name?: string;
  custodian_city?: string;
  custodian_state?: string;
  custodian_zip?: string;
  street_1?: string;
  street_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  candidate_id?: string;
  candidate_name?: string;
  candidate_office?: string;
  candidate_state?: string;
  candidate_district?: string;
  candidate_party?: string;
  candidate_status?: string;
  candidate_incumbent_challenge_status?: string;
  first_file_date?: string;
  last_file_date?: string;
  last_f1_date?: string;
  organization_type?: string;
  organization_type_full?: string;
  designation?: string;
  designation_full?: string;
  committee_type_full?: string;
  party_full?: string;
  filing_frequency?: string;
  filing_frequency_full?: string;
  cycles: number[];
  total_receipts: number;
  total_disbursements: number;
  cash_on_hand: number;
  debt: number;
  last_updated: string;
  created_at: string;
  data_source: string;
  is_efiling: boolean;
  is_processed: boolean;
}

export interface FECContribution {
  id: string;
  committee_id: string;
  candidate_id?: string;
  contributor_name?: string;
  contributor_name_normalized?: string;
  contributor_city?: string;
  contributor_state?: string;
  contributor_zip?: string;
  contributor_employer?: string;
  contributor_occupation?: string;
  contributor_organization_name?: string;
  contributor_organization_type?: string;
  contributor_committee_id?: string;
  contributor_committee_name?: string;
  contributor_committee_type?: string;
  contributor_committee_designation?: string;
  contributor_committee_organization_type?: string;
  contributor_committee_party?: string;
  contributor_committee_state?: string;
  contributor_committee_district?: string;
  amount: number;
  contribution_date: string;
  contribution_type?: string;
  contribution_type_desc?: string;
  memo_code?: string;
  memo_text?: string;
  receipt_type?: string;
  receipt_type_desc?: string;
  receipt_type_full?: string;
  line_number?: string;
  transaction_id?: string;
  file_number?: string;
  report_type?: string;
  report_type_full?: string;
  report_year?: number;
  two_year_transaction_period: number;
  cycle: number;
  sub_id?: string;
  link_id?: string;
  image_number?: string;
  file_number_raw?: string;
  is_individual?: boolean;
  is_corporate?: boolean;
  is_pac?: boolean;
  is_party?: boolean;
  is_self_financing?: boolean;
  sector?: string;
  industry?: string;
  last_updated: string;
  created_at: string;
  data_source: string;
  is_efiling: boolean;
  is_processed: boolean;
  provenance: Record<string, any>;
}

export interface FECDisbursement {
  id: string;
  committee_id: string;
  candidate_id?: string;
  recipient_name?: string;
  recipient_name_normalized?: string;
  recipient_city?: string;
  recipient_state?: string;
  recipient_zip?: string;
  recipient_employer?: string;
  recipient_occupation?: string;
  recipient_organization_name?: string;
  recipient_organization_type?: string;
  recipient_committee_id?: string;
  recipient_committee_name?: string;
  recipient_committee_type?: string;
  recipient_committee_designation?: string;
  recipient_committee_organization_type?: string;
  recipient_committee_party?: string;
  recipient_committee_state?: string;
  recipient_committee_district?: string;
  amount: number;
  disbursement_date: string;
  disbursement_type?: string;
  disbursement_type_desc?: string;
  memo_code?: string;
  memo_text?: string;
  receipt_type?: string;
  receipt_type_desc?: string;
  receipt_type_full?: string;
  line_number?: string;
  transaction_id?: string;
  file_number?: string;
  report_type?: string;
  report_type_full?: string;
  report_year?: number;
  two_year_transaction_period: number;
  cycle: number;
  sub_id?: string;
  link_id?: string;
  image_number?: string;
  file_number_raw?: string;
  purpose?: string;
  purpose_desc?: string;
  category?: string;
  category_desc?: string;
  last_updated: string;
  created_at: string;
  data_source: string;
  is_efiling: boolean;
  is_processed: boolean;
  provenance: Record<string, any>;
}

export interface FECIndependentExpenditure {
  id: string;
  committee_id: string;
  candidate_id?: string;
  candidate_name?: string;
  candidate_office?: string;
  candidate_state?: string;
  candidate_district?: string;
  candidate_party?: string;
  candidate_status?: string;
  candidate_incumbent_challenge_status?: string;
  spender_name?: string;
  spender_city?: string;
  spender_state?: string;
  spender_zip?: string;
  spender_employer?: string;
  spender_occupation?: string;
  spender_organization_name?: string;
  spender_organization_type?: string;
  spender_committee_id?: string;
  spender_committee_name?: string;
  spender_committee_type?: string;
  spender_committee_designation?: string;
  spender_committee_organization_type?: string;
  spender_committee_party?: string;
  spender_committee_state?: string;
  spender_committee_district?: string;
  amount: number;
  expenditure_date: string;
  expenditure_type?: string;
  expenditure_type_desc?: string;
  memo_code?: string;
  memo_text?: string;
  receipt_type?: string;
  receipt_type_desc?: string;
  receipt_type_full?: string;
  line_number?: string;
  transaction_id?: string;
  file_number?: string;
  report_type?: string;
  report_type_full?: string;
  report_year?: number;
  two_year_transaction_period: number;
  cycle: number;
  sub_id?: string;
  link_id?: string;
  image_number?: string;
  file_number_raw?: string;
  purpose?: string;
  purpose_desc?: string;
  category?: string;
  category_desc?: string;
  support_oppose_indicator?: string;
  support_oppose_indicator_desc?: string;
  last_updated: string;
  created_at: string;
  data_source: string;
  is_efiling: boolean;
  is_processed: boolean;
  provenance: Record<string, any>;
}

export interface CandidateCommittee {
  fec_committee_id: string;
  committee_name: string;
  designation: string;
  committee_type?: string;
  total_receipts: number;
  total_disbursements: number;
  cash_on_hand: number;
  debt: number;
}

export interface IndependenceScore {
  candidate_id: string;
  cycle: number;
  score: number; // 0-1, higher = more independent
  pac_percentage: number;
  party_percentage: number;
  corporate_percentage: number;
  individual_percentage: number;
  total_contributions: number;
  methodology_version: string;
  calculated_at: string;
}

export interface EFileVsProcessedSummary {
  table_name: string;
  total_records: number;
  efiling_records: number;
  processed_records: number;
  efiling_percentage: number;
  processed_percentage: number;
}

export interface FECIngestCursor {
  source: string;
  cycle: number;
  cursor_type: string;
  cursor_value: string;
  last_updated: string;
  created_at: string;
}

export class FECService {
  private _supabase: any = null;

  private get supabase() {
    if (!this._supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      this._supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this._supabase;
  }

  /**
   * Get FEC cycle information
   */
  async getFECCycle(cycle: number): Promise<FECCycle | null> {
    try {
      const { data, error } = await this.supabase
        .from('fec_cycles')
        .select('*')
        .eq('cycle', cycle)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw new Error(`Failed to get FEC cycle: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`FEC cycle lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all FEC cycles
   */
  async getAllFECCycles(): Promise<FECCycle[]> {
    try {
      const { data, error } = await this.supabase
        .from('fec_cycles')
        .select('*')
        .order('cycle', { ascending: false });

      if (error) {
        throw new Error(`Failed to get FEC cycles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`FEC cycles lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current FEC cycle
   */
  async getCurrentFECCycle(): Promise<FECCycle | null> {
    try {
      const { data, error } = await this.supabase
        .from('fec_cycles')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No current cycle found
        }
        throw new Error(`Failed to get current FEC cycle: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Current FEC cycle lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get FEC candidate by ID
   */
  async getFECCandidate(candidateId: string): Promise<FECCandidate | null> {
    try {
      const { data, error } = await this.supabase
        .from('fec_candidates')
        .select('*')
        .eq('candidate_id', candidateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw new Error(`Failed to get FEC candidate: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`FEC candidate lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get FEC committee by ID
   */
  async getFECCommittee(committeeId: string): Promise<FECCommittee | null> {
    try {
      const { data, error } = await this.supabase
        .from('fec_committees')
        .select('*')
        .eq('committee_id', committeeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw new Error(`Failed to get FEC committee: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`FEC committee lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get candidate committees for a specific cycle
   */
  async getCandidateCommittees(candidateId: string, cycle: number): Promise<CandidateCommittee[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_candidate_committees', {
          candidate_id: candidateId,
          cycle_year: cycle
        });

      if (error) {
        throw new Error(`Failed to get candidate committees: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Candidate committees lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate independence score for a candidate
   */
  async calculateIndependenceScore(candidateId: string, cycle: number): Promise<IndependenceScore> {
    try {
      // Get the raw score from the database function
      const { data: scoreData, error: scoreError } = await this.supabase
        .rpc('calculate_independence_score', {
          candidate_id: candidateId,
          cycle_year: cycle
        });

      if (scoreError) {
        throw new Error(`Failed to calculate independence score: ${scoreError.message}`);
      }

      const score = scoreData || 0;

      // Get detailed contribution breakdown
      const { data: contributions, error: contribError } = await this.supabase
        .from('fec_contributions')
        .select('amount, is_pac, is_party, is_corporate, is_individual')
        .eq('candidate_id', candidateId)
        .eq('cycle', cycle);

      if (contribError) {
        throw new Error(`Failed to get contribution breakdown: ${contribError.message}`);
      }

      const totalAmount = contributions?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
      const pacAmount = contributions?.filter((c: any) => c.is_pac).reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
      const partyAmount = contributions?.filter((c: any) => c.is_party).reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
      const corporateAmount = contributions?.filter((c: any) => c.is_corporate).reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
      const individualAmount = contributions?.filter((c: any) => c.is_individual).reduce((sum: number, c: any) => sum + c.amount, 0) || 0;

      return {
        candidate_id: candidateId,
        cycle,
        score,
        pac_percentage: totalAmount > 0 ? pacAmount / totalAmount : 0,
        party_percentage: totalAmount > 0 ? partyAmount / totalAmount : 0,
        corporate_percentage: totalAmount > 0 ? corporateAmount / totalAmount : 0,
        individual_percentage: totalAmount > 0 ? individualAmount / totalAmount : 0,
        total_contributions: totalAmount,
        methodology_version: '1.0',
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Independence score calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get contributions for a candidate
   */
  async getCandidateContributions(
    candidateId: string,
    cycle: number,
    options: {
      limit?: number;
      offset?: number;
      minAmount?: number;
      maxAmount?: number;
      contributorType?: 'individual' | 'pac' | 'party' | 'corporate';
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<FECContribution[]> {
    try {
      let query = this.supabase
        .from('fec_contributions')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('cycle', cycle);

      if (options.minAmount) {
        query = query.gte('amount', options.minAmount);
      }

      if (options.maxAmount) {
        query = query.lte('amount', options.maxAmount);
      }

      if (options.contributorType) {
        const typeField = `is_${options.contributorType}`;
        query = query.eq(typeField, true);
      }

      if (options.dateRange) {
        query = query
          .gte('contribution_date', options.dateRange.start)
          .lte('contribution_date', options.dateRange.end);
      }

      query = query.order('contribution_date', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get candidate contributions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Candidate contributions lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get disbursements for a candidate
   */
  async getCandidateDisbursements(
    candidateId: string,
    cycle: number,
    options: {
      limit?: number;
      offset?: number;
      minAmount?: number;
      maxAmount?: number;
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<FECDisbursement[]> {
    try {
      let query = this.supabase
        .from('fec_disbursements')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('cycle', cycle);

      if (options.minAmount) {
        query = query.gte('amount', options.minAmount);
      }

      if (options.maxAmount) {
        query = query.lte('amount', options.maxAmount);
      }

      if (options.dateRange) {
        query = query
          .gte('disbursement_date', options.dateRange.start)
          .lte('disbursement_date', options.dateRange.end);
      }

      query = query.order('disbursement_date', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get candidate disbursements: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Candidate disbursements lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get independent expenditures for a candidate
   */
  async getCandidateIndependentExpenditures(
    candidateId: string,
    cycle: number,
    options: {
      limit?: number;
      offset?: number;
      supportOppose?: 'support' | 'oppose';
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<FECIndependentExpenditure[]> {
    try {
      let query = this.supabase
        .from('fec_independent_expenditures')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('cycle', cycle);

      if (options.supportOppose) {
        query = query.eq('support_oppose_indicator', options.supportOppose.toUpperCase());
      }

      if (options.dateRange) {
        query = query
          .gte('expenditure_date', options.dateRange.start)
          .lte('expenditure_date', options.dateRange.end);
      }

      query = query.order('expenditure_date', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get candidate independent expenditures: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Candidate independent expenditures lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get e-filing vs processed data summary
   */
  async getEFileVsProcessedSummary(cycle: number): Promise<EFileVsProcessedSummary[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_efiling_vs_processed_summary', { cycle_year: cycle });

      if (error) {
        throw new Error(`Failed to get e-filing vs processed summary: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`E-filing vs processed summary lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get ingest cursor for a source and cycle
   */
  async getIngestCursor(source: string, cycle: number, cursorType: string): Promise<FECIngestCursor | null> {
    try {
      const { data, error } = await this.supabase
        .from('fec_ingest_cursors')
        .select('*')
        .eq('source', source)
        .eq('cycle', cycle)
        .eq('cursor_type', cursorType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw new Error(`Failed to get ingest cursor: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Ingest cursor lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update ingest cursor
   */
  async updateIngestCursor(source: string, cycle: number, cursorType: string, cursorValue: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('fec_ingest_cursors')
        .upsert({
          source,
          cycle,
          cursor_type: cursorType,
          cursor_value: cursorValue,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'source,cycle,cursor_type'
        });

      if (error) {
        throw new Error(`Failed to update ingest cursor: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Ingest cursor update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get FEC system statistics
   */
  async getFECStats(): Promise<{
    total_candidates: number;
    total_committees: number;
    total_contributions: number;
    total_disbursements: number;
    total_independent_expenditures: number;
    current_cycle: number;
    cycles_available: number[];
    efiling_percentage: number;
    processed_percentage: number;
  }> {
    try {
      const [candidatesCount, committeesCount, contributionsCount, disbursementsCount, ieCount, currentCycle, cycles] = await Promise.all([
        this.supabase.from('fec_candidates').select('*', { count: 'exact', head: true }),
        this.supabase.from('fec_committees').select('*', { count: 'exact', head: true }),
        this.supabase.from('fec_contributions').select('*', { count: 'exact', head: true }),
        this.supabase.from('fec_disbursements').select('*', { count: 'exact', head: true }),
        this.supabase.from('fec_independent_expenditures').select('*', { count: 'exact', head: true }),
        this.getCurrentFECCycle(),
        this.getAllFECCycles()
      ]);

      const currentCycleYear = currentCycle?.cycle || 2024;
      const efilingSummary = await this.getEFileVsProcessedSummary(currentCycleYear);

      const totalRecords = efilingSummary.reduce((sum, s) => sum + s.total_records, 0);
      const totalEFiling = efilingSummary.reduce((sum, s) => sum + s.efiling_records, 0);
      const totalProcessed = efilingSummary.reduce((sum, s) => sum + s.processed_records, 0);

      return {
        total_candidates: candidatesCount.count || 0,
        total_committees: committeesCount.count || 0,
        total_contributions: contributionsCount.count || 0,
        total_disbursements: disbursementsCount.count || 0,
        total_independent_expenditures: ieCount.count || 0,
        current_cycle: currentCycleYear,
        cycles_available: cycles.map(c => c.cycle),
        efiling_percentage: totalRecords > 0 ? (totalEFiling / totalRecords) * 100 : 0,
        processed_percentage: totalRecords > 0 ? (totalProcessed / totalRecords) * 100 : 0
      };
    } catch (error) {
      throw new Error(`FEC stats lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const fecService = new FECService();
