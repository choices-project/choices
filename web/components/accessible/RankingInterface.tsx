// ============================================================================
// PHASE 3: ACCESSIBLE RANKING INTERFACE
// ============================================================================
// Agent A3 - UX/Accessibility Specialist
// 
// This component provides a fully accessible ranking interface for the
// Ranked Choice Democracy Revolution platform.
// 
// Features:
// - WCAG 2.2 AA compliant keyboard navigation
// - Screen reader support with live announcements
// - Focus management and visual indicators
// - Plain language instructions
// - Real-time validation feedback
// 
// Created: January 15, 2025
// Status: Phase 3 Implementation
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  };
}

export type RankingState = {
  rankings: string[];
  focusedIndex: number;
  isDragging: boolean;
  validationErrors: string[];
  validationWarnings: string[];
}

export type RankingInterfaceProps = {
  candidates: Candidate[];
  onRankingChange: (rankings: string[]) => void;
  onValidationChange: (isValid: boolean, errors: string[], warnings: string[]) => void;
  initialRankings?: string[];
  maxRankings?: number;
  allowPartialRanking?: boolean;
  showSocialInsights?: boolean;
  className?: string;
}

// ============================================================================
// ACCESSIBLE RANKING INTERFACE COMPONENT
// ============================================================================

export function AccessibleRankingInterface({
  candidates,
  onRankingChange,
  onValidationChange,
  initialRankings = [],
  maxRankings = candidates.length,
  allowPartialRanking = true,
  showSocialInsights = false,
  className = ''
}: RankingInterfaceProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [state, setState] = useState<RankingState>({
    rankings: initialRankings,
    focusedIndex: 0,
    isDragging: false,
    validationErrors: [],
    validationWarnings: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const candidateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const instructionsRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // VALIDATION LOGIC
  // ============================================================================

  const validateRankings = useCallback((rankings: string[]): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum rankings
    if (rankings.length < 2 && !allowPartialRanking) {
      errors.push('Please rank at least 2 candidates');
    } else if (rankings.length < 2) {
      warnings.push('Ranking more candidates improves accuracy');
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

    // Check maximum rankings
    if (rankings.length > maxRankings) {
      errors.push(`Cannot rank more than ${maxRankings} candidates`);
    }

    // Check if all candidates are ranked
    if (rankings.length < candidates.length) {
      warnings.push(`You can rank all ${candidates.length} candidates for better accuracy`);
    }

    return { errors, warnings };
  }, [candidates, allowPartialRanking, maxRankings]);

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
        rankings: newRankings,
        focusedIndex: newIndex
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
        rankings: newRankings,
        focusedIndex: Math.min(prevState.focusedIndex, newRankings.length - 1)
      };
    });
  }, [candidates]);

  const handleCandidateClick = useCallback((candidateId: string) => {
    toggleCandidateSelection(candidateId);
  }, [toggleCandidateSelection]);

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  const handleKeyboardNavigation = useCallback((event: React.KeyboardEvent, candidateId: string) => {
    ScreenReaderSupport.handleKeyboardNavigation(event as any, {
      onArrowUp: () => moveCandidate(candidateId, 'up'),
      onArrowDown: () => moveCandidate(candidateId, 'down'),
      onEnter: () => toggleCandidateSelection(candidateId),
      onSpace: () => toggleCandidateSelection(candidateId),
      onEscape: () => {
        // Clear focus or close instructions
        if (showInstructions) {
          setShowInstructions(false);
          ScreenReaderSupport.announce('Instructions closed', 'polite');
        }
      },
      onTab: () => {
        // Allow default tab behavior
      }
    });
  }, [moveCandidate, toggleCandidateSelection, showInstructions]);

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  const setFocus = useCallback((index: number) => {
    const element = candidateRefs.current[index];
    if (element) {
      ScreenReaderSupport.setFocus(element, {
        announce: `Focused on ${candidates[index]?.name || 'candidate'}`
      });
    }
  }, [candidates]);

  const handleFocus = useCallback((index: number) => {
    setState(prevState => ({
      ...prevState,
      focusedIndex: index
    }));
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
    
    onValidationChange(validation.errors.length === 0, validation.errors, validation.warnings);
  }, [state.rankings, validateRankings, onValidationChange]);

  // Notify parent of ranking changes
  useEffect(() => {
    onRankingChange(state.rankings);
  }, [state.rankings, onRankingChange]);

  // Initialize candidate refs
  useEffect(() => {
    candidateRefs.current = candidateRefs.current.slice(0, candidates.length);
  }, [candidates.length]);

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

  const getDisplayCandidates = (): Candidate[] => {
    if (isExpanded) return candidates;
    return candidates.slice(0, 3);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      ref={containerRef}
      className={`accessible-ranking-interface ${className}`}
      role="main"
      aria-label="Rank your candidate preferences"
    >
      {/* Header */}
      <div className="ranking-header">
        <h2 id="ranking-title">Rank Your Preferences</h2>
        <p id="ranking-description" className="ranking-description">
          Use the arrow keys or click to rank your candidates. Your first choice gets your vote if they need it.
        </p>
      </div>

      {/* Instructions Toggle */}
      <button
        type="button"
        className="instructions-toggle"
        onClick={() => setShowInstructions(!showInstructions)}
        aria-expanded={showInstructions}
        aria-controls="ranking-instructions"
        aria-describedby="ranking-description"
      >
        {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
      </button>

      {/* Instructions */}
      {showInstructions && (
        <div 
          ref={instructionsRef}
          id="ranking-instructions"
          className="instructions" 
          role="region" 
          aria-label="How to rank candidates"
        >
          <h3>How to Rank</h3>
          <p>
            Click or use arrow keys to move candidates up or down. 
            Your first choice gets your vote if they need it. 
            If they don't need it, your vote goes to your second choice.
          </p>
          <ul>
            <li>Use ↑ and ↓ arrow keys to move candidates</li>
            <li>Press Enter or Space to select a candidate</li>
            <li>Use Tab to move between candidates</li>
            <li>Press Escape to close instructions</li>
          </ul>
        </div>
      )}

      {/* Candidates List */}
      <div 
        className="candidates-list" 
        role="list" 
        aria-labelledby="ranking-title"
        aria-describedby="ranking-description"
      >
        {getDisplayCandidates().map((candidate, index) => (
          <div
            key={candidate.id}
            ref={(el) => { candidateRefs.current[index] = el; }}
            role="listitem"
            tabIndex={state.focusedIndex === index ? 0 : -1}
            className={`candidate-card ${state.focusedIndex === index ? 'focused' : ''} ${isCandidateRanked(candidate.id) ? 'ranked' : ''}`}
            onKeyDown={(e) => handleKeyboardNavigation(e, candidate.id)}
            onClick={() => handleCandidateClick(candidate.id)}
            onFocus={() => handleFocus(index)}
            aria-label={`${candidate.name}, currently ranked ${getCandidateRank(candidate.id)}`}
            aria-describedby={`candidate-${candidate.id}-description`}
            aria-selected={isCandidateRanked(candidate.id)}
          >
            <div className="candidate-info">
              <h3 className="candidate-name">{candidate.name}</h3>
              {candidate.party && (
                <span className="candidate-party" aria-label={`Party: ${candidate.party}`}>
                  {candidate.party}
                </span>
              )}
              <p id={`candidate-${candidate.id}-description`} className="candidate-bio">
                {candidate.bio}
              </p>
              
              {/* Social Insights */}
              {showSocialInsights && candidate.socialInsights && (
                <div className="social-insights" aria-label="Social insights">
                  <span className="insight-item">
                    {candidate.socialInsights.similarUsers} similar users
                  </span>
                  {candidate.socialInsights.crossDemographic.length > 0 && (
                    <span className="insight-item">
                      Popular with: {candidate.socialInsights.crossDemographic.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Rank Indicator */}
            <div 
              className="rank-indicator"
              aria-live="polite"
              aria-atomic="true"
              role="status"
            >
              {isCandidateRanked(candidate.id) ? (
                <>
                  <span className="rank-number" aria-hidden="true">
                    {getCandidateRank(candidate.id)}
                  </span>
                  <span className="sr-only">
                    Rank: {getCandidateRank(candidate.id)}
                  </span>
                </>
              ) : (
                <span className="unranked">Not ranked</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Button */}
      {candidates.length > 3 && (
        <div className="expand-section">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="remaining-candidates"
            className="expand-button"
          >
            {isExpanded ? 'Show Less' : `Add More Rankings (${candidates.length - 3} remaining)`}
          </button>
          
          {isExpanded && (
            <div id="remaining-candidates" className="remaining-candidates">
              <h4>Additional Candidates</h4>
              <p>Adding more rankings improves accuracy and helps ensure your vote counts.</p>
            </div>
          )}
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
        id="ranking-announcements"
      >
        {/* Dynamic announcements will be inserted here */}
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

export default AccessibleRankingInterface;
