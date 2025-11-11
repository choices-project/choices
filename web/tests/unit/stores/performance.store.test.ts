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

    const metric = usePerformanceStore.getState().metrics[0];
    expect(metric).toBeDefined();
    const definedMetric = metric!;
    expect(definedMetric.id).toMatch(/^metric-/);
    expect(definedMetric.timestamp).toBeInstanceOf(Date);
    expect(definedMetric.type).toBe('custom');
    expect(definedMetric.metadata).toEqual({ phase: 'warm-up' });
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

    const alert = usePerformanceStore.getState().alerts[0];
    expect(alert).toBeDefined();
    const definedAlert = alert!;
    expect(definedAlert.id).toMatch(/^alert-/);
    expect(definedAlert.timestamp).toBeInstanceOf(Date);
    expect(definedAlert.resolved).toBe(false);
    expect(definedAlert.metric).toBe('cls');
  });
});


