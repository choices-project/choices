// Hybrid Voting Service
// This service handles voting across different privacy levels

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { PrivacyLevel } from './hybrid-privacy'

export interface VoteRequest {
  pollId: string;
  choice: number;
  privacyLevel: PrivacyLevel;
  userId?: string;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  pollId: string;
  voteId?: string;
  auditReceipt?: string;
  privacyLevel: PrivacyLevel;
  responseTime: number;
}

export interface VoteValidation {
  isValid: boolean;
  error?: string;
  requiresAuthentication: boolean;
  requiresTokens: boolean;
}

export class HybridVotingService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(cookies());
  }

  /**
   * Validate vote request based on privacy level
   */
  async validateVoteRequest(request: VoteRequest): Promise<VoteValidation> {
    const { pollId, userId } = request;
    
    // Get poll privacy settings
    if (!this.supabase) { throw new Error('Supabase client not available'); }
    const { data: pollSettings, error: pollError } = await this.supabase
      .rpc('get_poll_privacy_settings', { poll_id_param: pollId })
      .single();

    if (pollError || !pollSettings) {
      return {
        isValid: false,
        error: 'Poll not found or privacy settings unavailable',
        requiresAuthentication: false,
        requiresTokens: false
      };
    }

    // Check if privacy level matches poll settings
    if (pollSettings.privacy_level !== request.privacyLevel) {
      return {
        isValid: false,
        error: `Poll requires ${pollSettings.privacy_level} privacy level`,
        requiresAuthentication: pollSettings.requires_authentication,
        requiresTokens: pollSettings.uses_blinded_tokens
      };
    }

    // Check authentication requirements
    if (pollSettings.requires_authentication && !userId) {
      return {
        isValid: false,
        error: 'Authentication required for this privacy level',
        requiresAuthentication: true,
        requiresTokens: pollSettings.uses_blinded_tokens
      };
    }

    return {
      isValid: true,
      requiresAuthentication: pollSettings.requires_authentication,
      requiresTokens: pollSettings.uses_blinded_tokens
    };
  }

  /**
   * Submit vote based on privacy level
   */
  async submitVote(request: VoteRequest): Promise<VoteResponse> {
    const startTime = Date.now();
    const { pollId, choice, userId } = request;

    // Validate request
    const validation = await this.validateVoteRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Invalid vote request',
        pollId,
        privacyLevel: request.privacyLevel,
        responseTime: Date.now() - startTime
      };
    }

    try {
      switch (request.privacyLevel) {
        case 'public':
          return await this.submitPublicVote(request);
        case 'private':
          return await this.submitPrivateVote(request);
        case 'high-privacy':
          return await this.submitHighPrivacyVote(request);
        default:
          throw new Error(`Unsupported privacy level: ${request.privacyLevel}`);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Vote submission failed',
        pollId,
        privacyLevel: request.privacyLevel,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Submit public vote (fast, simple)
   */
  private async submitPublicVote(request: VoteRequest): Promise<VoteResponse> {
    const startTime = Date.now();
    const { pollId, choice } = request;

    // Simple vote insertion
    if (!this.supabase) { throw new Error('Supabase client not available'); }
    const { data: vote, error } = await this.supabase
      await this.supabase
      .from('po_votes')
      .insert({
        poll_id: pollId,
        choice: choice,
        privacy_level: 'public',
        token: `public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tag: `public_${Date.now()}`,
        merkle_leaf: 'public_vote',
        vote_metadata: {
          method: 'public',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit public vote: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Update poll vote count
    if (!this.supabase) { throw new Error('Supabase client not available'); }
      await this.supabase
      .rpc('update_poll_vote_count', { poll_id_param: pollId });

    return {
      success: true,
      message: 'Public vote submitted successfully',
      pollId,
      voteId: vote?.id || 'unknown',
      privacyLevel: 'public',
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Submit private vote (authenticated, enhanced privacy)
   */
  private async submitPrivateVote(request: VoteRequest): Promise<VoteResponse> {
    const startTime = Date.now();
    const { pollId, choice, userId } = request;

    if (!userId) {
      throw new Error('User authentication required for private votes');
    }

    // Check if user has already voted
    if (!this.supabase) { throw new Error('Supabase client not available'); }
    const { data: existingVote, error: existingVoteError } = await this.supabase
      await this.supabase
      .from('po_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      throw new Error('You have already voted on this poll');
    }

    // Private vote insertion with user tracking
    if (!this.supabase) { throw new Error('Supabase client not available'); }
    const { data: vote, error } = await this.supabase
      await this.supabase
      .from('po_votes')
      .insert({
        poll_id: pollId,
        user_id: userId,
        choice: choice,
        privacy_level: 'private',
        token: `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tag: `private_${userId}_${Date.now()}`,
        merkle_leaf: 'private_vote',
        vote_metadata: {
          method: 'private',
          timestamp: new Date().toISOString(),
          userId: userId
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit private vote: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Update poll vote count
    if (!this.supabase) { throw new Error('Supabase client not available'); }
      await this.supabase
      .rpc('update_poll_vote_count', { poll_id_param: pollId });

    return {
      success: true,
      message: 'Private vote submitted successfully',
      pollId,
      voteId: vote?.id || 'unknown',
      privacyLevel: 'private',
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Submit high-privacy vote (IA/PO services required)
   */
  private async submitHighPrivacyVote(request: VoteRequest): Promise<VoteResponse> {
    const startTime = Date.now();
    const { pollId, choice, userId } = request;

    if (!userId) {
      throw new Error('User authentication required for high-privacy votes');
    }

    try {
      // Step 1: Request blinded token from IA service
      const tokenResponse = await this.requestBlindedToken(pollId, userId);
      
      // Step 2: Submit vote through PO service
      const voteResponse = await this.submitToPOService(pollId, choice, tokenResponse.token, tokenResponse.tag);
      
      return {
        success: true,
        message: 'High-privacy vote submitted successfully',
        pollId,
        voteId: voteResponse.voteId,
        auditReceipt: voteResponse.auditReceipt,
        privacyLevel: 'high-privacy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`High-privacy vote failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error'}`);
    }
  }

  /**
   * Request blinded token from IA service
   */
  private async requestBlindedToken(pollId: string, userId: string): Promise<{ token: string; tag: string }> {
    try {
      // Get user profile to determine tier
      if (!this.supabase) { throw new Error('Supabase client not available'); }
    const { data: userProfile, error: profileError } = await this.supabase
      await this.supabase
        .from('ia_users')
        .select('verification_tier')
        .eq('stable_id', userId)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      const tier = userProfile.verification_tier || 'T1';

      // Request token from IA service
      const response = await fetch('/api/ia/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_stable_id: userId,
          poll_id: pollId,
          tier,
          scope: `poll:${pollId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get token: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      return {
        token: tokenData.token,
        tag: tokenData.tag
      };
    } catch (error) {
      console.error('Error requesting blinded token:', error);
      throw new Error(`Token request failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error'}`);
    }
  }

  /**
   * Submit vote to PO service
   */
  private async submitToPOService(pollId: string, choice: number, token: string, tag: string): Promise<{ voteId: string; auditReceipt: string }> {
    try {
      // Submit vote to PO service
      const response = await fetch(`/api/po/votes?poll_id=${pollId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          tag,
          choice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit vote: ${response.statusText}`);
      }

      const voteData = await response.json();
      
      return {
        voteId: voteData.vote_id || `vote_${Date.now()}`,
        auditReceipt: voteData.audit_receipt || `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Error submitting vote to PO service:', error);
      throw new Error(`Vote submission failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error'}`);
    }
  }
}
