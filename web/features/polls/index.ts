/**
 * Polls Feature Exports
 * 
 * Centralized exports for the polls feature including components,
 * hooks, services, types, and utilities
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/** Poll card component */
export { default as PollCard } from './components/PollCard';

/** Poll results component */
export { default as PollResultsComponent } from './components/PollResults';

/** Private poll results component */
export { default as PrivatePollResults } from './components/PrivatePollResults';

/** Poll share component */
export { default as PollShare } from './components/PollShare';

/** Community poll selection component */
export { default as CommunityPollSelection } from './components/CommunityPollSelection';

/** Post-close banner component */
export { default as PostCloseBanner } from './components/PostCloseBanner';

/** Poll hashtag integration component */
export { default as PollHashtagIntegrationComponent } from './components/PollHashtagIntegration';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

/** Poll wizard hook */
export { usePollWizard } from './hooks/usePollWizard';

// ============================================================================
// SERVICE EXPORTS
// ============================================================================

/** Optimized poll service */
export {
  getOptimizedPollResults,
  calculatePollStatistics,
  generatePollInsights
} from './lib/poll-service';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core poll types
  Poll,
  PollOption,
  PollSettings,
  PollCategory,
  PollStatus,
  PollTemplate,
  TemplateCategory,
  
  // Voting types
  VotingMethod,
  
  // Poll creation types
  PollCreationData,
  PollUpdateData,
  PollWizardData,
  PollWizardState,
  
  // Poll results types
  PollResults,
  PollOptionResult,
  PollDemographics,
  
  // Integration types
  PollHashtagIntegration,
  
  // Vote types
  Vote,
  
  // Template types
  TemplateSettings
} from './types';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/** Poll utility functions */
export {
  formatPollDate,
  calculatePollDuration,
  isPollActive,
  validatePollTitle,
  validatePollDescription,
  validatePollOptions,
  validatePollSettings,
  formatPollDuration,
  calculateParticipationRate,
  getPollStatusText,
  getVotingMethodText,
  allowsMultipleVotes,
  calculateOptionPercentage,
  sortOptionsByVotes,
  isPollExpired,
  getTimeRemaining,
  formatTimeRemaining,
  sanitizePollTitleForUrl,
  generatePollSummary
} from './utils';

// ============================================================================
// FEATURE CONFIGURATION
// ============================================================================

/** Polls feature configuration */
export const pollsFeatureConfig = {
  name: 'polls',
  version: '1.0.0',
  description: 'Comprehensive polling system with hashtag integration',
  features: {
    pollCreation: true,
    pollVoting: true,
    pollResults: true,
    pollSharing: true,
    pollTemplates: true,
    hashtagIntegration: true,
    communityPolls: true,
    privatePolls: true
  },
  limits: {
    maxOptionsPerPoll: 10,
    maxPollTitleLength: 200,
    maxPollDescriptionLength: 1000,
    maxHashtagsPerPoll: 10
  },
  votingMethods: [
    'single-choice',
    'multiple-choice',
    'ranked-choice',
    'approval-voting',
    'range-voting'
  ] as const
} as const;

// ============================================================================
// FEATURE STATUS
// ============================================================================

/** Feature implementation status */
export const pollsFeatureStatus = {
  core: {
    types: 'completed',
    components: 'completed',
    hooks: 'completed',
    services: 'completed'
  },
  integration: {
    hashtags: 'completed',
    feeds: 'pending',
    analytics: 'pending'
  },
  advanced: {
    templates: 'completed',
    community: 'completed',
    sharing: 'completed'
  },
  documentation: {
    feature: 'pending',
    integration: 'pending',
    usage: 'pending'
  }
} as const;

// ============================================================================
// QUICK START
// ============================================================================

/**
 * Quick start guide for using the polls feature
 * 
 * @example
 * ```tsx
 * import { PollCard, PollHashtagIntegration, usePollWizard } from '@/features/polls';
 * 
 * function MyPollComponent() {
 *   const { createPoll, updatePoll } = usePollWizard();
 *   
 *   return (
 *     <div>
 *       <PollCard poll={poll} />
 *       <PollHashtagIntegration 
 *         poll={poll} 
 *         onUpdate={updatePoll}
 *         isEditing={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Migration guide for integrating polls feature
 * 
 * 1. **Hashtag Integration**: Add hashtag support to polls
 * 2. **Feed Integration**: Enable poll discovery through feeds
 * 3. **Analytics Integration**: Add poll analytics and insights
 * 4. **Component Integration**: Add poll components to existing features
 * 
 * @see /docs/features/POLLS.md for detailed integration guide
 */
