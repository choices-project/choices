/**
 * Feature Wrapper Component
 * 
 * A React component that conditionally renders content based on feature flags.
 * Provides a clean way to wrap components or sections that depend on specific features.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { useFeatureFlag, useFeatureFlagsBatch, useFeatureFlagWithDependencies, useFeatureFlags } from '../hooks/useFeatureFlags';

export type FeatureWrapperProps = {
  /** Feature flag ID to check */
  feature: string;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Content to render when feature is disabled (optional) */
  fallback?: ReactNode;
  /** Whether to show loading state while checking flag */
  showLoading?: boolean;
  /** Loading component to show */
  loadingComponent?: ReactNode;
  /** Whether to render nothing when disabled (default: false) */
  hideWhenDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Wrapper component for a single feature flag
 */
export function FeatureWrapper({
  feature,
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = <div>Loading...</div>,
  hideWhenDisabled = false,
  className,
  style
}: FeatureWrapperProps): React.ReactElement | null {
  const { enabled, disabled: _disabled, loading } = useFeatureFlag(feature);

  // Show loading state if requested and loading
  if (showLoading && loading) {
    return <>{loadingComponent}</>;
  }

  // If feature is enabled, render children
  if (enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // If feature is disabled
  if (hideWhenDisabled) {
    return null;
  }

  // Render fallback if provided
  return (
    <div className={className} style={style}>
      {fallback}
    </div>
  );
}

export type FeatureWrapperBatchProps = {
  /** Array of feature flag IDs to check */
  features: string[];
  /** Content to render when all features are enabled */
  children: ReactNode;
  /** Content to render when any feature is disabled (optional) */
  fallback?: ReactNode;
  /** Whether to render when any feature is enabled (default: false, requires all) */
  anyEnabled?: boolean;
  /** Whether to show loading state while checking flags */
  showLoading?: boolean;
  /** Loading component to show */
  loadingComponent?: ReactNode;
  /** Whether to render nothing when conditions not met */
  hideWhenDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Wrapper component for multiple feature flags
 */
export function FeatureWrapperBatch({
  features,
  children,
  fallback = null,
  anyEnabled = false,
  showLoading = false,
  loadingComponent = <div>Loading...</div>,
  hideWhenDisabled = false,
  className,
  style
}: FeatureWrapperBatchProps): React.ReactElement | null {
  const { enabled, anyEnabled: anyEnabledResult, loading } = useFeatureFlagsBatch(features);

  // Show loading state if requested and loading
  if (showLoading && loading) {
    return <>{loadingComponent}</>;
  }

  // Check if conditions are met
  const shouldRender = anyEnabled ? anyEnabledResult : enabled;

  // If conditions are met, render children
  if (shouldRender) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // If conditions are not met
  if (hideWhenDisabled) {
    return null;
  }

  // Render fallback if provided
  return (
    <div className={className} style={style}>
      {fallback}
    </div>
  );
}

export type FeatureWrapperWithDependenciesProps = {
  /** Feature flag ID to check */
  feature: string;
  /** Content to render when feature is enabled and dependencies are met */
  children: ReactNode;
  /** Content to render when feature is disabled (optional) */
  fallback?: ReactNode;
  /** Content to render when dependencies are not met (optional) */
  dependenciesFallback?: ReactNode;
  /** Whether to show loading state while checking flag */
  showLoading?: boolean;
  /** Loading component to show */
  loadingComponent?: ReactNode;
  /** Whether to render nothing when disabled */
  hideWhenDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Wrapper component for feature flags with dependencies
 */
export function FeatureWrapperWithDependencies({
  feature,
  children,
  fallback = null,
  dependenciesFallback = null,
  showLoading = false,
  loadingComponent = <div>Loading...</div>,
  hideWhenDisabled = false,
  className,
  style
}: FeatureWrapperWithDependenciesProps): React.ReactElement | null {
  const { enabled, disabled: _disabled, dependenciesMet, loading } = useFeatureFlagWithDependencies(feature);

  // Show loading state if requested and loading
  if (showLoading && loading) {
    return <>{loadingComponent}</>;
  }

  // If feature is enabled and dependencies are met, render children
  if (enabled && dependenciesMet) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // If dependencies are not met, render dependencies fallback
  if (!dependenciesMet && dependenciesFallback !== null) {
    return (
      <div className={className} style={style}>
        {dependenciesFallback}
      </div>
    );
  }

  // If feature is disabled
  if (hideWhenDisabled) {
    return null;
  }

  // Render fallback if provided
  return (
    <div className={className} style={style}>
      {fallback}
    </div>
  );
}

/**
 * Higher-order component for wrapping components with feature flags
 */
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  fallback?: React.ComponentType<P>
) {
  return function WithFeatureFlagComponent(props: P): React.ReactElement | null {
    const { enabled, disabled: _disabled, loading } = useFeatureFlag(feature);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (enabled) {
      return <WrappedComponent {...props} />;
    }

    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }

    return null;
  };
}

/**
 * Higher-order component for wrapping components with multiple feature flags
 */
export function withFeatureFlagsBatch<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  features: string[],
  fallback?: React.ComponentType<P>,
  anyEnabled = false
) {
  return function WithFeatureFlagsBatchComponent(props: P): React.ReactElement | null {
    const { anyEnabled: anyEnabledResult, loading } = useFeatureFlagsBatch(features);

    if (loading) {
      return <div>Loading...</div>;
    }

    const shouldRender = anyEnabled ? anyEnabledResult : true;

    if (shouldRender) {
      return <WrappedComponent {...props} />;
    }

    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }

    return null;
  };
}

/**
 * Utility component for debugging feature flags
 */
export function FeatureFlagDebugger(): React.ReactElement {
  const { getAllFlags, systemInfo, loading } = useFeatureFlags();
  
  if (loading) {
    return <div>Loading feature flags...</div>;
  }

  const flags = Array.from(getAllFlags().values());

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', margin: '1rem 0' }}>
      <h3>Feature Flags Debugger</h3>
      <div>
        <strong>System Info:</strong>
        <ul>
          <li>Total Flags: {systemInfo.totalFlags}</li>
          <li>Enabled: {systemInfo.enabledFlags}</li>
          <li>Disabled: {systemInfo.disabledFlags}</li>
          <li>Environment: {systemInfo.environment}</li>
        </ul>
      </div>
      <div>
        <strong>Flags:</strong>
        <ul>
          {flags.map(flag => (
            <li key={flag.id} style={{ color: flag.enabled ? 'green' : 'red' }}>
              {flag.name} ({flag.id}): {flag.enabled ? 'ENABLED' : 'DISABLED'}
              <br />
              <small>{flag.description}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Export convenience components
export const AuthFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="authentication" {...props} />
);

export const VotingFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="voting" {...props} />
);

export const DatabaseFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="database" {...props} />
);

export const APIFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="api" {...props} />
);

export const UIFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="ui" {...props} />
);

export const AdvancedPrivacyFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="advancedPrivacy" {...props} />
);

export const AnalyticsFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="analytics" {...props} />
);

export const PWAFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="pwa" {...props} />
);

export const AdminFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="admin" {...props} />
);

export const AuditFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="audit" {...props} />
);

export const ExperimentalUIFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="experimentalUI" {...props} />
);

export const AIFeaturesFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="aiFeatures" {...props} />
);
