/**
 * Zustand Store Types
 * 
 * Base types and interfaces for all Zustand stores in the application.
 * Provides consistent patterns and type safety across all stores.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

// Base store interface for common patterns
export type BaseStore = {
  // Common loading states
  isLoading: boolean;
  error: string | null;
  
  // Common actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Store middleware configuration
export type StoreMiddleware = <T>(
  config: unknown
) => (
  set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void,
  get: () => T,
  api: unknown
) => unknown;

// Store configuration options
export type StoreConfig = {
  name: string;
  persist?: boolean;
  devtools?: boolean;
  logging?: boolean;
}

// User profile types
export type UserProfile = {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
    timezone: string;
  };
  settings: {
    privacy: 'public' | 'private' | 'friends';
    location: string;
    interests: string[];
    bio?: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastLogin: string;
    loginCount: number;
  };
}

// App settings types
export type AppSettings = {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  animations: boolean;
  haptics: boolean;
  sound: boolean;
  autoSave: boolean;
  language: string;
  timezone: string;
}

// Notification types
export type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: string;
  read: boolean;
  persistent?: boolean;
}

// Navigation types
export type Breadcrumb = {
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
}

// PWA types
export type PWAState = {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: any;
  canInstall: boolean;
  isStandalone: boolean;
}

// Feature flag types
export type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: 'core' | 'optional' | 'experimental';
  dependencies?: string[];
}

// Analytics types
export type AnalyticsEvent = {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

// Store selector types
export type StoreSelector<T, R = unknown> = (state: T) => R;
export type StoreAction<T> = (state: T, ...args: unknown[]) => void;

// Store subscription types
export type StoreSubscription<T> = (state: T, prevState: T) => void;

// Store persistence types
export type PersistOptions = {
  name: string;
  storage?: any;
  partialize?: (state: any) => any;
  version?: number;
  migrate?: (persistedState: any, version: number) => any;
}

// Store devtools types
export type DevtoolsOptions = {
  name: string;
  enabled?: boolean;
  trace?: boolean;
  traceLimit?: number;
}

// Store logging types
export type LoggingOptions = {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  includeState?: boolean;
  includeActions?: boolean;
}

// Store error types
export type StoreError = {
  code: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// Store performance types
export type StorePerformance = {
  actionCount: number;
  lastAction: string;
  averageActionTime: number;
  memoryUsage?: number;
}

// Store validation types
export type StoreValidator<T> = {
  validate: (state: T) => boolean;
  errorMessage: string;
}

// Store middleware chain types
export type MiddlewareChain = {
  middlewares: StoreMiddleware[];
  config: any;
}

// Store subscription types
export type StoreSubscriptionConfig = {
  id: string;
  selector: (state: any) => any;
  callback: (value: any, prevValue: any) => void;
  active: boolean;
}

// Store batch update types
export type BatchUpdate = {
  actions: Array<{
    type: string;
    payload: any;
  }>;
  timestamp: string;
  id: string;
}

// Store cache types
export type StoreCache = {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  stale: boolean;
}

// Store synchronization types
export type StoreSync = {
  enabled: boolean;
  interval: number;
  strategy: 'push' | 'pull' | 'bidirectional';
  conflictResolution: 'last-write-wins' | 'merge' | 'manual';
}

// Store debugging types
export type StoreDebug = {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeStack: boolean;
  includeTiming: boolean;
  includeMemory: boolean;
}

// Store testing types
export type StoreTest = {
  name: string;
  setup: () => void;
  teardown: () => void;
  assertions: Array<{
    description: string;
    test: (state: any) => boolean;
  }>;
}

// Store documentation types
export type StoreDocumentation = {
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  examples: Array<{
    title: string;
    code: string;
    description: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    returns: {
      type: string;
      description: string;
    };
  }>;
}
