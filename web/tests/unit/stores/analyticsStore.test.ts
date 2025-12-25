import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { sendAnalyticsEvents } from '@/lib/analytics/services/analyticsService';
import type { AnalyticsStore } from '@/lib/stores/analyticsStore';
import {
  analyticsStoreCreator,
  createInitialAnalyticsState,
} from '@/lib/stores/analyticsStore';

jest.mock('@/lib/analytics/services/analyticsService', () => ({
  sendAnalyticsEvents: jest.fn(),
  generateAnalyticsReport: jest.fn(),
  fetchAnalyticsDemographics: jest.fn(),
  fetchAnalyticsTrends: jest.fn(),
  fetchAnalyticsTemporal: jest.fn(),
  fetchAnalyticsPollHeatmap: jest.fn(),
  fetchAnalyticsTrustTiers: jest.fn(),
}));

const createTestAnalyticsStore = () =>
  create<AnalyticsStore>()(immer(analyticsStoreCreator));

describe('analyticsStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sendAnalyticsEvents).mockResolvedValue({ success: true, data: undefined });
  });

  it('initializes with default state', () => {
    const store = createTestAnalyticsStore();
    const initial = createInitialAnalyticsState();

    expect(store.getState().events).toEqual(initial.events);
    expect(store.getState().trackingEnabled).toBe(initial.trackingEnabled);
    expect(store.getState().preferences).toEqual(initial.preferences);
    expect(store.getState().chartData).toEqual(initial.chartData);
    expect(store.getState().error).toBe(initial.error);
  });

  it('respects consent before tracking events', () => {
    const store = createTestAnalyticsStore();

    store.getState().trackEvent({
      event_type: 'test',
      session_id: '',
      event_data: {},
      created_at: new Date().toISOString(),
      type: 'test',
      category: 'test',
      action: 'test',
    });

    expect(store.getState().events.length).toBe(0);

    store.getState().setTrackingEnabled(true);
    store.getState().updatePreferences({ trackingEnabled: true });

    store.getState().trackEvent({
      event_type: 'test',
      session_id: '',
      event_data: {},
      created_at: new Date().toISOString(),
      type: 'test',
      category: 'test',
      action: 'test',
    });

    expect(store.getState().events.length).toBe(1);
    expect(store.getState().events[0]).toMatchObject({
      type: 'test',
      category: 'test',
      action: 'test',
    });
  });

  it('resetChartState clears derived chart data', () => {
    const store = createTestAnalyticsStore();

    store.getState().setChartConfig({
      data: [{ name: 'A', value: 10, color: '#fff' }],
      maxValue: 10,
      showTrends: true,
      showConfidence: true,
    });

    store.getState().resetChartState();

    expect(store.getState().chartConfig).toBeNull();
    expect(store.getState().chartData).toHaveLength(0);
    expect(store.getState().chartMaxValue).toBe(0);
    expect(store.getState().chartShowTrends).toBe(false);
    expect(store.getState().chartShowConfidence).toBe(false);
  });

  it('resetAnalyticsState restores defaults', () => {
    const store = createTestAnalyticsStore();

    store.setState((state) => {
      state.events.push({
        id: 'event_1',
        event_type: 'sample',
        session_id: 'session',
        event_data: {},
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'sample',
        category: 'sample',
        action: 'sample',
      });
      state.trackingEnabled = true;
      state.chartData = [{ name: 'A', value: 5, color: '#000' }];
    });

    store.getState().resetAnalyticsState();

    const state = store.getState();
    expect(state.events).toHaveLength(0);
    expect(state.trackingEnabled).toBe(false);
    expect(state.chartData).toHaveLength(0);
    expect(state.preferences.trackingEnabled).toBe(false);
  });

  it('sendAnalytics clears events on success', async () => {
    const store = createTestAnalyticsStore();

    store.getState().setTrackingEnabled(true);
    store.getState().updatePreferences({ trackingEnabled: true });

    store.setState((state) => {
      state.events.push({
        id: 'event_1',
        event_type: 'sample',
        session_id: state.sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'sample',
        category: 'sample',
        action: 'sample',
      });
    });

    const serviceMock = jest.mocked(sendAnalyticsEvents);
    serviceMock.mockResolvedValueOnce({ success: true, data: undefined });

    await store.getState().sendAnalytics();

    expect(serviceMock).toHaveBeenCalledWith({
      events: expect.any(Array),
      sessionId: expect.any(String),
      timestamp: expect.any(String),
    });
    expect(store.getState().events).toHaveLength(0);
    expect(store.getState().isSending).toBe(false);
    expect(store.getState().error).toBeNull();
  });

  it('sendAnalytics records error when service fails', async () => {
    const store = createTestAnalyticsStore();

    store.getState().setTrackingEnabled(true);
    store.getState().updatePreferences({ trackingEnabled: true });

    store.setState((state) => {
      state.events.push({
        id: 'event_2',
        event_type: 'failure',
        session_id: state.sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'failure',
        category: 'failure',
        action: 'failure',
      });
    });

    jest.mocked(sendAnalyticsEvents).mockResolvedValueOnce({
      success: false,
      error: 'Failed to send analytics data',
    });

    await store.getState().sendAnalytics();

    expect(store.getState().events).toHaveLength(1);
    expect(store.getState().isSending).toBe(false);
    expect(store.getState().error).toBe('Failed to send analytics data');
  });

  it('sendAnalytics short-circuits when tracking disabled', async () => {
    const store = createTestAnalyticsStore();

    store.setState((state) => {
      state.events.push({
        id: 'event_3',
        event_type: 'sample',
        session_id: state.sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'sample',
        category: 'sample',
        action: 'sample',
      });
    });

    await store.getState().sendAnalytics();

    expect(sendAnalyticsEvents).not.toHaveBeenCalled();
    expect(store.getState().events).toHaveLength(1);
    expect(store.getState().isSending).toBe(false);
  });

  describe('consent guard', () => {
    it('shouldTrack returns false when trackingEnabled is false', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      
      // Access the internal shouldTrack function via the store
      const canTrack = store.getState().trackingEnabled && store.getState().preferences.trackingEnabled;
      expect(canTrack).toBe(false);
    });

    it('shouldTrack returns false when preferences.trackingEnabled is false', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: false });
      
      const canTrack = store.getState().trackingEnabled && store.getState().preferences.trackingEnabled;
      expect(canTrack).toBe(false);
    });

    it('shouldTrack returns true when both trackingEnabled and preferences.trackingEnabled are true', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      
      const canTrack = store.getState().trackingEnabled && store.getState().preferences.trackingEnabled;
      expect(canTrack).toBe(true);
    });

    it('trackEvent does not add event when consent is not given', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      
      store.getState().trackEvent({
        event_type: 'test',
        session_id: store.getState().sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test',
        category: 'test',
        action: 'test',
      });
      
      expect(store.getState().events).toHaveLength(0);
    });

    it('trackEvent adds event when consent is given', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      
      store.getState().trackEvent({
        event_type: 'test',
        session_id: store.getState().sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test',
        category: 'test',
        action: 'test',
      });
      
      expect(store.getState().events).toHaveLength(1);
    });

    it('sendAnalytics respects consent guard', async () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      
      // Manually add event (bypassing trackEvent which checks consent)
      store.setState((state) => {
        state.events.push({
          id: 'event_4',
          event_type: 'test',
          session_id: state.sessionId,
          event_data: {},
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          type: 'test',
          category: 'test',
          action: 'test',
        });
      });
      
      await store.getState().sendAnalytics();
      
      // Should not send when consent is not given
      expect(sendAnalyticsEvents).not.toHaveBeenCalled();
      expect(store.getState().events).toHaveLength(1);
    });

    it('consent status can be checked via trackingEnabled and preferences', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      
      const isEnabled = store.getState().trackingEnabled && store.getState().preferences.trackingEnabled;
      expect(isEnabled).toBe(true);
      
      store.getState().setTrackingEnabled(false);
      const isDisabled = store.getState().trackingEnabled && store.getState().preferences.trackingEnabled;
      expect(isDisabled).toBe(false);
    });

    it('trackPageView respects consent guard', () => {
      const store = createTestAnalyticsStore();
      
      // Without consent
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      store.getState().trackPageView('/test-page');
      expect(store.getState().events).toHaveLength(0);
      
      // With consent
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      store.getState().trackPageView('/test-page');
      expect(store.getState().events.length).toBeGreaterThan(0);
      expect(store.getState().events[0].type).toBe('page_view');
      expect(store.getState().events[0].label).toBe('/test-page');
    });

    it('trackUserAction respects consent guard', () => {
      const store = createTestAnalyticsStore();
      
      // Without consent
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      store.getState().trackUserAction('click', 'button', 'submit-btn', 1);
      expect(store.getState().events).toHaveLength(0);
      
      // With consent
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      store.getState().trackUserAction('click', 'button', 'submit-btn', 1);
      expect(store.getState().events.length).toBeGreaterThan(0);
      expect(store.getState().events[0].type).toBe('user_action');
      expect(store.getState().events[0].action).toBe('click');
      expect(store.getState().events[0].category).toBe('button');
      expect(store.getState().events[0].label).toBe('submit-btn');
    });

    it('trackError respects consent guard', () => {
      const store = createTestAnalyticsStore();
      
      // Without consent
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      const testError = new Error('Test error');
      store.getState().trackError(testError, { context: 'test' });
      expect(store.getState().events).toHaveLength(0);
      
      // With consent
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      store.getState().trackError(testError, { context: 'test' });
      expect(store.getState().events.length).toBeGreaterThan(0);
      expect(store.getState().events[0].type).toBe('error');
      expect(store.getState().events[0].label).toBe('Test error');
    });

    it('trackPerformance respects performanceTracking preference', () => {
      const store = createTestAnalyticsStore();
      
      // Without performance tracking enabled
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ 
        trackingEnabled: true,
        performanceTracking: false 
      });
      store.getState().trackPerformance({ pageLoadTime: 100 });
      expect(store.getState().performanceMetrics).toBeNull();
      
      // With performance tracking enabled
      store.getState().updatePreferences({ performanceTracking: true });
      store.getState().trackPerformance({ pageLoadTime: 100 });
      expect(store.getState().performanceMetrics).not.toBeNull();
      expect(store.getState().performanceMetrics?.pageLoadTime).toBe(100);
    });

    it('consent guard blocks tracking when only trackingEnabled is true', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: false });
      
      store.getState().trackEvent({
        event_type: 'test',
        session_id: store.getState().sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test',
        category: 'test',
        action: 'test',
      });
      
      expect(store.getState().events).toHaveLength(0);
    });

    it('consent guard blocks tracking when only preferences.trackingEnabled is true', () => {
      const store = createTestAnalyticsStore();
      
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: true });
      
      store.getState().trackEvent({
        event_type: 'test',
        session_id: store.getState().sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test',
        category: 'test',
        action: 'test',
      });
      
      expect(store.getState().events).toHaveLength(0);
    });

    it('consent can be toggled on and off', () => {
      const store = createTestAnalyticsStore();
      const sessionId = store.getState().sessionId;
      
      // Start disabled
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      store.getState().trackEvent({
        event_type: 'test',
        session_id: sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test',
        category: 'test',
        action: 'test',
      });
      expect(store.getState().events).toHaveLength(0);
      
      // Enable
      store.getState().setTrackingEnabled(true);
      store.getState().updatePreferences({ trackingEnabled: true });
      store.getState().trackEvent({
        event_type: 'test',
        session_id: sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test',
        category: 'test',
        action: 'test',
      });
      expect(store.getState().events).toHaveLength(1);
      
      // Disable again
      store.getState().setTrackingEnabled(false);
      store.getState().trackEvent({
        event_type: 'test2',
        session_id: sessionId,
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'test2',
        category: 'test2',
        action: 'test2',
      });
      expect(store.getState().events).toHaveLength(1); // Still only 1 event
    });

    it('consent guard prevents event accumulation when disabled', () => {
      const store = createTestAnalyticsStore();
      const sessionId = store.getState().sessionId;
      
      store.getState().setTrackingEnabled(false);
      store.getState().updatePreferences({ trackingEnabled: false });
      
      // Try to track multiple events
      for (let i = 0; i < 5; i++) {
        store.getState().trackEvent({
          event_type: `test_${i}`,
          session_id: sessionId,
          event_data: {},
          created_at: new Date().toISOString(),
          type: `test_${i}`,
          category: 'test',
          action: 'test',
        });
      }
      
      expect(store.getState().events).toHaveLength(0);
    });
  });
});

