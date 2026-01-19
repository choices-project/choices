import { act } from '@testing-library/react';

import {
  createAutoRefreshTimer,
  createPerformanceMonitor,
} from '@/lib/performance/performanceMonitorService';
import { usePerformanceStore } from '@/lib/stores/performanceStore';

jest.mock('@/lib/performance/performanceMonitorService', () => ({
  createPerformanceMonitor: jest.fn(),
  createAutoRefreshTimer: jest.fn(),
}));

const mockedCreatePerformanceMonitor =
  createPerformanceMonitor as jest.MockedFunction<typeof createPerformanceMonitor>;
const mockedCreateAutoRefreshTimer =
  createAutoRefreshTimer as jest.MockedFunction<typeof createAutoRefreshTimer>;

const originalWindow = globalThis.window;

describe('performanceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as { window?: Window }).window = {
      setInterval: jest.fn(() => 1),
      clearInterval: jest.fn(),
    } as unknown as Window;
    act(() => {
      const store = usePerformanceStore.getState();
      store.resetPerformanceState();
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

  it('starts and stops performance monitoring via the monitor service', () => {
    const stopMonitor = jest.fn();
    mockedCreatePerformanceMonitor.mockReturnValue(stopMonitor);

    act(() => {
      usePerformanceStore.getState().startMonitoring();
    });

    expect(mockedCreatePerformanceMonitor).toHaveBeenCalled();
    expect(usePerformanceStore.getState().isMonitoring).toBe(true);

    act(() => {
      usePerformanceStore.getState().stopMonitoring();
    });

    expect(stopMonitor).toHaveBeenCalled();
    expect(usePerformanceStore.getState().isMonitoring).toBe(false);
  });

  it('creates and clears auto refresh timers when toggled', () => {
    const stopTimer = jest.fn();
    mockedCreateAutoRefreshTimer.mockReturnValue(stopTimer);

    act(() => {
      usePerformanceStore.getState().setAutoRefresh(true);
    });

    expect(mockedCreateAutoRefreshTimer).toHaveBeenCalledTimes(1);

    act(() => {
      usePerformanceStore.getState().setAutoRefresh(false);
    });

    expect(stopTimer).toHaveBeenCalledTimes(1);
  });

  it('restarts auto refresh timer when interval changes while enabled', () => {
    const firstStop = jest.fn();
    const secondStop = jest.fn();
    mockedCreateAutoRefreshTimer
      .mockReturnValueOnce(firstStop)
      .mockReturnValueOnce(secondStop);

    act(() => {
      usePerformanceStore.getState().setAutoRefresh(true);
    });

    act(() => {
      usePerformanceStore.getState().setRefreshInterval(60_000);
    });

    expect(firstStop).toHaveBeenCalledTimes(1);
    expect(secondStop).not.toHaveBeenCalled();
    expect(mockedCreateAutoRefreshTimer).toHaveBeenLastCalledWith(
      expect.any(Function),
      60_000,
    );
  });

  afterEach(() => {
    if (originalWindow) {
      (globalThis as unknown as { window?: Window }).window = originalWindow;
    } else {
      delete (globalThis as { window?: Window }).window;
    }
  });
});


