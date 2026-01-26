/**
 * Poll Wizard Store Navigation Tests
 * 
 * Tests for poll wizard store navigation and validation behavior:
 * - Step navigation (next, prev, goToStep)
 * - canProceed logic (especially on last step)
 * - Validation updates canProceed correctly
 * 
 * Created: January 2026
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  usePollWizardStore,
} from '@/lib/stores/pollWizardStore';
import { createInitialPollWizardData } from '@/lib/polls/defaults';

describe('Poll Wizard Store Navigation', () => {
  beforeEach(() => {
    usePollWizardStore.getState().resetWizard();
  });

  describe('Step Navigation', () => {
    it('starts at step 0', () => {
      const state = usePollWizardStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.canGoBack).toBe(false);
      expect(state.progress).toBeGreaterThan(0);
    });

    it('can navigate to next step when current step is valid', () => {
      const store = usePollWizardStore.getState();
      
      // Fill in valid data for step 0
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
      });

      // Read state after update
      const stateAfterUpdate = usePollWizardStore.getState();
      // Should be able to proceed
      expect(stateAfterUpdate.canProceed).toBe(true);
      
      // Navigate to next step
      store.nextStep();
      
      const newState = usePollWizardStore.getState();
      expect(newState.currentStep).toBe(1);
      expect(newState.canGoBack).toBe(true);
    });

    it('cannot navigate to next step when current step is invalid', () => {
      const store = usePollWizardStore.getState();
      
      // Leave data invalid (empty title)
      store.updateData({
        title: '',
        description: '',
      });

      // Should not be able to proceed
      expect(store.canProceed).toBe(false);
      
      // Try to navigate - should stay on current step
      const initialStep = store.currentStep;
      store.nextStep();
      
      const newState = usePollWizardStore.getState();
      expect(newState.currentStep).toBe(initialStep);
      expect(newState.errors).toHaveProperty('title');
    });

    it('can navigate backwards', () => {
      const store = usePollWizardStore.getState();
      
      // Fill in valid data and navigate forward
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
      });
      store.nextStep();
      
      // Read state after navigation
      const stateAfterNext = usePollWizardStore.getState();
      expect(stateAfterNext.currentStep).toBe(1);
      expect(stateAfterNext.canGoBack).toBe(true);
      
      // Navigate back
      store.prevStep();
      
      const newState = usePollWizardStore.getState();
      expect(newState.currentStep).toBe(0);
      expect(newState.canGoBack).toBe(false);
    });

    it('can navigate to specific step', () => {
      const store = usePollWizardStore.getState();
      
      // Fill in valid data
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
      });
      
      // Navigate to step 2
      store.goToStep(2);
      
      const newState = usePollWizardStore.getState();
      expect(newState.currentStep).toBe(2);
      expect(newState.canGoBack).toBe(true);
    });

    it('cannot navigate forward to step beyond current if current step is invalid', () => {
      const store = usePollWizardStore.getState();
      
      // Leave data invalid
      store.updateData({
        title: '',
        description: '',
      });

      // Try to go to step 2 - should fail validation
      store.goToStep(2);
      
      const newState = usePollWizardStore.getState();
      // Should stay on step 0 because validation failed
      expect(newState.currentStep).toBe(0);
      expect(newState.errors).toHaveProperty('title');
    });
  });

  describe('canProceed Logic', () => {
    it('canProceed is true when current step is valid', () => {
      const store = usePollWizardStore.getState();
      
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
      });

      // Read state after update
      const state = usePollWizardStore.getState();
      expect(state.canProceed).toBe(true);
    });

    it('canProceed is false when current step is invalid', () => {
      const store = usePollWizardStore.getState();
      
      store.updateData({
        title: '',
        description: '',
      });

      expect(store.canProceed).toBe(false);
    });

    it('canProceed updates when data changes', () => {
      const store = usePollWizardStore.getState();
      
      // Start with invalid data
      store.updateData({
        title: '',
        description: '',
      });
      const state1 = usePollWizardStore.getState();
      expect(state1.canProceed).toBe(false);

      // Fix the data
      store.updateData({
        title: 'Test Poll',
      });
      const state2 = usePollWizardStore.getState();
      expect(state2.canProceed).toBe(true);
    });

    it('canProceed is true on last step when step is valid', () => {
      const store = usePollWizardStore.getState();
      
      // Fill in all required data
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
        category: 'politics',
        options: ['Option 1', 'Option 2'],
        tags: ['test'],
      });

      // Navigate to last step
      store.nextStep(); // Step 1
      store.nextStep(); // Step 2
      store.nextStep(); // Step 3 (last step)
      
      const state = usePollWizardStore.getState();
      expect(state.currentStep).toBe(3);
      expect(state.isComplete).toBe(true);
      // On last step, canProceed should be true if step is valid
      expect(state.canProceed).toBe(true);
    });

    it('canProceed is false on last step when step is invalid', () => {
      const store = usePollWizardStore.getState();
      
      // Fill in valid data to reach last step
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
        category: 'politics',
        options: ['Option 1', 'Option 2'],
        tags: ['test'],
      });

      // Navigate to last step
      store.nextStep(); // Step 1
      store.nextStep(); // Step 2
      store.nextStep(); // Step 3 (last step)
      
      // Now make the data invalid for step 3 (title too short)
      store.updateData({
        title: 'AB', // Less than 3 characters - invalid for step 3
      });
      
      const state = usePollWizardStore.getState();
      expect(state.currentStep).toBe(3);
      expect(state.isComplete).toBe(true);
      // On last step, canProceed should be false if step is invalid
      expect(state.canProceed).toBe(false);
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress correctly', () => {
      const store = usePollWizardStore.getState();
      
      // Step 0 of 4 = 25%
      expect(store.progress).toBe(25);
      
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
      });
      store.nextStep();
      
      // Step 1 of 4 = 50%
      const state = usePollWizardStore.getState();
      expect(state.progress).toBe(50);
    });

    it('progress is 100% on last step', () => {
      const store = usePollWizardStore.getState();
      
      // Fill in all required data
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
        category: 'politics',
        options: ['Option 1', 'Option 2'],
        tags: ['test'],
      });

      // Navigate to last step
      store.nextStep(); // Step 1
      store.nextStep(); // Step 2
      store.nextStep(); // Step 3 (last step)
      
      const state = usePollWizardStore.getState();
      expect(state.progress).toBe(100);
    });
  });

  describe('Validation Updates', () => {
    it('validateCurrentStep updates canProceed', () => {
      const store = usePollWizardStore.getState();
      
      // Start with invalid data (empty title)
      store.updateData({
        title: '',
        description: '',
      });
      const state1 = usePollWizardStore.getState();
      expect(state1.canProceed).toBe(false);

      // Manually validate
      store.validateCurrentStep();
      const state2 = usePollWizardStore.getState();
      expect(state2.canProceed).toBe(false);

      // Fix data
      store.updateData({
        title: 'Test Poll',
        description: 'Test description',
      });
      const state3 = usePollWizardStore.getState();
      expect(state3.canProceed).toBe(true);
    });
  });
});
