import { act } from '@testing-library/react';

import { usePerformanceStore } from '@/lib/stores/performanceStore';

describe('performanceStore', () => {
  beforeEach(() => {
    act(() => {
      const store = usePerformanceStore.getState();
      store.clearMetrics();
      store.clearAlerts();
    });
  });

  it('records metrics with generated identifiers and timestamps', () => {
    act(() => {
      usePerformanceStore.getState().recordMetric({
        type: 'custom',
        name: 'api:latency',
        value: 42,
        unit: 'ms',
        url: '/api/example',
        metadata: { phase: 'warm-up' },
      });
    });

    const [metric] = usePerformanceStore.getState().metrics;
    expect(metric).toBeDefined();
    expect(metric.id).toMatch(/^metric-/);
    expect(metric.timestamp).toBeInstanceOf(Date);
    expect(metric.type).toBe('custom');
    expect(metric.metadata).toEqual({ phase: 'warm-up' });
  });

  it('creates alerts with defaults for timestamp and resolved state', () => {
    act(() => {
      usePerformanceStore.getState().createAlert({
        type: 'threshold',
        severity: 'high',
        metric: 'cls',
        value: 0.35,
        threshold: 0.1,
        message: 'CLS exceeded acceptable threshold',
      });
    });

    const [alert] = usePerformanceStore.getState().alerts;
    expect(alert).toBeDefined();
    expect(alert.id).toMatch(/^alert-/);
    expect(alert.timestamp).toBeInstanceOf(Date);
    expect(alert.resolved).toBe(false);
    expect(alert.metric).toBe('cls');
  });
});


