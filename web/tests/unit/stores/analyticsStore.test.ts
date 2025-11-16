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
});

