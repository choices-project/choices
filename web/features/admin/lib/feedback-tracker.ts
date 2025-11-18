/**
 * Enhanced Feedback Tracking System
 * Collects comprehensive telemetry for AI analysis, support, and diagnostics.
 * Refined to support explicit teardown, typed configuration, and browser guards.
 */

import { devLog } from '@/lib/utils/logger';

import type {
  DeviceInfo,
  FeedbackContext,
  PerformanceMetricsSnapshot,
  TrackedError,
  TrackedNetworkRequest,
  UserJourney,
} from '../types';

type CleanupCallback = () => void;

export type FeedbackTrackerOptions = {
  maxTrackedErrors?: number;
  maxTrackedActions?: number;
  maxTrackedNetworkRequests?: number;
  maxTrackedConsoleLogs?: number;
  enablePerformanceTracking?: boolean;
  enableNetworkTracking?: boolean;
  enableInteractionTracking?: boolean;
};

type LayoutShiftEntry = PerformanceEntry & { value?: number; hadRecentInput?: boolean };
type FirstInputEntry = PerformanceEntry & { processingStart?: number };

class FeedbackTracker {
  private static readonly DEFAULT_OPTIONS: Required<FeedbackTrackerOptions> = {
    maxTrackedErrors: 50,
    maxTrackedActions: 100,
    maxTrackedNetworkRequests: 50,
    maxTrackedConsoleLogs: 100,
    enablePerformanceTracking: true,
    enableNetworkTracking: true,
    enableInteractionTracking: true,
  };

  private readonly options: Required<FeedbackTrackerOptions>;
  private readonly isBrowser: boolean;
  private readonly hasDocument: boolean;
  private readonly hasNavigator: boolean;

  private sessionId: string;
  private sessionStartTime: string;
  private pageViews = 0;
  private actionSequence: string[] = [];
  private errors: TrackedError[] = [];
  private performanceMetrics: PerformanceMetricsSnapshot = {};
  private cleanupCallbacks: CleanupCallback[] = [];
  private originalFetch: typeof window.fetch | null = null;
  private originalConsoleMethods: Partial<Record<keyof Console, (...args: unknown[]) => void>> = {};
  private consoleHistory: string[] = [];
  private consolePatched = false;

  constructor(options: FeedbackTrackerOptions = {}) {
    this.options = { ...FeedbackTracker.DEFAULT_OPTIONS, ...options };
    this.isBrowser = typeof window !== 'undefined';
    this.hasDocument = typeof document !== 'undefined';
    this.hasNavigator = typeof navigator !== 'undefined';

    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date().toISOString();

    if (this.isBrowser) {
      this.initializeTracking();
    }
  }

  public dispose(): void {
    if (!this.isBrowser) {
      return;
    }

    this.cleanupCallbacks.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        devLog('FeedbackTracker cleanup failed', { error });
      }
    });
    this.cleanupCallbacks = [];

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    this.actionSequence = [];
    this.errors = [];
    this.performanceMetrics = {};
    this.consoleHistory = [];

    if (this.consolePatched) {
      this.restoreConsoleMethods();
    }
  }

  private initializeTracking(): void {
    this.trackPageView();

    if (this.options.enablePerformanceTracking) {
      this.trackPerformance();
    }

    this.trackErrors();

    if (this.options.enableInteractionTracking) {
      this.trackUserInteractions();
    }

    if (this.options.enableNetworkTracking) {
      this.trackNetworkRequests();
    }

    this.trackConsoleLogs();
  }

  private generateSessionId(): string {
    // Use cryptographically secure random number generator
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(9);
      crypto.getRandomValues(array);
      const randomPart = Array.from(array, byte => byte.toString(36)).join('').slice(0, 9);
      return `session_${Date.now()}_${randomPart}`;
    }
    // Fallback for environments without crypto
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private trackPageView(): void {
    this.pageViews += 1;

    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime;
      this.updateTimeOnPage(timeOnPage);
    };

    window.addEventListener('beforeunload', handleBeforeUnload, { once: true });
    this.cleanupCallbacks.push(() => window.removeEventListener('beforeunload', handleBeforeUnload));
  }

  private trackPerformance(): void {
    if (!('performance' in window)) {
      return;
    }

    const captureNavigationMetrics = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!navigationEntry) {
        return;
      }

      const pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.startTime;
      if (Number.isFinite(pageLoadTime)) {
        this.performanceMetrics.pageLoadTime = pageLoadTime;
      }
    };

    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.performanceMetrics.fcp = entry.startTime;
            }
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });
        this.cleanupCallbacks.push(() => paintObserver.disconnect());
      } catch {
        /* no-op */
      }

      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.performanceMetrics.lcp = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.cleanupCallbacks.push(() => lcpObserver.disconnect());
      } catch {
        /* no-op */
      }

      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const firstInput = entry as FirstInputEntry;
            if (typeof firstInput.processingStart === 'number') {
              this.performanceMetrics.fid = firstInput.processingStart - firstInput.startTime;
            }
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.cleanupCallbacks.push(() => fidObserver.disconnect());
      } catch {
        /* no-op */
      }

      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = this.performanceMetrics.cls ?? 0;
          list.getEntries().forEach((entry) => {
            const layoutShift = entry as LayoutShiftEntry;
            if (!layoutShift.hadRecentInput && typeof layoutShift.value === 'number') {
              clsValue += layoutShift.value;
            }
          });
          this.performanceMetrics.cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.cleanupCallbacks.push(() => clsObserver.disconnect());
      } catch {
        /* no-op */
      }
    }

    const idleCallback = (window as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (typeof idleCallback === 'function') {
      idleCallback(captureNavigationMetrics);
    } else {
      setTimeout(captureNavigationMetrics, 1000);
    }
  }

  private trackErrors(): void {
    const handleError = (event: ErrorEvent) => {
      const trackedError: TrackedError = {
        type: 'javascript',
        message: event.message,
        timestamp: new Date().toISOString(),
      };

      if (typeof event.error?.stack === 'string') {
        trackedError.stack = event.error.stack;
      }

      this.recordError(trackedError);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string } | undefined;
      const trackedError: TrackedError = {
        type: 'promise',
        message: reason?.message ?? 'Unhandled Promise Rejection',
        timestamp: new Date().toISOString(),
      };

      if (typeof reason?.stack === 'string') {
        trackedError.stack = reason.stack;
      }

      this.recordError(trackedError);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    this.cleanupCallbacks.push(() => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    });
  }

  private recordAction(action: string): void {
    this.actionSequence = [...this.actionSequence, action].slice(-this.options.maxTrackedActions);
  }

  private trackUserInteractions(): void {
    if (!this.hasDocument) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const descriptor = this.describeElement(target);
      this.recordAction(`click:${descriptor}`);
    };

    const handleSubmit = (event: Event) => {
      const target = event.target as HTMLFormElement | null;
      const descriptor = target?.action || this.describeElement(target);
      this.recordAction(`submit:${descriptor}`);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    this.cleanupCallbacks.push(() => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    });
  }

  private trackNetworkRequests(): void {
    if (!this.options.enableNetworkTracking || this.originalFetch || typeof window.fetch !== 'function') {
      return;
    }

    this.originalFetch = window.fetch.bind(window);

    const trackedFetch: typeof window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const fetchImpl = this.originalFetch ?? window.fetch;
        const response = await fetchImpl(...args);
        const duration = Date.now() - startTime;
        this.recordNetworkRequest(this.buildNetworkRequest(args, response.status, duration));
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        const message = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails =
          typeof error === 'object' && error !== null ? { error: error as Record<string, unknown> } : undefined;

        this.recordError({
          type: 'network',
          message,
          timestamp: new Date().toISOString(),
          duration,
          ...(errorDetails ? { details: errorDetails } : {}),
        });
        throw error;
      }
    };

    window.fetch = trackedFetch;

    this.cleanupCallbacks.push(() => {
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
        this.originalFetch = null;
      }
    });
  }

  private buildNetworkRequest(
    args: Parameters<typeof window.fetch>,
    status: number,
    duration: number
  ): TrackedNetworkRequest {
    const [input, init] = args;
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : 'url' in input
            ? input.url
            : 'unknown';

    let method = 'GET';

    if (init?.method) {
      method = init.method;
    } else if (typeof input === 'object' && 'method' in input && input.method) {
      method = input.method;
    }

    return {
      url,
      method,
      status,
      duration,
    };
  }

  private recordNetworkRequest(request: TrackedNetworkRequest): void {
    const existing = this.performanceMetrics.networkRequests ?? [];
    const next = [...existing, request].slice(-this.options.maxTrackedNetworkRequests);
    this.performanceMetrics.networkRequests = next;
  }

  private trackConsoleLogs(): void {
    if (!this.isBrowser || this.consolePatched || typeof window.console === 'undefined') {
      return;
    }

    const consoleObject = window.console;
    const methods: Array<keyof Console> = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach((method) => {
      const original = consoleObject[method];
      if (typeof original !== 'function') {
        return;
      }

      const bound = (...innerArgs: unknown[]) => {
        (original as (...args: unknown[]) => void).apply(consoleObject, innerArgs);
      };
      this.originalConsoleMethods[method] = bound;

      Object.defineProperty(consoleObject, method, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: (...args: unknown[]) => {
          const timestamp = new Date().toISOString();
          const serializedArgs = args
            .map((arg) => {
              if (typeof arg === 'string') {
                return arg;
              }
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            })
            .join(' ');

          const entry = `[${timestamp}] ${method.toUpperCase()}: ${serializedArgs}`;
          this.consoleHistory = [...this.consoleHistory, entry].slice(-this.options.maxTrackedConsoleLogs);

          bound(...args);
        },
      });
    });

    this.consolePatched = true;

    this.cleanupCallbacks.push(() => {
      this.restoreConsoleMethods();
    });
  }

  private restoreConsoleMethods(): void {
    if (!this.isBrowser || !this.consolePatched) {
      return;
    }

    const consoleObject = window.console;
    Object.entries(this.originalConsoleMethods).forEach(([method, original]) => {
      if (original) {
        Object.defineProperty(consoleObject, method, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: original,
        });
      }
    });

    this.originalConsoleMethods = {};
    this.consolePatched = false;
  }

  private updateTimeOnPage(timeOnPage: number): void {
    this.performanceMetrics.timeOnPage = timeOnPage;
  }

  public getDeviceInfo(): DeviceInfo {
    if (!this.hasNavigator || !this.isBrowser) {
      return {
        deviceType: 'desktop',
        platform: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        language: 'en-US',
        timezone: 'UTC',
        screenResolution: 'unknown',
        viewportSize: 'unknown',
        userAgent: 'unknown',
      };
    }

    const screen = window.screen;

    return {
      deviceType: this.getDeviceType(),
      platform: navigator.platform ?? 'unknown',
      browser: this.getBrowser(),
      os: this.getOS(),
      language: navigator.language ?? 'en-US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (!this.isBrowser) {
      return 'desktop';
    }
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getOS(): string {
    if (!this.hasNavigator) {
      return 'Unknown';
    }
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(): string {
    if (!this.hasNavigator) {
      return 'Unknown';
    }
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  public captureUserJourney(): UserJourney {
    const isBrowser = this.isBrowser;
    const userAgent = this.hasNavigator ? navigator.userAgent : 'unknown';
    const currentPage = isBrowser ? window.location.pathname : '';
    const currentPath = isBrowser ? window.location.href : '';
    const pageTitle = this.hasDocument ? document.title : '';
    const referrer = this.hasDocument ? document.referrer : '';
    const screenWidth = isBrowser ? window.screen.width : 0;
    const screenHeight = isBrowser ? window.screen.height : 0;
    const viewportWidth = isBrowser ? window.innerWidth : 0;
    const viewportHeight = isBrowser ? window.innerHeight : 0;

    const performanceMetrics: PerformanceMetricsSnapshot = {};
    if (this.performanceMetrics.fcp !== undefined) performanceMetrics.fcp = this.performanceMetrics.fcp;
    if (this.performanceMetrics.lcp !== undefined) performanceMetrics.lcp = this.performanceMetrics.lcp;
    if (this.performanceMetrics.fid !== undefined) performanceMetrics.fid = this.performanceMetrics.fid;
    if (this.performanceMetrics.cls !== undefined) performanceMetrics.cls = this.performanceMetrics.cls;
    if (this.performanceMetrics.pageLoadTime !== undefined) {
      performanceMetrics.pageLoadTime = this.performanceMetrics.pageLoadTime;
    }
    if (this.performanceMetrics.timeOnPage !== undefined) {
      performanceMetrics.timeOnPage = this.performanceMetrics.timeOnPage;
    }
    if (this.performanceMetrics.networkRequests) {
      performanceMetrics.networkRequests = this.performanceMetrics.networkRequests.map((request) => ({ ...request }));
    }

    const errors = this.errors.map((error) => ({ ...error }));

    const userJourney: UserJourney = {
      currentPage,
      currentPath,
      pageTitle,
      referrer,
      userAgent,
      screenResolution: `${screenWidth}x${screenHeight}`,
      viewportSize: `${viewportWidth}x${viewportHeight}`,
      timeOnPage: this.performanceMetrics.timeOnPage ?? 0,
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      totalPageViews: this.pageViews,
      activeFeatures: this.getActiveFeatures(),
      lastAction: this.actionSequence[this.actionSequence.length - 1] ?? 'none',
      actionSequence: this.actionSequence.slice(-Math.min(10, this.options.maxTrackedActions)),
      pageLoadTime: this.performanceMetrics.pageLoadTime ?? 0,
      performanceMetrics,
      errors,
      deviceInfo: this.getDeviceInfo(),
      isAuthenticated: this.isUserAuthenticated(),
    };

    const userRole = this.getUserRole();
    if (userRole) {
      userJourney.userRole = userRole;
    }

    const userId = this.getUserId();
    if (userId) {
      userJourney.userId = userId;
    }

    return userJourney;
  }

  private getActiveFeatures(): string[] {
    const features: string[] = [];

    if (!this.isBrowser || !this.hasNavigator) {
      return features;
    }

    if ('serviceWorker' in navigator) features.push('pwa');
    if ('PushManager' in window) features.push('push-notifications');
    if ('IntersectionObserver' in window) features.push('intersection-observer');
    if ('ResizeObserver' in window) features.push('resize-observer');

    if (this.hasDocument) {
      if (document.querySelector('[data-feature="polls"]')) features.push('polls');
      if (document.querySelector('[data-feature="privacy"]')) features.push('privacy-controls');
      if (document.querySelector('[data-feature="admin"]')) features.push('admin-panel');
    }

    return features;
  }

  private recordError(error: TrackedError): void {
    this.errors = [...this.errors, error].slice(-this.options.maxTrackedErrors);
  }

  private describeElement(element: Element | null): string {
    if (!element) {
      return 'unknown';
    }
    const tag = element.tagName.toLowerCase();
    const id = 'id' in element && element.id ? `#${element.id}` : '';
    const className =
      'className' in element && typeof element.className === 'string' && element.className.trim().length > 0
        ? `.${element.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
    return `${tag}${id}${className}`;
  }

  private isUserAuthenticated(): boolean {
    try {
      const hasToken = typeof localStorage !== 'undefined' && localStorage.getItem('supabase.auth.token');
      const hasAuthElement =
        this.hasDocument && !!document.querySelector('[data-auth="authenticated"]');
      const isAdminRoute = this.isBrowser && window.location.pathname.includes('/admin');
      return Boolean(hasToken || hasAuthElement || isAdminRoute);
    } catch {
      return false;
    }
  }

  private getUserRole(): string | undefined {
    if (!this.hasDocument) {
      return undefined;
    }
    return document.querySelector('[data-user-role]')?.getAttribute('data-user-role') ?? undefined;
  }

  private getUserId(): string | undefined {
    if (!this.hasDocument) {
      return undefined;
    }
    return document.querySelector('[data-user-id]')?.getAttribute('data-user-id') ?? undefined;
  }

  public captureConsoleLogs(): string[] {
    return this.consoleHistory.slice(-this.options.maxTrackedConsoleLogs);
  }

  public async captureScreenshot(): Promise<string | undefined> {
    if (!this.isBrowser) {
      return undefined;
    }

    try {
      return undefined;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        devLog('Failed to capture screenshot', { error });
      }
      return undefined;
    }
  }

  public async generateFeedbackContext(
    type: FeedbackContext['type'],
    title: string,
    description: string,
    sentiment: FeedbackContext['sentiment']
  ): Promise<FeedbackContext> {
    const userJourney = this.captureUserJourney();
    const networkRequests = (this.performanceMetrics.networkRequests ?? [])
      .slice(-this.options.maxTrackedNetworkRequests)
      .map((request) => ({ ...request }));
    const consoleLogs = this.captureConsoleLogs();

    const context: FeedbackContext = {
      feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      source: 'widget',
      userJourney,
      type,
      title,
      description,
      sentiment,
      category: this.categorizeFeedback(type, title, description),
      priority: this.determinePriority(type, sentiment),
      severity: this.determineSeverity(type, sentiment),
      consoleLogs,
      networkRequests,
      aiAnalysis: null,
    };

    const screenshot = await this.captureScreenshot();
    if (screenshot) {
      context.screenshot = screenshot;
    }

    return context;
  }

  private categorizeFeedback(type: string, title: string, description: string): string[] {
    const categories: string[] = [type];
    const content = `${title} ${description}`.toLowerCase();

    if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
      categories.push('bug-report');
    }

    if (content.includes('feature') || content.includes('request') || content.includes('add')) {
      categories.push('feature-request');
    }

    if (content.includes('slow') || content.includes('performance') || content.includes('lag')) {
      categories.push('performance');
    }

    if (content.includes('mobile') || content.includes('responsive') || content.includes('screen')) {
      categories.push('responsive-design');
    }

    if (content.includes('privacy') || content.includes('security') || content.includes('data')) {
      categories.push('privacy-security');
    }

    return categories;
  }

  private determinePriority(type: string, sentiment: string): 'low' | 'medium' | 'high' | 'urgent' {
    if (type === 'security') return 'urgent';
    if (type === 'bug' && sentiment === 'negative') return 'high';
    if (sentiment === 'negative') return 'medium';
    return 'low';
  }

  private determineSeverity(type: string, sentiment: string): 'minor' | 'moderate' | 'major' | 'critical' {
    if (type === 'security') return 'critical';
    if (type === 'bug' && sentiment === 'negative') return 'major';
    if (sentiment === 'negative') return 'moderate';
    return 'minor';
  }
}

let feedbackTracker: FeedbackTracker | null = null;

export function getFeedbackTracker(options?: FeedbackTrackerOptions): FeedbackTracker {
  if (!feedbackTracker) {
    feedbackTracker = new FeedbackTracker(options);
    return feedbackTracker;
  }

  if (options) {
    devLog('FeedbackTracker already initialised; additional options ignored', { options });
  }

  return feedbackTracker;
}

export function resetFeedbackTracker(): void {
  feedbackTracker?.dispose();
  feedbackTracker = null;
}

export { FeedbackTracker };

