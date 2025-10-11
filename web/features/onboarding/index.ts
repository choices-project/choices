// Onboarding Feature - Clean Exports
// This file provides clean, organized exports for the onboarding feature

// Components
export { default as AuthSetupStep } from './components/AuthSetupStep'
export { default as BalancedOnboardingFlow } from './components/BalancedOnboardingFlow'
export { default as CompleteStep } from './components/CompleteStep'
export { default as DataUsageStepLite } from './components/DataUsageStepLite'
export { default as LocationInput } from './components/LocationInput'
export { default as ProfileSetupStep } from './components/ProfileSetupStep'
export { default as ValuesStep } from './components/ValuesStep'

// Hooks (when created)
// export { useOnboardingFlow } from './hooks/useOnboardingFlow'

// Lib utilities (when created)
// export { onboardingService } from './lib/onboardingService'

// Types
export type { 
  OnboardingStep, 
  OnboardingData, 
  UserDemographics, 
  PrivacyPreferences,
  AuthMethod,
  ProfileVisibility,
  ValuesData,
  ValueCategory,
  CommunityOption,
  ParticipationOption,
  AuthSetupStepProps,
  ProfileSetupStepProps,
  ValuesStepProps,
  CompleteStepProps,
  DataUsageStepLiteProps,
  LocationInputProps,
  UserOnboardingProps,
  InterestSelectionProps,
  FirstTimeUserGuideProps,
  PlatformTourProps,
  UserProfileProps,
  Tier,
  TierSystemProps,
  OnboardingProgressResponse,
  OnboardingAction,
  OnboardingUpdateRequest,
  OnboardingCompletionRequest
} from './types';
