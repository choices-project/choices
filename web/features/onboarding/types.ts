import type React from 'react';
/**
 * Onboarding Feature - Centralized Type Definitions
 * 
 * This file consolidates all type definitions for the onboarding feature,
 * providing a single source of truth for type safety and consistency.
 */

// ============================================================================
// CORE ONBOARDING TYPES
// ============================================================================

export type OnboardingStep = 'welcome' | 'privacy' | 'demographics' | 'auth' | 'profile' | 'complete';

export type OnboardingData = {
  completedSteps: OnboardingStep[];
  currentStep: OnboardingStep;
  demographics: UserDemographics;
  privacy: PrivacyPreferences;
  userPreferences: {
    primary_interest: 'representatives' | 'polls' | 'both';
    notification_frequency: 'all' | 'important' | 'none';
    content_complexity: 'simple' | 'detailed' | 'expert';
  };
  profile: {
    display_name?: string;
    bio?: string;
    primary_concerns?: string[];
    community_focus?: string[];
    participation_style?: 'observer' | 'contributor' | 'leader';
  };
  auth: {
    method?: 'email' | 'social' | 'webauthn' | 'anonymous';
    email?: string;
    socialProvider?: 'google' | 'github';
  };
}

// ============================================================================
// USER DEMOGRAPHICS
// ============================================================================

export type UserDemographics = {
  location: {
    state: string;
    district?: string;
    quantized: boolean;
  };
  age_range: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | '';
  education: 'high_school' | 'some_college' | 'bachelor' | 'graduate' | '';
  political_engagement: 'casual' | 'moderate' | 'very_engaged' | '';
  preferred_contact: 'email' | 'none' | '';
}

// ============================================================================
// PRIVACY PREFERENCES
// ============================================================================

export type PrivacyPreferences = {
  location_sharing: 'enabled' | 'quantized' | 'disabled';
  demographic_sharing: 'enabled' | 'anonymous' | 'disabled';
  analytics_sharing: 'enabled' | 'limited' | 'disabled';
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export type AuthMethod = 'email' | 'social' | 'webauthn' | 'anonymous' | 'skip';

export type AuthData = {
  method: AuthMethod;
  email?: string;
  socialProvider?: 'google' | 'github';
  isAuthenticated: boolean;
}

// ============================================================================
// PROFILE DATA
// ============================================================================

export type ProfileVisibility = 'public' | 'private' | 'friends_only' | 'anonymous';

export type ProfileData = {
  displayName: string;
  profileVisibility: ProfileVisibility;
  notifications: {
    email: boolean;
    push: boolean;
  };
  bio?: string;
  interests?: string[];
}

// ============================================================================
// VALUES & INTERESTS
// ============================================================================

export type ValuesData = {
  primaryConcerns: string[];
  communityFocus: 'local' | 'regional' | 'national' | 'global';
  participationStyle: 'observer' | 'contributor' | 'leader';
}

export type ValueCategory = {
  title: string;
  icon: React.ReactNode;
  color: string;
}

export type CommunityOption = {
  value: string;
  label: string;
  description: string;
}

export type ParticipationOption = {
  value: 'observer' | 'contributor' | 'leader';
  label: string;
  description: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export type AuthSetupStepProps = {
  data: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export type ProfileSetupStepProps = {
  data: {
    displayName?: string;
    profileVisibility?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    profileSetupCompleted?: boolean;
  };
  onUpdate: (updates: {
    displayName?: string;
    profileVisibility?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    profileSetupCompleted?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export type ValuesStepProps = {
  data: {
    primaryConcerns?: string[];
    communityFocus?: string[];
    participationStyle?: 'observer' | 'contributor' | 'leader';
    valuesCompleted?: boolean;
  };
  onUpdate: (updates: {
    primaryConcerns?: string[];
    communityFocus?: string[];
    participationStyle?: 'observer' | 'contributor' | 'leader';
    valuesCompleted?: boolean;
    stepProgress?: {
      currentStep: string;
      completedSteps: string[];
    };
  }) => void;
  onNext: () => void;
}

export type CompleteStepProps = {
  data: any;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export type DataUsageStepLiteProps = {
  onNext: () => void;
  onShowAdvanced?: () => void;
}

export type LocationInputProps = {
  onLocationResolved: (jurisdictionIds: string[]) => void;
  onError: (error: string) => void;
}

export type UserOnboardingProps = {
  onComplete: (userData: { address?: string; state?: string; representatives?: any[] }) => void;
  onSkip: () => void;
}

export type InterestSelectionProps = {
  initialInterests?: string[];
  onSave?: (interests: string[]) => void;
  className?: string;
}

export type FirstTimeUserGuideProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export type PlatformTourProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export type UserProfileProps = {
  onRepresentativesUpdate: (representatives: any[]) => void;
  onClose: () => void;
}

// ============================================================================
// TRUST LEVEL SYSTEM
// ============================================================================

export type Tier = {
  level: number;
  name: string;
  price: string; // Now represents verification method instead of price
  features: string[];
  cta: string;
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
}

export type TierSystemProps = {
  tiers: Tier[];
  currentTier?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export type OnboardingProgressResponse = {
  progress: {
    user_id: string;
    current_step: OnboardingStep;
    completed_steps: OnboardingStep[];
    step_data: Record<string, any>;
    started_at: string | null;
    last_activity_at: string | null;
    completed_at: string | null;
    total_time_minutes: number | null;
  };
  profile: {
    onboarding_completed: boolean;
    onboarding_step: OnboardingStep;
    privacy_level: 'low' | 'medium' | 'high';
    profile_visibility: ProfileVisibility;
    data_sharing_preferences: {
      analytics: boolean;
      research: boolean;
      contact: boolean;
      marketing: boolean;
    };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type OnboardingAction = 'start' | 'update' | 'complete';

export type OnboardingUpdateRequest = {
  step: OnboardingStep;
  data?: Record<string, any>;
  action: OnboardingAction;
}

export type OnboardingCompletionRequest = {
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}
