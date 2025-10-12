/**
 * Onboarding Store Usage Examples
 * 
 * Example components demonstrating how to use the onboarding store
 * in your React components. Shows best practices and common patterns.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import React, { useEffect } from 'react';

import { withOptional } from '@/lib/utils/objects';

import {
  // Onboarding selectors
  useOnboardingStep,
  useOnboardingProgress,
  useOnboardingCompleted,
  useOnboardingLoading,
  useOnboardingError,
  useOnboardingActions,
  useOnboardingData,
  useOnboardingStats,
  useCurrentStepData,
  useStepValidation,
  
  // Store utilities
  onboardingStoreDebug,
  
  // Other stores for integration
  useUserActions,
  useNotificationActions,
} from '../index';

// ============================================================================
// Example 1: Basic Onboarding Flow Component
// ============================================================================

export function OnboardingFlowExample() {
  // Use individual selectors for optimized re-renders
  const currentStep = useOnboardingStep();
  const progress = useOnboardingProgress();
  const isCompleted = useOnboardingCompleted();
  const isLoading = useOnboardingLoading();
  const error = useOnboardingError();
  
  // Get actions
  const {
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding,
    clearError,
  } = useOnboardingActions();
  
  // Handle step navigation
  const handleNext = () => {
    nextStep();
  };
  
  const handlePrevious = () => {
    previousStep();
  };
  
  const handleComplete = () => {
    completeOnboarding();
  };
  
  const handleSkip = () => {
    skipOnboarding();
  };
  
  const handleRestart = () => {
    restartOnboarding();
  };
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Onboarding error:', error);
      // You could show a toast notification here
    }
  }, [error]);
  
  if (isLoading) {
    return <div>Loading onboarding...</div>;
  }
  
  if (isCompleted) {
    return (
      <div className="p-4">
        <h2>Onboarding Complete!</h2>
        <p>Welcome to Choices! Your onboarding is complete.</p>
        <button 
          onClick={handleRestart}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Restart Onboarding
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2>Onboarding Flow</h2>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Step {currentStep + 1} of 6 - {Math.round(progress)}% complete
        </p>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
          <button 
            onClick={clearError}
            className="text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Step Content */}
      <div className="mb-4">
        <h3>Step {currentStep + 1}</h3>
        <p>This is where your step content would go.</p>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex space-x-2">
        {currentStep > 0 && (
          <button 
            onClick={handlePrevious}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Previous
          </button>
        )}
        
        {currentStep < 5 ? (
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button 
            onClick={handleComplete}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Complete
          </button>
        )}
        
        <button 
          onClick={handleSkip}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Step-Specific Component
// ============================================================================

export function AuthSetupStepExample() {
  const currentStep = useOnboardingStep();
  const stepData = useCurrentStepData();
  const { canProceed, errors, isValid } = useStepValidation(currentStep);
  const { updateFormData, nextStep, setError } = useOnboardingActions();
  
  const [formData, setFormData] = React.useState({
    email: stepData.email || '',
    password: stepData.password || '',
    confirmPassword: stepData.confirmPassword || '',
    termsAccepted: stepData.termsAccepted || false,
    privacyAccepted: stepData.privacyAccepted || false,
  });
  
  const handleInputChange = (field: string, value: any) => {
    const newFormData = withOptional(formData, { [field]: value });
    setFormData(newFormData);
    updateFormData(currentStep, newFormData);
  };
  
  const handleNext = () => {
    if (isValid) {
      nextStep();
    } else {
      setError('Please fill in all required fields');
    }
  };
  
  return (
    <div className="p-4">
      <h2>Authentication Setup</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your password"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password:</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Confirm your password"
          />
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
              className="mr-2"
            />
            I accept the Terms of Service
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.privacyAccepted}
              onChange={(e) => handleInputChange('privacyAccepted', e.target.checked)}
              className="mr-2"
            />
            I accept the Privacy Policy
          </label>
        </div>
      </div>
      
      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button 
          onClick={handleNext}
          disabled={!canProceed}
          className={`px-4 py-2 rounded ${
            canProceed 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Onboarding Integration with Other Stores
// ============================================================================

export function OnboardingIntegrationExample() {
  const { setProfile, updatePreferences } = useUserActions();
  const { addNotification } = useNotificationActions();
  const {
    currentStep,
    progress,
    isCompleted,
    authData,
    profileData,
    valuesData,
    preferencesData,
  } = useOnboardingData();
  
  const {
    completeOnboarding,
    submitOnboarding,
    setError,
  } = useOnboardingActions();
  
  // Handle onboarding completion
  const handleCompleteOnboarding = async () => {
    try {
      // Update user profile with onboarding data
      if (profileData.firstName && profileData.lastName) {
        setProfile({
          id: 'temp-id',
          email: authData.email || '',
          username: profileData.username || '',
          avatar: profileData.avatar,
          preferences: {
            theme: preferencesData.theme || 'system',
            notifications: preferencesData.notifications ?? true,
            language: preferencesData.language || 'en',
            timezone: preferencesData.timezone || 'UTC',
          },
          settings: {
            privacy: preferencesData.privacy || 'private',
            location: profileData.location || '',
            interests: valuesData.primaryInterests || [],
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            loginCount: 1,
          },
        });
      }
      
      // Update user preferences
      if (preferencesData.theme) {
        updatePreferences({
          theme: preferencesData.theme,
          notifications: preferencesData.notifications,
          language: preferencesData.language,
        });
      }
      
      // Submit onboarding data to server
      await submitOnboarding();
      
      // Complete onboarding
      completeOnboarding();
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Welcome to Choices!',
        message: 'Your onboarding is complete. Welcome to your civic engagement journey!',
        duration: 5000,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
      setError(errorMessage);
      
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Onboarding Error',
        message: errorMessage,
        duration: 0, // Don't auto-dismiss errors
      });
    }
  };
  
  return (
    <div className="p-4">
      <h2>Onboarding Integration</h2>
      
      <div className="mb-4">
        <p>Current Step: {currentStep + 1}</p>
        <p>Progress: {Math.round(progress)}%</p>
        <p>Completed: {isCompleted ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mb-4">
        <h3>Collected Data:</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Auth:</strong> {authData.email || 'Not set'}</p>
          <p><strong>Profile:</strong> {profileData.firstName || 'Not set'} {profileData.lastName || ''}</p>
          <p><strong>Interests:</strong> {valuesData.primaryInterests?.join(', ') || 'Not set'}</p>
          <p><strong>Theme:</strong> {preferencesData.theme || 'Not set'}</p>
        </div>
      </div>
      
      {!isCompleted && (
        <button 
          onClick={handleCompleteOnboarding}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Complete Onboarding
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Onboarding Progress Tracker
// ============================================================================

export function OnboardingProgressTracker() {
  const stats = useOnboardingStats();
  const { loadProgress, saveProgress } = useOnboardingActions();
  
  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);
  
  // Auto-save progress
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [saveProgress]);
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3>Onboarding Progress</h3>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span>Current Step:</span>
          <span>{stats.currentStep + 1} of {stats.totalSteps}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Progress:</span>
          <span>{Math.round(stats.progress)}%</span>
        </div>
        
        <div className="flex justify-between">
          <span>Completed Steps:</span>
          <span>{stats.completedSteps}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Skipped Steps:</span>
          <span>{stats.skippedSteps}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={stats.isCompleted ? 'text-green-600' : 'text-blue-600'}>
            {stats.isCompleted ? 'Completed' : 'In Progress'}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Onboarding Debug Component
// ============================================================================

export function OnboardingDebugExample() {
  const { logState, logSummary, logStepData, reset } = onboardingStoreDebug;
  const currentStep = useOnboardingStep();
  
  const handleLogState = () => {
    logState();
  };
  
  const handleLogSummary = () => {
    logSummary();
  };
  
  const handleLogStepData = () => {
    logStepData(currentStep);
  };
  
  const handleReset = () => {
    reset();
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3>Onboarding Debug Tools</h3>
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={handleLogState}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Log State
        </button>
        
        <button 
          onClick={handleLogSummary}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Log Summary
        </button>
        
        <button 
          onClick={handleLogStepData}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
        >
          Log Step Data
        </button>
        
        <button 
          onClick={handleReset}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          Reset Store
        </button>
      </div>
      
      <p className="mt-2 text-sm text-gray-600">
        Check the browser console for debug output.
      </p>
    </div>
  );
}
