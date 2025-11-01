// ============================================================================
// PHASE 3: LOW-BANDWIDTH RANKING FORM
// ============================================================================
// Agent A3 - UX/Accessibility Specialist
// 
// This component provides a low-bandwidth, HTML-only ranking form for the
// Ranked Choice Democracy Revolution platform.
// 
// Features:
// - HTML-only form (no JavaScript required)
// - SMS fallback system
// - Progressive enhancement
// - Accessibility compliance
// - Offline capability
// 
// Created: January 15, 2025
// Status: Phase 3 Implementation
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';

import { ScreenReaderSupport } from '../../lib/accessibility/screen-reader';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type Candidate = {
  id: string;
  name: string;
  bio: string;
  party?: string;
  website?: string;
}

export type LowBandwidthRankingFormProps = {
  pollId: string;
  candidates: Candidate[];
  onSubmit: (rankings: Record<string, number>) => Promise<boolean>;
  onValidationChange: (isValid: boolean, errors: string[]) => void;
  showSMSFallback?: boolean;
  smsNumber?: string;
  className?: string;
}

export type FormState = {
  rankings: Record<string, number>;
  errors: string[];
  isSubmitting: boolean;
  isSubmitted: boolean;
  submissionError?: string;
}

// ============================================================================
// LOW-BANDWIDTH RANKING FORM COMPONENT
// ============================================================================

export function LowBandwidthRankingForm({
  pollId,
  candidates,
  onSubmit,
  onValidationChange,
  showSMSFallback = true,
  smsNumber = '1-800-VOTE-NOW',
  className = ''
}: LowBandwidthRankingFormProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [state, setState] = useState<FormState>({
    rankings: {},
    errors: [],
    isSubmitting: false,
    isSubmitted: false
  });

  const [showInstructions, setShowInstructions] = useState(true);
  const [showSMSInstructions, setShowSMSInstructions] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // VALIDATION LOGIC
  // ============================================================================

  const validateForm = (rankings: Record<string, number>): string[] => {
    const errors: string[] = [];
    const values = Object.values(rankings).filter(v => v > 0);
    const uniqueValues = new Set(values);

    // Check minimum rankings
    if (values.length < 2) {
      errors.push('Please rank at least 2 candidates');
    }

    // Check for duplicates
    if (uniqueValues.size !== values.length) {
      errors.push('Each candidate can only be ranked once');
    }

    // Check for gaps in ranking
    const sortedValues = values.sort((a, b) => a - b);
    for (let i = 0; i < sortedValues.length; i++) {
      if (sortedValues[i] !== i + 1) {
        errors.push('Please use consecutive ranking numbers starting from 1');
        break;
      }
    }

    // Check for invalid rankings
    const invalidRankings = values.filter(v => v < 1 || v > candidates.length);
    if (invalidRankings.length > 0) {
      errors.push('Rankings must be between 1 and ' + candidates.length);
    }

    return errors;
  };

  // ============================================================================
  // FORM HANDLING
  // ============================================================================

  const handleInputChange = (candidateId: string, value: string) => {
    const numValue = parseInt(value, 10);
    const newRankings = {
      ...state.rankings,
      [candidateId]: isNaN(numValue) ? 0 : numValue
    };

    const errors = validateForm(newRankings);
    
    setState(prevState => ({
      ...prevState,
      rankings: newRankings,
      errors
    }));

    onValidationChange(errors.length === 0, errors);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (state.errors.length > 0) {
      ScreenReaderSupport.announceValidationError('Please fix the errors before submitting');
      return;
    }

    setState(prevState => {
      const newState = {
        ...prevState,
        isSubmitting: true
      };
      if ('submissionError' in newState) {
        delete newState.submissionError;
      }
      return newState;
    });

    ScreenReaderSupport.announceFormSubmission('submitting');

    try {
      const success = await onSubmit(state.rankings);
      
      if (success) {
        setState(prevState => ({
          ...prevState,
          isSubmitted: true,
          isSubmitting: false
        }));
        
        ScreenReaderSupport.announceFormSubmission('success');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prevState => ({
        ...prevState,
        isSubmitting: false,
        submissionError: errorMessage
      }));
      
      ScreenReaderSupport.announceFormSubmission('error', errorMessage);
    }
  };

  const clearForm = () => {
    setState(prevState => {
      const newState = {
        ...prevState,
        rankings: {},
        errors: [],
        isSubmitted: false
      };
      if ('submissionError' in newState) {
        delete newState.submissionError;
      }
      return newState;
    });

    // Clear all inputs
    if (formRef.current) {
      const inputs = formRef.current.querySelectorAll('input[type="number"]');
      inputs.forEach(input => {
        (input as HTMLInputElement).value = '';
      });
    }

    // Focus first input
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }

    ScreenReaderSupport.announce('Form cleared', 'polite');
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Focus first input on mount
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (state.isSubmitted) {
    return (
      <div className={`low-bandwidth-form-success ${className}`}>
        <div className="success-message" role="status">
          <h2>✅ Thank You!</h2>
          <p>Your ranking has been submitted successfully.</p>
          <p>You will receive a confirmation email shortly.</p>
          
          <div className="success-actions">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="submit-another-button"
            >
              Submit Another Ranking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`low-bandwidth-ranking-form ${className}`}>
      {/* Instructions */}
      {showInstructions && (
        <div className="form-instructions" role="region" aria-label="How to rank candidates">
          <h3>How to Rank</h3>
          <p>
            Enter a number for each candidate (1 = your first choice, 2 = second choice, etc.)
          </p>
          <ul>
            <li>Use numbers 1, 2, 3, etc.</li>
            <li>Each number can only be used once</li>
            <li>You must rank at least 2 candidates</li>
            <li>Lower numbers = higher preference</li>
          </ul>
          
          <button
            type="button"
            onClick={() => setShowInstructions(false)}
            className="hide-instructions-button"
            aria-label="Hide instructions"
          >
            Hide Instructions
          </button>
        </div>
      )}

      {!showInstructions && (
        <button
          type="button"
          onClick={() => setShowInstructions(true)}
          className="show-instructions-button"
          aria-label="Show instructions"
        >
          Show Instructions
        </button>
      )}

      {/* Main Form */}
      <form 
        ref={formRef}
        onSubmit={handleSubmit}
        className="ranking-form"
        aria-label="Rank your candidates"
        noValidate
      >
        <input type="hidden" name="pollId" value={pollId} />
        
        <fieldset>
          <legend>Rank Your Candidates</legend>
          
          <div className="candidates-list">
            {candidates.map((candidate, index) => (
              <div key={candidate.id} className="ranking-input-group">
                <label htmlFor={`rank-${candidate.id}`} className="candidate-label">
                  <span className="candidate-name">{candidate.name}</span>
                  {candidate.party && (
                    <span className="candidate-party">({candidate.party})</span>
                  )}
                </label>
                
                <input
                  ref={index === 0 ? firstInputRef : undefined}
                  type="number"
                  id={`rank-${candidate.id}`}
                  name={`ranking[${candidate.id}]`}
                  min="1"
                  max={candidates.length}
                  className="ranking-input"
                  aria-describedby={`candidate-${candidate.id}-description`}
                  aria-invalid={state.errors.length > 0}
                  onChange={(e) => handleInputChange(candidate.id, e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleInputChange(candidate.id, e.target.value);
                    }
                  }}
                />
                
                <div 
                  id={`candidate-${candidate.id}-description`} 
                  className="candidate-description"
                >
                  {candidate.bio}
                </div>
                
                {candidate.website && (
                  <div className="candidate-website">
                    <a 
                      href={candidate.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="website-link"
                    >
                      Learn more about {candidate.name}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        {/* Validation Errors */}
        {state.errors.length > 0 && (
          <div className="form-errors" role="alert" aria-live="assertive">
            <h4>Please fix the following errors:</h4>
            <ul>
              {state.errors.map((error, index) => (
                <li key={index} className="error-item">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submission Error */}
        {state.submissionError && (
          <div className="submission-error" role="alert" aria-live="assertive">
            <h4>Submission Failed</h4>
            <p>{state.submissionError}</p>
            <p>Please try again or use the SMS fallback below.</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={state.isSubmitting || state.errors.length > 0}
            aria-describedby="submit-help"
          >
            {state.isSubmitting ? 'Submitting...' : 'Submit My Ranking'}
          </button>
          
          <button 
            type="button" 
            className="clear-button" 
            onClick={clearForm}
            disabled={state.isSubmitting}
          >
            Clear All
          </button>
        </div>
        
        <div id="submit-help" className="submit-help">
          {state.errors.length > 0 && (
            <p>Please fix the errors above before submitting.</p>
          )}
          {state.errors.length === 0 && (
            <p>Your ranking is ready to submit!</p>
          )}
        </div>
      </form>

      {/* SMS Fallback */}
      {showSMSFallback && (
        <div className="sms-fallback">
          <button
            type="button"
            onClick={() => setShowSMSInstructions(!showSMSInstructions)}
            className="sms-toggle-button"
            aria-expanded={showSMSInstructions}
            aria-controls="sms-instructions"
          >
            {showSMSInstructions ? 'Hide SMS Option' : 'Show SMS Option'}
          </button>
          
          {showSMSInstructions && (
            <div id="sms-instructions" className="sms-instructions">
              <h4>Alternative: Text Your Ranking</h4>
              <p>If you have trouble with the form, you can text your ranking:</p>
              
              <div className="sms-info">
                <p><strong>Text to:</strong> {smsNumber}</p>
                <p><strong>Format:</strong> <code>TEXT A&gt;B&gt;C</code> (your preferences in order)</p>
                <p><strong>Example:</strong> <code>TEXT Smith&gt;Johnson&gt;Williams</code></p>
              </div>
              
              <div className="sms-candidates">
                <h5>Candidate Names:</h5>
                <ul>
                  {candidates.map(candidate => (
                    <li key={candidate.id}>
                      <strong>{candidate.name}</strong>
                      {candidate.party && ` (${candidate.party})`}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="sms-note">
                <p>
                  <strong>Note:</strong> SMS voting is available 24/7. 
                  You will receive a confirmation text.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="form-announcements"
      >
        {/* Dynamic announcements will be inserted here */}
      </div>
    </div>
  );
}

// ============================================================================
// SMS PARSING UTILITIES
// ============================================================================

export class SMSRankingParser {
  /**
   * Parse SMS ranking message
   * @param message - SMS message
   * @param candidates - Available candidates
   * @returns Parsed ranking
   */
  static parseSMSRanking(message: string, candidates: Candidate[]): string[] {
    // Parse SMS format: "TEXT A>B>C" or "Smith>Johnson>Williams"
    const ranking = message
      .replace(/^TEXT\s+/i, '') // Remove "TEXT" prefix
      .split('>')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // Map candidate names to IDs
    const candidateMap = new Map(
      candidates.map(c => [c.name.toLowerCase(), c.id])
    );
    
    return ranking
      .map(name => candidateMap.get(name.toLowerCase()))
      .filter(id => id !== undefined);
  }
  
  /**
   * Generate SMS confirmation message
   * @param ranking - Ranking array
   * @param candidates - Available candidates
   * @returns Confirmation message
   */
  static generateSMSConfirmation(ranking: string[], candidates: Candidate[]): string {
    const candidateNames = ranking.map(id => 
      candidates.find(c => c.id === id)?.name || 'Unknown'
    );
    
    return `Your ranking received: ${candidateNames.join(' > ')}. 
    Thank you for participating! Reply STOP to opt out.`;
  }
  
  /**
   * Validate SMS ranking
   * @param ranking - Ranking array
   * @param candidates - Available candidates
   * @returns Validation result
   */
  static validateSMSRanking(ranking: string[], candidates: Candidate[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (ranking.length < 2) {
      errors.push('Please rank at least 2 candidates');
    }
    
    if (ranking.length !== new Set(ranking).size) {
      errors.push('Each candidate can only be ranked once');
    }
    
    const validCandidateIds = candidates.map(c => c.id);
    const invalidIds = ranking.filter(id => !validCandidateIds.includes(id));
    if (invalidIds.length > 0) {
      errors.push(`Invalid candidates: ${invalidIds.join(', ')}`);
    }
    
    if (ranking.length < candidates.length) {
      warnings.push('You can rank more candidates for better accuracy');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ============================================================================
// EXPORTED COMPONENT
// ============================================================================

export default LowBandwidthRankingForm;
