/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BalancedOnboardingFlow from '@/features/onboarding/components/BalancedOnboardingFlow';
import { T } from '@/lib/testing/testIds';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  }),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response)
);

describe('BalancedOnboardingFlow - Comprehensive Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('should render the onboarding flow with all steps', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Check for main onboarding container
      expect(screen.getByTestId(T.onboarding.container)).toBeInTheDocument();
      
      // Check for step indicator
      expect(screen.getByTestId(T.onboarding.stepIndicator)).toBeInTheDocument();
      
      // Check for navigation buttons
      expect(screen.getByTestId(T.onboarding.nextButton)).toBeInTheDocument();
    });

    it('should display the first step by default', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // First step should be visible
      expect(screen.getByTestId(T.onboarding.step1)).toBeInTheDocument();
      
      // Other steps should not be visible
      expect(screen.queryByTestId(T.onboarding.step2)).not.toBeInTheDocument();
      expect(screen.queryByTestId(T.onboarding.step3)).not.toBeInTheDocument();
    });

    it('should show progress indicator with correct step', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      const progressIndicator = screen.getByTestId(T.onboarding.progressIndicator);
      expect(progressIndicator).toBeInTheDocument();
      expect(progressIndicator).toHaveTextContent('1 of 6');
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step when next button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Start on step 1
      expect(screen.getByTestId(T.onboarding.step1)).toBeInTheDocument();
      
      // Click next button
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Should move to step 2
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId(T.onboarding.step1)).not.toBeInTheDocument();
    });

    it('should navigate to previous step when back button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to step 2
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByTestId(T.onboarding.backButton);
      await user.click(backButton);
      
      // Should return to step 1
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step1)).toBeInTheDocument();
      });
    });

    it('should not allow navigation beyond last step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate through all steps
      for (let i = 0; i < 6; i++) {
        const nextButton = screen.getByTestId(T.onboarding.nextButton);
        await user.click(nextButton);
        await waitFor(() => {
          expect(screen.getByTestId(T.onboarding.stepIndicator)).toBeInTheDocument();
        });
      }

      // Should be on last step
      expect(screen.getByTestId(T.onboarding.step6)).toBeInTheDocument();
      
      // Next button should be disabled or show "Complete"
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      expect(nextButton).toHaveTextContent('Complete');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in each step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Try to proceed without filling required fields
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.validationError)).toBeInTheDocument();
      });
    });

    it('should validate email format in auth step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Enter invalid email
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      await user.type(emailInput, 'invalid-email');
      
      // Try to proceed
      await user.click(screen.getByTestId(T.onboarding.nextButton));
      
      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.emailError)).toBeInTheDocument();
      });
    });

    it('should validate password strength in auth step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Enter weak password
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      await user.type(passwordInput, '123');
      
      // Try to proceed
      await user.click(screen.getByTestId(T.onboarding.nextButton));
      
      // Should show password strength error
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.passwordError)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save form data to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Fill in some data
      const nameInput = screen.getByTestId(T.onboarding.nameInput);
      await user.type(nameInput, 'John Doe');
      
      // Navigate to next step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Check that data was saved to localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'onboarding-data',
        expect.stringContaining('John Doe')
      );
    });

    it('should restore form data from localStorage on component mount', () => {
      // Mock localStorage with existing data
      const mockData = {
        name: 'John Doe',
        email: 'john@example.com',
        step: 2
      };
      
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData));
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Should restore to step 2
      expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      
      // Should restore form data
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  describe('Authentication Integration', () => {
    it('should handle email/password authentication', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Fill in auth credentials
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit auth
      const authButton = screen.getByTestId(T.onboarding.authButton);
      await user.click(authButton);
      
      // Should call Supabase auth
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      });
    });

    it('should handle social authentication', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Click social auth button
      const socialButton = screen.getByTestId(T.onboarding.socialButton);
      await user.click(socialButton);
      
      // Should initiate social auth flow
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/social', expect.any(Object));
      });
    });
  });

  describe('Error Handling', () => {
    it('should display authentication errors', async () => {
      const user = userEvent.setup();
      
      // Mock failed authentication
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Fill in auth credentials
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      
      // Submit auth
      const authButton = screen.getByTestId(T.onboarding.authButton);
      await user.click(authButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.authError)).toBeInTheDocument();
        expect(screen.getByTestId(T.onboarding.authError)).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Fill in auth credentials
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit auth
      const authButton = screen.getByTestId(T.onboarding.authButton);
      await user.click(authButton);
      
      // Should show network error message
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.networkError)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Tab through elements
      const firstElement = screen.getByTestId(T.onboarding.firstFocusable);
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);
      
      // Tab to next element
      fireEvent.keyDown(firstElement, { key: 'Tab' });
      const secondElement = screen.getByTestId(T.onboarding.secondFocusable);
      expect(document.activeElement).toBe(secondElement);
    });

    it('should have proper ARIA labels', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Check for ARIA labels
      expect(screen.getByTestId(T.onboarding.stepIndicator)).toHaveAttribute('aria-label', 'Step 1 of 6');
      expect(screen.getByTestId(T.onboarding.nextButton)).toHaveAttribute('aria-label', 'Next step');
    });

    it('should announce step changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to next step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Should announce step change
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.stepAnnouncement)).toBeInTheDocument();
        expect(screen.getByTestId(T.onboarding.stepAnnouncement)).toHaveTextContent('Step 2 of 6');
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Unmount component
      unmount();
      
      // Should not leave any event listeners or timers
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BalancedOnboardingFlow from '@/features/onboarding/components/BalancedOnboardingFlow';
import { T } from '@/lib/testing/testIds';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  }),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response)
);

describe('BalancedOnboardingFlow - Comprehensive Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('should render the onboarding flow with all steps', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Check for main onboarding container
      expect(screen.getByTestId(T.onboarding.container)).toBeInTheDocument();
      
      // Check for step indicator
      expect(screen.getByTestId(T.onboarding.stepIndicator)).toBeInTheDocument();
      
      // Check for navigation buttons
      expect(screen.getByTestId(T.onboarding.nextButton)).toBeInTheDocument();
    });

    it('should display the first step by default', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // First step should be visible
      expect(screen.getByTestId(T.onboarding.step1)).toBeInTheDocument();
      
      // Other steps should not be visible
      expect(screen.queryByTestId(T.onboarding.step2)).not.toBeInTheDocument();
      expect(screen.queryByTestId(T.onboarding.step3)).not.toBeInTheDocument();
    });

    it('should show progress indicator with correct step', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      const progressIndicator = screen.getByTestId(T.onboarding.progressIndicator);
      expect(progressIndicator).toBeInTheDocument();
      expect(progressIndicator).toHaveTextContent('1 of 6');
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step when next button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Start on step 1
      expect(screen.getByTestId(T.onboarding.step1)).toBeInTheDocument();
      
      // Click next button
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Should move to step 2
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId(T.onboarding.step1)).not.toBeInTheDocument();
    });

    it('should navigate to previous step when back button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to step 2
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByTestId(T.onboarding.backButton);
      await user.click(backButton);
      
      // Should return to step 1
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step1)).toBeInTheDocument();
      });
    });

    it('should not allow navigation beyond last step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate through all steps
      for (let i = 0; i < 6; i++) {
        const nextButton = screen.getByTestId(T.onboarding.nextButton);
        await user.click(nextButton);
        await waitFor(() => {
          expect(screen.getByTestId(T.onboarding.stepIndicator)).toBeInTheDocument();
        });
      }

      // Should be on last step
      expect(screen.getByTestId(T.onboarding.step6)).toBeInTheDocument();
      
      // Next button should be disabled or show "Complete"
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      expect(nextButton).toHaveTextContent('Complete');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in each step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Try to proceed without filling required fields
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.validationError)).toBeInTheDocument();
      });
    });

    it('should validate email format in auth step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Enter invalid email
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      await user.type(emailInput, 'invalid-email');
      
      // Try to proceed
      await user.click(screen.getByTestId(T.onboarding.nextButton));
      
      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.emailError)).toBeInTheDocument();
      });
    });

    it('should validate password strength in auth step', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Enter weak password
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      await user.type(passwordInput, '123');
      
      // Try to proceed
      await user.click(screen.getByTestId(T.onboarding.nextButton));
      
      // Should show password strength error
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.passwordError)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save form data to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Fill in some data
      const nameInput = screen.getByTestId(T.onboarding.nameInput);
      await user.type(nameInput, 'John Doe');
      
      // Navigate to next step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Check that data was saved to localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'onboarding-data',
        expect.stringContaining('John Doe')
      );
    });

    it('should restore form data from localStorage on component mount', () => {
      // Mock localStorage with existing data
      const mockData = {
        name: 'John Doe',
        email: 'john@example.com',
        step: 2
      };
      
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData));
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Should restore to step 2
      expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      
      // Should restore form data
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  describe('Authentication Integration', () => {
    it('should handle email/password authentication', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Fill in auth credentials
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit auth
      const authButton = screen.getByTestId(T.onboarding.authButton);
      await user.click(authButton);
      
      // Should call Supabase auth
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      });
    });

    it('should handle social authentication', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Click social auth button
      const socialButton = screen.getByTestId(T.onboarding.socialButton);
      await user.click(socialButton);
      
      // Should initiate social auth flow
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/social', expect.any(Object));
      });
    });
  });

  describe('Error Handling', () => {
    it('should display authentication errors', async () => {
      const user = userEvent.setup();
      
      // Mock failed authentication
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Fill in auth credentials
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      
      // Submit auth
      const authButton = screen.getByTestId(T.onboarding.authButton);
      await user.click(authButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.authError)).toBeInTheDocument();
        expect(screen.getByTestId(T.onboarding.authError)).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to auth step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.step2)).toBeInTheDocument();
      });

      // Fill in auth credentials
      const emailInput = screen.getByTestId(T.onboarding.emailInput);
      const passwordInput = screen.getByTestId(T.onboarding.passwordInput);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit auth
      const authButton = screen.getByTestId(T.onboarding.authButton);
      await user.click(authButton);
      
      // Should show network error message
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.networkError)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Tab through elements
      const firstElement = screen.getByTestId(T.onboarding.firstFocusable);
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);
      
      // Tab to next element
      fireEvent.keyDown(firstElement, { key: 'Tab' });
      const secondElement = screen.getByTestId(T.onboarding.secondFocusable);
      expect(document.activeElement).toBe(secondElement);
    });

    it('should have proper ARIA labels', () => {
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Check for ARIA labels
      expect(screen.getByTestId(T.onboarding.stepIndicator)).toHaveAttribute('aria-label', 'Step 1 of 6');
      expect(screen.getByTestId(T.onboarding.nextButton)).toHaveAttribute('aria-label', 'Next step');
    });

    it('should announce step changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Navigate to next step
      const nextButton = screen.getByTestId(T.onboarding.nextButton);
      await user.click(nextButton);
      
      // Should announce step change
      await waitFor(() => {
        expect(screen.getByTestId(T.onboarding.stepAnnouncement)).toBeInTheDocument();
        expect(screen.getByTestId(T.onboarding.stepAnnouncement)).toHaveTextContent('Step 2 of 6');
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <BalancedOnboardingFlow />
        </BrowserRouter>
      );

      // Unmount component
      unmount();
      
      // Should not leave any event listeners or timers
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});



