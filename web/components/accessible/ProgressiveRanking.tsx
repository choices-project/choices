// ============================================================================
// PHASE 3: PROGRESSIVE RANKING INTERFACE
// ============================================================================
// Agent A3 - UX/Accessibility Specialist
// 
// This component provides a progressive disclosure ranking interface for the
// Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Top 3 initial view with expansion
// - Progressive disclosure of additional candidates
// - Social insights integration
// - Real-time validation
// - Accessibility compliance
// 
// Created: January 15, 2025
// Status: Phase 3 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { ScreenReaderSupport } from '../../lib/accessibility/screen-reader';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type Candidate = {
  id: string;
  name: string;
  bio: string;
  party?: string;
  image?: string;
  website?: string;
  socialInsights?: {
    similarUsers: number;
    crossDemographic: string[];
    crossInterest: string[];
    confidence: number;
  };
}

export type UserInterests = {
  demographics: string[];
  interests: string[];
  location: string;
  ageGroup: string;
}

export type ProgressiveRankingProps = {
  candidates: Candidate[];
  userInterests: UserInterests;
  onRankingChange: (rankings: string[]) => void;
  onValidationChange: (isValid: boolean, errors: string[], warnings: string[]) => void;
  initialRankings?: string[];
  maxInitialCandidates?: number;
  showSocialInsights?: boolean;
  className?: string;
}

export type RankingState = {
  rankings: string[];
  showAll: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  expandedCandidates: Set<string>;
}

// ============================================================================
// PROGRESSIVE RANKING COMPONENT
// ============================================================================

export function ProgressiveRanking({
  candidates,
  userInterests,
  onRankingChange,
  onValidationChange,
  initialRankings = [],
  maxInitialCandidates = 3,
  showSocialInsights = true,
  className = ''
}: ProgressiveRankingProps) {
  // ============================================================================
  // REFS FOR STABLE CALLBACK PROPS
  // ============================================================================
  
  const onRankingChangeRef = useRef(onRankingChange);
  useEffect(() => { onRankingChangeRef.current = onRankingChange; }, [onRankingChange]);
  const onValidationChangeRef = useRef(onValidationChange);
  useEffect(() => { onValidationChangeRef.current = onValidationChange; }, [onValidationChange]);
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [state, setState] = useState<RankingState>({
    rankings: initialRankings,
    showAll: false,
    validationErrors: [],
    validationWarnings: [],
    expandedCandidates: new Set()
  });

  const [showInstructions, setShowInstructions] = useState(true);
  const [_showSocialInsightsState, setShowSocialInsights] = useState(showSocialInsights);

  // ============================================================================
  // CANDIDATE ORGANIZATION
  // ============================================================================

  const getInitialCandidates = (): Candidate[] => {
    return candidates.slice(0, maxInitialCandidates);
  };

  const getRemainingCandidates = (): Candidate[] => {
    return candidates.slice(maxInitialCandidates);
  };

  const getSocialInsights = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate?.socialInsights;
  };

  // ============================================================================
  // VALIDATION LOGIC
  // ============================================================================

  const validateRankings = useCallback((rankings: string[]): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum rankings
    if (rankings.length < 2) {
      errors.push('Please rank at least 2 candidates');
    } else if (rankings.length < 3) {
      warnings.push('Ranking at least 3 candidates improves accuracy');
    }

    // Check for duplicates
    const uniqueRankings = new Set(rankings);
    if (uniqueRankings.size !== rankings.length) {
      errors.push('Each candidate can only be ranked once');
    }

    // Check for invalid candidates
    const validCandidateIds = candidates.map(c => c.id);
    const invalidIds = rankings.filter(id => !validCandidateIds.includes(id));
    if (invalidIds.length > 0) {
      errors.push(`Invalid candidates: ${invalidIds.join(', ')}`);
    }

    // Check if all candidates are ranked
    if (rankings.length < candidates.length) {
      warnings.push(`You can rank all ${candidates.length} candidates for better accuracy`);
    }

    return { errors, warnings };
  }, [candidates]);

  // ============================================================================
  // RANKING LOGIC
  // ============================================================================

  const moveCandidate = useCallback((candidateId: string, direction: 'up' | 'down') => {
    setState(prevState => {
      const currentIndex = prevState.rankings.indexOf(candidateId);
      if (currentIndex === -1) return prevState;

      const newRankings = [...prevState.rankings];
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      // Check bounds
      if (newIndex < 0 || newIndex >= newRankings.length) {
        return prevState;
      }

      // Swap candidates
      const currentCandidate = newRankings[currentIndex];
      const newCandidate = newRankings[newIndex];
      if (currentCandidate !== undefined && newCandidate !== undefined) {
        newRankings[currentIndex] = newCandidate;
        newRankings[newIndex] = currentCandidate;
      }

      // Announce the change
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        ScreenReaderSupport.announceRankingChange(candidate.name, newIndex + 1, newRankings.length);
      }

      return {
        ...prevState,
        rankings: newRankings
      };
    });
  }, [candidates]);

  const toggleCandidateSelection = useCallback((candidateId: string) => {
    setState(prevState => {
      const currentIndex = prevState.rankings.indexOf(candidateId);
      let newRankings: string[];

      if (currentIndex === -1) {
        // Add candidate to rankings
        newRankings = [...prevState.rankings, candidateId];
      } else {
        // Remove candidate from rankings
        newRankings = prevState.rankings.filter(id => id !== candidateId);
      }

      // Announce the change
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        const action = currentIndex === -1 ? 'added to' : 'removed from';
        ScreenReaderSupport.announce(`${candidate.name} ${action} your ranking`, 'polite');
      }

      return {
        ...prevState,
        rankings: newRankings
      };
    });
  }, [candidates]);

  const toggleCandidateExpansion = useCallback((candidateId: string) => {
    setState(prevState => {
      const newExpanded = new Set(prevState.expandedCandidates);
      if (newExpanded.has(candidateId)) {
        newExpanded.delete(candidateId);
      } else {
        newExpanded.add(candidateId);
      }

      return {
        ...prevState,
        expandedCandidates: newExpanded
      };
    });
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Update validation when rankings change
  useEffect(() => {
    const validation = validateRankings(state.rankings);
    setState(prevState => ({
      ...prevState,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings
    }));
    
    onValidationChangeRef.current(validation.errors.length === 0, validation.errors, validation.warnings);
  }, [state.rankings, validateRankings]);  

  // Notify parent of ranking changes
  useEffect(() => {
    onRankingChangeRef.current(state.rankings);
  }, [state.rankings]);  

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getCandidateRank = (candidateId: string): number => {
    const index = state.rankings.indexOf(candidateId);
    return index === -1 ? 0 : index + 1;
  };

  const isCandidateRanked = (candidateId: string): boolean => {
    return state.rankings.includes(candidateId);
  };

  const isCandidateExpanded = (candidateId: string): boolean => {
    return state.expandedCandidates.has(candidateId);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`progressive-ranking ${className}`}>
      {/* Header */}
      <div className="progressive-header">
        <h2>Rank Your Preferences</h2>
        <p className="progressive-description">
          Start by ranking your top {maxInitialCandidates} candidates. You can add more later.
        </p>
      </div>

      {/* Instructions Toggle */}
      <button
        type="button"
        className="instructions-toggle"
        onClick={() => setShowInstructions(!showInstructions)}
        aria-expanded={showInstructions}
        aria-controls="progressive-instructions"
      >
        {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
      </button>

      {/* Instructions */}
      {showInstructions && (
        <div 
          id="progressive-instructions"
          className="progressive-instructions" 
          role="region" 
          aria-label="How to rank candidates"
        >
          <h3>How to Rank</h3>
          <p>
            Click or use arrow keys to move candidates up or down. 
            Your first choice gets your vote if they need it. 
            If they don&apos;t need it, your vote goes to your second choice.
          </p>
          <ul>
            <li>Use ↑ and ↓ arrow keys to move candidates</li>
            <li>Press Enter or Space to select a candidate</li>
            <li>Use Tab to move between candidates</li>
            <li>Click &quot;Add More Rankings&quot; to see all candidates</li>
          </ul>
        </div>
      )}

      {/* Initial Candidates */}
      <div className="initial-candidates">
        <h3>Rank Your Top {maxInitialCandidates}</h3>
        <p>Start with your top {maxInitialCandidates} choices. You can add more later.</p>
        
        <div className="candidates-list" role="list" aria-label="Top candidates">
          {getInitialCandidates().map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              rank={getCandidateRank(candidate.id)}
              isRanked={isCandidateRanked(candidate.id)}
              isExpanded={isCandidateExpanded(candidate.id)}
              userInterests={userInterests}
              socialInsights={getSocialInsights(candidate.id)}
              showSocialInsights={showSocialInsights}
              onRankChange={moveCandidate}
              onSelectionToggle={toggleCandidateSelection}
              onExpansionToggle={toggleCandidateExpansion}
            />
          ))}
        </div>
      </div>

      {/* Expand Section */}
      {getRemainingCandidates().length > 0 && (
        <div className="expand-section">
          <button
            type="button"
            onClick={() => setState(prevState => ({ ...prevState, showAll: !prevState.showAll }))}
            aria-expanded={state.showAll}
            aria-controls="remaining-candidates"
            className="expand-button"
          >
            {state.showAll ? 'Show Less' : `Add More Rankings (${getRemainingCandidates().length} remaining)`}
          </button>
          
          {state.showAll && (
            <div id="remaining-candidates" className="remaining-candidates">
              <h4>Additional Candidates</h4>
              <p>Adding more rankings improves accuracy and helps ensure your vote counts.</p>
              
              <div className="candidates-list" role="list" aria-label="Additional candidates">
                {getRemainingCandidates().map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={getCandidateRank(candidate.id)}
                    isRanked={isCandidateRanked(candidate.id)}
                    isExpanded={isCandidateExpanded(candidate.id)}
                    userInterests={userInterests}
                    socialInsights={getSocialInsights(candidate.id)}
                    showSocialInsights={showSocialInsights}
                    onRankChange={moveCandidate}
                    onSelectionToggle={toggleCandidateSelection}
                    onExpansionToggle={toggleCandidateExpansion}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Insights Toggle */}
      {showSocialInsights && (
        <div className="social-insights-toggle">
          <button
            type="button"
            onClick={() => setShowSocialInsights(!showSocialInsights)}
            className="toggle-social-insights"
          >
            {showSocialInsights ? 'Hide Social Insights' : 'Show Social Insights'}
          </button>
        </div>
      )}

      {/* Validation Section */}
      <ValidationSection 
        errors={state.validationErrors}
        warnings={state.validationWarnings}
        rankings={state.rankings}
        totalCandidates={candidates.length}
      />

      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="progressive-announcements"
      >
        {/* Dynamic announcements will be inserted here */}
      </div>
    </div>
  );
}

// ============================================================================
// CANDIDATE CARD COMPONENT
// ============================================================================

type CandidateCardProps = {
  candidate: Candidate;
  rank: number;
  isRanked: boolean;
  isExpanded: boolean;
  userInterests: UserInterests;
  socialInsights?: Candidate['socialInsights'];
  showSocialInsights: boolean;
  onRankChange: (candidateId: string, direction: 'up' | 'down') => void;
  onSelectionToggle: (candidateId: string) => void;
  onExpansionToggle: (candidateId: string) => void;
}

function CandidateCard({
  candidate,
  rank,
  isRanked,
  isExpanded,
  socialInsights,
  showSocialInsights,
  onRankChange,
  onSelectionToggle,
  onExpansionToggle
}: CandidateCardProps) {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    ScreenReaderSupport.handleKeyboardNavigation(event.nativeEvent, {
      onArrowUp: () => onRankChange(candidate.id, 'up'),
      onArrowDown: () => onRankChange(candidate.id, 'down'),
      onEnter: () => onSelectionToggle(candidate.id),
      onSpace: () => onSelectionToggle(candidate.id),
      onEscape: () => onExpansionToggle(candidate.id)
    });
  };

  return (
    <div
      className={`candidate-card ${focused ? 'focused' : ''} ${isRanked ? 'ranked' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => onSelectionToggle(candidate.id)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={`${candidate.name}, currently ranked ${rank}`}
      aria-pressed={isRanked}
      data-selected={isRanked}
    >
      <div className="candidate-info">
        <h4 className="candidate-name">{candidate.name}</h4>
        {candidate.party && (
          <span className="candidate-party">({candidate.party})</span>
        )}
        
        <p className="candidate-bio">
          {isExpanded ? candidate.bio : `${candidate.bio.substring(0, 100)}...`}
        </p>
        
        {candidate.bio.length > 100 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpansionToggle(candidate.id);
            }}
            className="expand-bio-button"
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
        
        {/* Social Insights */}
        {showSocialInsights && socialInsights && (
          <div className="social-insights" aria-label="Social insights">
            <div className="insight-item">
              <span className="insight-label">Similar users:</span>
              <span className="insight-value">{socialInsights.similarUsers}</span>
            </div>
            
            {socialInsights.crossDemographic.length > 0 && (
              <div className="insight-item">
                <span className="insight-label">Popular with:</span>
                <span className="insight-value">{socialInsights.crossDemographic.join(', ')}</span>
              </div>
            )}
            
            {socialInsights.crossInterest.length > 0 && (
              <div className="insight-item">
                <span className="insight-label">Interests:</span>
                <span className="insight-value">{socialInsights.crossInterest.join(', ')}</span>
              </div>
            )}
            
            <div className="insight-item">
              <span className="insight-label">Confidence:</span>
              <span className="insight-value">{Math.round(socialInsights.confidence * 100)}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Rank Indicator */}
      <div className="rank-indicator">
        {isRanked ? (
          <>
            <span className="rank-number" aria-hidden="true">{rank}</span>
            <span className="sr-only">Rank: {rank}</span>
          </>
        ) : (
          <span className="unranked">Not ranked</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VALIDATION SECTION COMPONENT
// ============================================================================

type ValidationSectionProps = {
  errors: string[];
  warnings: string[];
  rankings: string[];
  totalCandidates: number;
}

function ValidationSection({ errors, warnings, rankings, totalCandidates }: ValidationSectionProps) {
  return (
    <div className="validation-section" role="region" aria-label="Ranking validation">
      {/* Errors */}
      {errors.map((error, index) => (
        <div
          key={`error-${index}`}
          className="validation-error"
          role="alert"
          aria-live="assertive"
        >
          <span className="error-icon" aria-hidden="true">❌</span>
          <span className="error-message">{error}</span>
        </div>
      ))}
      
      {/* Warnings */}
      {warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="validation-warning"
          role="alert"
          aria-live="polite"
        >
          <span className="warning-icon" aria-hidden="true">⚠️</span>
          <span className="warning-message">{warning}</span>
        </div>
      ))}
      
      {/* Success */}
      {errors.length === 0 && rankings.length >= 2 && (
        <div className="validation-success" role="status">
          <span className="success-icon" aria-hidden="true">✅</span>
          <span className="success-message">
            Your ranking is ready to submit! ({rankings.length} of {totalCandidates} candidates ranked)
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTED COMPONENT
// ============================================================================

export default ProgressiveRanking;
