/**
 * LocationSetupStep Component Tests
 * 
 * Tests for the browser location capture onboarding step.
 * These tests guide how the component should work, not just conform to current state.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import LocationSetupStep from '@/components/onboarding/LocationSetupStep';
import { useOnboardingContext } from '@/components/onboarding/EnhancedOnboardingFlow';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Mock dependencies
jest.mock('@/components/onboarding/EnhancedOnboardingFlow');
jest.mock('@/lib/core/feature-flags');
jest.mock('@/components/onboarding/LocationInput', () => {
  return function MockLocationInput({ onLocationResolved, onError }: any) {
    return (
      <div data-testid="location-input">
        <button 
          data-testid="mock-resolve" 
          onClick={() => onLocationResolved(['ocd-division/country:us/state:ca'])}
        >
          Mock Resolve
        </button>
        <button 
          data-testid="mock-error" 
          onClick={() => onError('Mock error')}
        >
          Mock Error
        </button>
      </div>
    );
  };
});

const mockUpdateStepData = jest.fn();
const mockSetCurrentStep = jest.fn();

const mockOnboardingContext = {
  updateStepData: mockUpdateStepData,
  currentStep: 'location',
  setCurrentStep: mockSetCurrentStep,
  stepData: {},
  isComplete: false,
  canGoNext: true,
  canGoBack: true,
};

describe('LocationSetupStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useOnboardingContext as jest.Mock).mockReturnValue(mockOnboardingContext);
  });

  describe('Feature Flag Handling', () => {
    it('should show disabled message when feature is disabled', () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);

      render(<LocationSetupStep />);

      expect(screen.getByText('Location Services')).toBeInTheDocument();
      expect(screen.getByText('Location capture is currently disabled')).toBeInTheDocument();
      expect(screen.getByText('Continue Without Location')).toBeInTheDocument();
    });

    it('should show location capture UI when feature is enabled', () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);

      render(<LocationSetupStep />);

      expect(screen.getByText('Help us personalize your experience')).toBeInTheDocument();
      expect(screen.getByText('We\'ll use your location to show you relevant local candidates and issues')).toBeInTheDocument();
    });
  });

  describe('Location Capture Flow', () => {
    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    });

    it('should handle successful location resolution', async () => {
      render(<LocationSetupStep />);

      const resolveButton = screen.getByTestId('mock-resolve');
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(mockUpdateStepData).toHaveBeenCalledWith('location');
      });

      // Should show success message
      expect(screen.getByText('Location captured successfully! Moving to next step...')).toBeInTheDocument();
    });

    it('should handle location resolution errors', async () => {
      render(<LocationSetupStep />);

      const errorButton = screen.getByTestId('mock-error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText('Mock error')).toBeInTheDocument();
      });
    });

    it('should auto-advance after successful capture', async () => {
      jest.useFakeTimers();
      
      render(<LocationSetupStep />);

      const resolveButton = screen.getByTestId('mock-resolve');
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(screen.getByText('Location captured successfully! Moving to next step...')).toBeInTheDocument();
      });

      // Fast-forward timer
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockSetCurrentStep).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Skip Functionality', () => {
    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    });

    it('should handle skip when feature is disabled', () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);

      render(<LocationSetupStep />);

      const skipButton = screen.getByText('Continue Without Location');
      fireEvent.click(skipButton);

      expect(mockUpdateStepData).toHaveBeenCalledWith('location');
      expect(mockSetCurrentStep).toHaveBeenCalled();
    });

    it('should handle skip when feature is enabled', () => {
      render(<LocationSetupStep />);

      const skipButton = screen.getByText('Skip Location');
      fireEvent.click(skipButton);

      expect(mockUpdateStepData).toHaveBeenCalledWith('location');
      expect(mockSetCurrentStep).toHaveBeenCalled();
    });

    it('should disable skip during capture', () => {
      render(<LocationSetupStep />);

      const resolveButton = screen.getByTestId('mock-resolve');
      fireEvent.click(resolveButton);

      const skipButton = screen.getByText('Skip Location');
      expect(skipButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    });

    it('should handle back navigation', () => {
      render(<LocationSetupStep />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockSetCurrentStep).toHaveBeenCalled();
    });

    it('should disable navigation during capture', () => {
      render(<LocationSetupStep />);

      const resolveButton = screen.getByTestId('mock-resolve');
      fireEvent.click(resolveButton);

      const backButton = screen.getByText('Back');
      expect(backButton).toBeDisabled();
    });
  });

  describe('Privacy and UX', () => {
    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    });

    it('should display privacy notice', () => {
      render(<LocationSetupStep />);

      expect(screen.getByText('Your privacy is protected')).toBeInTheDocument();
      expect(screen.getByText(/We only store approximate coordinates/)).toBeInTheDocument();
    });

    it('should show skip option for users who prefer not to share location', () => {
      render(<LocationSetupStep />);

      expect(screen.getByText('Skip for now (you can add this later)')).toBeInTheDocument();
    });

    it('should provide clear value proposition', () => {
      render(<LocationSetupStep />);

      expect(screen.getByText('Help us personalize your experience')).toBeInTheDocument();
      expect(screen.getByText(/show you relevant local candidates/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    });

    it('should display error messages clearly', async () => {
      render(<LocationSetupStep />);

      const errorButton = screen.getByTestId('mock-error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText('Mock error')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      render(<LocationSetupStep />);

      const errorButton = screen.getByTestId('mock-error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText('Mock error')).toBeInTheDocument();
      });

      // Should be able to try again
      const resolveButton = screen.getByTestId('mock-resolve');
      expect(resolveButton).toBeEnabled();
    });
  });

  describe('Data Persistence', () => {
    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    });

    it('should save jurisdiction data correctly', async () => {
      render(<LocationSetupStep />);

      const resolveButton = screen.getByTestId('mock-resolve');
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(mockUpdateStepData).toHaveBeenCalledWith('location');
      });

      // Verify the data structure
      const updateCall = mockUpdateStepData.mock.calls[0];
      expect(updateCall[0]).toBe('location');
      
      const updateFunction = updateCall[1];
      const mockData = updateFunction({});
      
      expect(mockData).toEqual({
        jurisdictionIds: ['ocd-division/country:us/state:ca'],
        primaryOcdId: 'ocd-division/country:us/state:ca',
        locationCaptured: true,
        locationSource: 'browser',
        locationCompleted: true,
      });
    });

    it('should save skip data correctly', () => {
      render(<LocationSetupStep />);

      const skipButton = screen.getByText('Skip Location');
      fireEvent.click(skipButton);

      expect(mockUpdateStepData).toHaveBeenCalledWith('location');
      
      const updateCall = mockUpdateStepData.mock.calls[0];
      const updateFunction = updateCall[1];
      const mockData = updateFunction({});
      
      expect(mockData).toEqual({
        locationCaptured: false,
        locationCompleted: true,
      });
    });
  });
});
