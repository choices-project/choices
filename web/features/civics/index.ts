/**
 * CIVICS Feature Exports
 * 
 * Feature exports for civics functionality
 * Types are now centralized in /web/types/
 * 
 * Updated: October 26, 2025
 * Status: ✅ REFACTORED
 */

/**
 * Civics Feature - Main Export Module
 * 
 * Provides clean, organized exports for the civics feature including:
 * - Representative lookup and display components
 * - Address-based geographic services
 * - Campaign finance and voting record components
 * - Social feed and engagement features
 * 
 * @fileoverview Central export point for all civics-related functionality
 * @version 1.0.0
 * @since 2024-10-09
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/** Address lookup form for finding representatives by location */
export { default as AddressLookupForm } from './components/AddressLookupForm'

/** Attribution footer for data source credits and licensing */
export { default as AttributionFooter } from './components/AttributionFooter'


/** Marketing component to encourage civics engagement */
export { default as CivicsLure } from './components/CivicsLure'

/** Privacy status indicator for data protection compliance */
export { default as PrivacyStatusBadge } from './components/PrivacyStatusBadge'

// Feed components moved to @/features/feeds

/** Progressive disclosure for complex information */
export { default as ProgressiveDisclosure } from './components/ProgressiveDisclosure'

// SocialFeed moved to @/features/feeds

/** Touch interaction handlers for mobile devices */
export { default as TouchInteractions } from './components/TouchInteractions'

/** Share button component for civics content */
export { default as ShareButton } from './components/ShareButton'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Shared component types for civics features */
export type { 
  FeedItemData, 
  UserPreferences, 
  EngagementData, 
  TouchPoint, 
  TouchState 
} from './lib/types/civics-types'

/** Superior data pipeline types */
export type { SuperiorRepresentativeData } from './lib/types/superior-types'
