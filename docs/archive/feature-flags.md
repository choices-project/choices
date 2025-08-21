# Feature Flags System Documentation

## Overview

The Feature Flags System provides comprehensive feature management for the Choices platform, allowing dynamic enabling and disabling of features without code deployments. This system supports environment-based configuration, runtime flag management, and module loading strategies.

## Architecture

### Core Components

1. **FeatureFlagManager** (`web/lib/feature-flags.ts`)
   - Central management class for all feature flags
   - Environment-based configuration
   - Runtime flag management
   - Event subscription system

2. **React Hooks** (`web/hooks/useFeatureFlags.ts`)
   - `useFeatureFlags()` - Main hook for feature flag access
   - `useFeatureFlag(flagId)` - Hook for specific flag
   - `useFeatureFlagsBatch(flagIds)` - Hook for multiple flags
   - `useFeatureFlagWithDependencies(flagId)` - Hook with dependency checking
   - `useFeatureFlagManagement()` - Admin management hook

3. **Module Loader** (`web/lib/module-loader.ts`)
   - Dynamic module loading based on feature flags
   - Dependency management
   - Loading state tracking
   - Error handling

4. **React Components** (`web/components/FeatureWrapper.tsx`)
   - `FeatureWrapper` - Conditional rendering wrapper
   - `FeatureWrapperBatch` - Multiple flags wrapper
   - `FeatureWrapperWithDependencies` - Dependency-aware wrapper
   - Higher-order components for component wrapping

5. **Admin Interface** (`web/app/admin/feature-flags/page.tsx`)
   - Web-based flag management
   - Import/export functionality
   - Real-time flag toggling
   - System monitoring

## Feature Flag Categories

### Core Flags (Always Enabled)
- `authentication` - User authentication and authorization
- `voting` - Core voting functionality
- `database` - Core database functionality
- `api` - RESTful API endpoints
- `ui` - Core user interface components

### Optional Flags (Environment Controlled)
- `advancedPrivacy` - Zero-knowledge proofs, differential privacy, VOPRF protocol
- `analytics` - Data visualization, analytics dashboard, and insights
- `pwa` - Progressive web app features, offline support
- `admin` - System administration, user management, poll management
- `audit` - Advanced audit trails, logging, and compliance

### Experimental Flags (Testing)
- `experimentalUI` - New UI components and interactions
- `aiFeatures` - Machine learning and AI integration

## Environment Configuration

### Environment Variables

```bash
# Optional Features
ENABLE_ADVANCED_PRIVACY=false
ENABLE_ANALYTICS=true
ENABLE_PWA=false
ENABLE_ADMIN=true
ENABLE_AUDIT=false

# Experimental Features
ENABLE_EXPERIMENTAL_UI=false
ENABLE_AI_FEATURES=false
```

### Environment Configurations

#### Production (Basic)
```bash
ENABLE_ADVANCED_PRIVACY=false
ENABLE_ANALYTICS=true
ENABLE_PWA=false
ENABLE_ADMIN=true
ENABLE_AUDIT=false
```

#### Development (Full Features)
```bash
ENABLE_ADVANCED_PRIVACY=true
ENABLE_ANALYTICS=true
ENABLE_PWA=true
ENABLE_ADMIN=true
ENABLE_AUDIT=true
```

#### Staging (Testing)
```bash
ENABLE_ADVANCED_PRIVACY=true
ENABLE_ANALYTICS=true
ENABLE_PWA=false
ENABLE_ADMIN=true
ENABLE_AUDIT=true
```

## Usage Examples

### Basic Feature Flag Usage

```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlags';

function MyComponent() {
  const { enabled, toggle } = useFeatureFlag('analytics');
  
  return (
    <div>
      {enabled ? (
        <AnalyticsDashboard />
      ) : (
        <p>Analytics are disabled</p>
      )}
      <button onClick={toggle}>
        {enabled ? 'Disable' : 'Enable'} Analytics
      </button>
    </div>
  );
}
```

### Using Feature Wrapper Components

```typescript
import { AnalyticsFeature, FeatureWrapper } from '../components/FeatureWrapper';

function MyPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Using convenience component */}
      <AnalyticsFeature>
        <AnalyticsDashboard />
      </AnalyticsFeature>
      
      {/* Using generic wrapper */}
      <FeatureWrapper 
        feature="pwa" 
        fallback={<p>PWA features are not available</p>}
      >
        <PWAInstallPrompt />
      </FeatureWrapper>
      
      {/* Multiple flags */}
      <FeatureWrapperBatch 
        features={['admin', 'analytics']} 
        anyEnabled={true}
      >
        <AdminAnalyticsPanel />
      </FeatureWrapperBatch>
    </div>
  );
}
```

### Module Loading

```typescript
import { loadModule, shouldLoadModule } from '../lib/module-loader';

async function loadAnalyticsModule() {
  if (shouldLoadModule('analytics')) {
    const { module } = await loadModule('analytics');
    return module.AnalyticsDashboard;
  }
  return null;
}
```

### Admin Management

```typescript
import { useFeatureFlagManagement } from '../hooks/useFeatureFlags';

function AdminPanel() {
  const { 
    flags, 
    systemInfo, 
    updateFlagMetadata, 
    reset, 
    exportConfig 
  } = useFeatureFlagManagement();
  
  const handleToggle = (flagId: string) => {
    const flag = flags.get(flagId);
    if (flag) {
      updateFlagMetadata(flagId, { enabled: !flag.enabled });
    }
  };
  
  return (
    <div>
      <h2>Feature Flags ({systemInfo.totalFlags})</h2>
      {Array.from(flags.values()).map(flag => (
        <div key={flag.id}>
          <span>{flag.name}</span>
          <button onClick={() => handleToggle(flag.id)}>
            {flag.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### FeatureFlagManager

#### Methods

- `isEnabled(flagId: string): boolean` - Check if flag is enabled
- `enable(flagId: string): boolean` - Enable a flag
- `disable(flagId: string): boolean` - Disable a flag
- `toggle(flagId: string): boolean` - Toggle a flag
- `getFlag(flagId: string): FeatureFlag | undefined` - Get flag details
- `getAllFlags(): Map<string, FeatureFlag>` - Get all flags
- `getFlagsByCategory(category): FeatureFlag[]` - Get flags by category
- `addFlag(flag: FeatureFlag): void` - Add new flag
- `removeFlag(flagId: string): boolean` - Remove flag
- `subscribe(listener): () => void` - Subscribe to changes
- `exportConfig(): FeatureFlagConfig` - Export configuration
- `importConfig(config: FeatureFlagConfig): void` - Import configuration
- `reset(): void` - Reset to defaults

#### Properties

- `systemInfo` - System information and statistics

### React Hooks

#### useFeatureFlags()
Returns comprehensive feature flag management functions and data.

#### useFeatureFlag(flagId: string)
Returns state and actions for a specific feature flag.

#### useFeatureFlagsBatch(flagIds: string[])
Returns state for multiple feature flags with batch operations.

#### useFeatureFlagWithDependencies(flagId: string)
Returns flag state with dependency checking.

#### useFeatureFlagManagement()
Returns admin management functions and system information.

### Module Loader

#### Methods

- `loadModule(moduleId: string): Promise<LoadedModule>` - Load a module
- `loadModules(moduleIds: string[]): Promise<LoadedModule[]>` - Load multiple modules
- `loadAllModules(): Promise<LoadedModule[]>` - Load all enabled modules
- `shouldLoadModule(moduleId: string): boolean` - Check if module should load
- `isModuleLoaded(moduleId: string): boolean` - Check if module is loaded
- `isModuleLoading(moduleId: string): boolean` - Check if module is loading
- `registerModule(config: ModuleConfig): void` - Register a module
- `unregisterModule(moduleId: string): boolean` - Unregister a module

### React Components

#### FeatureWrapper
Conditionally renders content based on a single feature flag.

#### FeatureWrapperBatch
Conditionally renders content based on multiple feature flags.

#### FeatureWrapperWithDependencies
Conditionally renders content with dependency checking.

#### Higher-Order Components

- `withFeatureFlag(Component, flagId, fallback?)` - Wrap component with flag check
- `withFeatureFlagsBatch(Component, flagIds, fallback?, anyEnabled?)` - Wrap with multiple flags

## Best Practices

### 1. Flag Naming
- Use descriptive, lowercase names with camelCase
- Prefix experimental flags with `experimental`
- Use consistent naming patterns

### 2. Flag Categories
- **Core**: Essential functionality, always enabled
- **Optional**: Additional features, environment controlled
- **Experimental**: Testing features, development only

### 3. Dependencies
- Define clear dependencies between flags
- Use dependency checking for complex features
- Document dependency relationships

### 4. Performance
- Use React hooks efficiently
- Avoid unnecessary re-renders
- Cache flag states when appropriate

### 5. Testing
- Test with different flag combinations
- Mock flag states in tests
- Test fallback scenarios

### 6. Monitoring
- Monitor flag usage and performance
- Track flag changes and their impact
- Use the admin interface for oversight

## Migration Guide

### Adding New Feature Flags

1. **Define the flag** in `FeatureFlagManager.initializeFlags()`
2. **Set environment variable** if needed
3. **Add to module loader** if applicable
4. **Create convenience components** if frequently used
5. **Update documentation**

### Example: Adding a New Analytics Feature

```typescript
// 1. Add to feature flags
this.addFlag({
  id: 'advancedAnalytics',
  name: 'Advanced Analytics',
  description: 'Advanced analytics and reporting features',
  enabled: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
  category: 'optional',
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. Add to module loader
this.registerModule({
  id: 'advancedAnalytics',
  name: 'Advanced Analytics Module',
  description: 'Advanced analytics and reporting',
  featureFlag: 'advancedAnalytics',
  loadFunction: () => import('../components/analytics/AdvancedAnalytics'),
  fallback: null
});

// 3. Create convenience component
export const AdvancedAnalyticsFeature = (props: Omit<FeatureWrapperProps, 'feature'>) => (
  <FeatureWrapper feature="advancedAnalytics" {...props} />
);
```

## Troubleshooting

### Common Issues

1. **Flag not updating**: Check if you're using the hook correctly
2. **Module not loading**: Verify flag is enabled and dependencies are met
3. **Performance issues**: Check for unnecessary re-renders
4. **Admin interface not working**: Ensure proper permissions

### Debug Tools

- Use `FeatureFlagDebugger` component for debugging
- Check browser console for errors
- Use admin interface for real-time monitoring
- Export/import configurations for testing

## Security Considerations

1. **Admin Access**: Restrict admin interface access
2. **Flag Validation**: Validate flag configurations
3. **Audit Logging**: Log flag changes for compliance
4. **Environment Isolation**: Separate production and development flags

## Performance Considerations

1. **Lazy Loading**: Use module loader for large features
2. **Caching**: Cache flag states appropriately
3. **Bundle Size**: Only load enabled features
4. **Re-renders**: Minimize unnecessary component updates

## Future Enhancements

1. **Remote Configuration**: Load flags from external service
2. **A/B Testing**: Support for A/B testing with flags
3. **User Targeting**: Target flags to specific users
4. **Rollout Strategies**: Gradual rollout capabilities
5. **Analytics Integration**: Track flag usage and impact
6. **Webhook Support**: Notify external systems of flag changes
