# Feature Flags Feature Documentation

**Created:** October 10, 2025  
**Updated:** December 19, 2024  
**Status:** ✅ Production Ready - Admin Dashboard Integration Complete  
**Admin Integration:** ✅ **CONSOLIDATED INTO ADMIN STORE**

## 🎯 Overview

The Feature Flags system provides comprehensive feature flag management with centralized state management, performance optimization, and developer-friendly APIs. This system has been completely migrated from a complex 300+ line hook system to a modern Zustand-based architecture and is now fully integrated into the admin dashboard for production management.

## 📊 Implementation Status

### **✅ COMPLETE IMPLEMENTATION:**
- **Core System**: Feature flag management integrated into admin store
- **Admin Dashboard**: Full feature flag management interface
- **Performance**: Optimized re-renders with selective subscriptions
- **Persistence**: Automatic state persistence across sessions
- **Type Safety**: Comprehensive TypeScript support
- **Developer Experience**: Simplified API replacing complex hook system
- **Production Management**: Runtime flag control without code changes

## 🏗️ **Admin Store Integration**

### **Integration Status:**
- **Previous State:** Separate FeatureFlagsStore
- **Current State:** Integrated into AdminStore
- **Admin Dashboard:** Full feature flag management interface
- **Status:** ✅ **CONSOLIDATION COMPLETE**

### **Admin Store Integration:**
```typescript
// Import AdminStore for feature flag management
import { useAdminStore } from '@/features/admin/lib/store';

// Use admin store for feature flag management
function FeatureFlagComponent() {
  const {
    featureFlags,
    enableFeatureFlag,
    disableFeatureFlag,
    toggleFeatureFlag,
    getAllFeatureFlags,
    exportFeatureFlagConfig,
    importFeatureFlagConfig,
    resetFeatureFlags
  } = useAdminStore();

  const isAnalyticsEnabled = featureFlags.flags.ANALYTICS;
  const enabledFlags = featureFlags.enabledFlags;
  const loading = featureFlags.isLoading;
  const error = featureFlags.error;

  const handleToggleAnalytics = () => {
    toggleFeatureFlag('ANALYTICS');
  };

  return (
    <div>
      <h1>Feature Flags</h1>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={isAnalyticsEnabled}
            onChange={handleToggleAnalytics}
          />
          Analytics
        </label>
      </div>
      
      <div>
        <h2>Enabled Flags ({enabledFlags.length})</h2>
        {enabledFlags.map(flag => (
          <div key={flag}>{flag}</div>
        ))}
      </div>
    </div>
  );
}
```

### **Benefits of Admin Integration:**
- **Centralized Management:** All admin features in one store
- **Production Control:** Runtime flag management without code changes
- **Admin Dashboard:** Full-featured management interface
- **Performance:** Optimized re-renders with selective subscriptions
- **Persistence:** Automatic state persistence across sessions
- **Type Safety:** Comprehensive TypeScript support
- **Consistency:** Same patterns as other admin features

## 🏗️ Architecture

### **Core Components**

#### **1. Admin Store Integration (`web/features/admin/lib/store.ts`)**
- **Purpose**: Centralized admin store with integrated feature flag management
- **Features**: 
  - Flag state management integrated with admin state
  - Performance optimized with selective subscriptions
  - Automatic persistence with Zustand persist middleware
  - Comprehensive TypeScript support
  - DevTools integration for debugging
  - Admin dashboard integration

#### **2. Core Feature Flags System (`web/lib/core/feature-flags.ts`)**
- **Purpose**: Core feature flag definitions and management
- **Features**:
  - Feature flag definitions with categories
  - Runtime flag management with subscription system
  - Flag metadata and dependency management
  - Export/import functionality for configuration

#### **3. Feature Flags Admin Component (`web/features/admin/components/FeatureFlags.tsx`)**
- **Purpose**: Admin dashboard interface for feature flag management
- **Features**:
  - Visual flag management interface
  - Category-based filtering
  - Search functionality
  - Export/import configuration
  - Real-time flag toggling
  - Error handling and loading states

### **Admin Dashboard Integration**

#### **Feature Flags Management Interface**
- **Location**: `web/features/admin/components/FeatureFlags.tsx`
- **Purpose**: Production-ready feature flag management
- **Features**:
  - Real-time flag toggling
  - Category-based organization
  - Search and filtering
  - Configuration export/import
  - Bulk operations
  - Error handling and validation

#### **Admin Store Integration**
- **Location**: `web/features/admin/lib/store.ts`
- **Purpose**: Centralized admin state with feature flags
- **Features**:
  - Integrated flag management
  - Admin-specific flag actions
  - Production control capabilities
  - Audit logging
  - Performance monitoring

### **Supporting Components**

#### **Feature Flag Manager**
- **Location**: `web/lib/core/feature-flags.ts`
- **Purpose**: Core flag management functionality
- **Features**:
  - Flag enable/disable/toggle operations
  - Subscription system for flag changes
  - Flag metadata management
  - Configuration export/import

#### **Feature Flag Types**
- **Location**: `web/features/admin/types/index.ts`
- **Purpose**: TypeScript type definitions for admin integration
- **Features**:
  - FeatureFlag interface
  - FeatureFlagConfig type
  - FeatureFlagState interface
  - AdminStore integration types

## 🔧 Technical Implementation

### **Store Architecture**

```typescript
interface FeatureFlagsStore {
  // State
  flags: Map<string, FeatureFlag>;
  enabledFlags: string[];
  disabledFlags: string[];
  categories: Record<string, string[]>;
  systemInfo: {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  enableFlag: (flagId: string) => boolean;
  disableFlag: (flagId: string) => boolean;
  toggleFlag: (flagId: string) => boolean;
  isEnabled: (flagId: string) => boolean;
  isDisabled: (flagId: string) => boolean;
  getFlag: (flagId: string) => FeatureFlag | undefined;
  getFlagsByCategory: (category: string) => FeatureFlag[];
  getEnabledFlags: () => FeatureFlag[];
  getDisabledFlags: () => FeatureFlag[];
  updateFlagMetadata: (flagId: string, metadata: FeatureFlagMetadata) => boolean;
  resetFlags: () => void;
  exportConfig: () => FeatureFlagConfig;
  importConfig: (config: FeatureFlagConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeFlags: () => void;
}
```

### **Flag Categories**

#### **Core MVP Features (Always Enabled)**
- `WEBAUTHN`: WebAuthn/passkey authentication
- `PWA`: Progressive Web App capabilities
- `ADMIN`: Admin dashboard and management
- `FEEDBACK_WIDGET`: User feedback collection

#### **Enhanced MVP Features**
- `ENHANCED_PROFILE`: Advanced profile management
- `ENHANCED_POLLS`: Advanced poll creation system
- `ENHANCED_VOTING`: Advanced voting methods
- `CIVICS_ADDRESS_LOOKUP`: Address-based representative lookup
- `CIVICS_REPRESENTATIVE_DATABASE`: Representative database
- `CIVICS_CAMPAIGN_FINANCE`: FEC campaign finance data
- `CIVICS_VOTING_RECORDS`: Congressional voting records
- `CANDIDATE_ACCOUNTABILITY`: Promise tracking
- `CANDIDATE_CARDS`: Candidate information cards
- `ALTERNATIVE_CANDIDATES`: Non-duopoly candidate platform

#### **Future Features**
- `AUTOMATED_POLLS`: AI-powered poll generation
- `DEMOGRAPHIC_FILTERING`: Demographic-based filtering

### **Performance Optimizations**

#### **Selective Subscriptions**
```typescript
// Only subscribe to specific flag changes
const isAnalyticsEnabled = useIsFeatureEnabled('ANALYTICS');
const enabledFlags = useEnabledFlags();
```

#### **Memoized Selectors**
```typescript
// Optimized selectors prevent unnecessary re-renders
export const useIsFeatureEnabled = (flagId: string) => 
  useFeatureFlagsStore(state => state.isEnabled(flagId));
```

#### **Persistence Strategy**
```typescript
// Only persist essential state, not loading/error states
partialize: (state) => ({
  flags: Object.fromEntries(state.flags),
  enabledFlags: state.enabledFlags,
  disabledFlags: state.disabledFlags,
  categories: state.categories,
  systemInfo: state.systemInfo
})
```

## 📋 API Reference

### **Store Selectors**

#### **Basic Flag Access**
```typescript
// Get all feature flags
const flags = useFeatureFlags();

// Get specific flag
const flag = useFeatureFlag('ANALYTICS');

// Check if flag is enabled/disabled
const isEnabled = useIsFeatureEnabled('ANALYTICS');
const isDisabled = useIsFeatureDisabled('ANALYTICS');
```

#### **Flag Collections**
```typescript
// Get enabled/disabled flags
const enabledFlags = useEnabledFlags();
const disabledFlags = useDisabledFlags();

// Get flags by category
const coreFlags = useFlagsByCategory('core');
const enhancedFlags = useFlagsByCategory('enhanced');
```

#### **System Information**
```typescript
// Get system info
const systemInfo = useFeatureFlagsSystemInfo();
// Returns: { totalFlags, enabledFlags, disabledFlags, environment, categories }

// Get loading/error states
const loading = useFeatureFlagsLoading();
const error = useFeatureFlagsError();
```

### **Store Actions**

#### **Flag Management**
```typescript
const {
  enableFlag,
  disableFlag,
  toggleFlag,
  updateFlagMetadata,
  resetFlags,
  exportConfig,
  importConfig
} = useFeatureFlagsActions();

// Enable/disable flags
enableFlag('ANALYTICS');
disableFlag('ANALYTICS');
toggleFlag('ANALYTICS');

// Update flag metadata
updateFlagMetadata('ANALYTICS', { description: 'Analytics tracking' });

// Reset all flags to defaults
resetFlags();
```

#### **Configuration Management**
```typescript
// Export current configuration
const config = exportConfig();

// Import configuration
importConfig({
  flags: { ANALYTICS: true, PWA: false },
  timestamp: new Date().toISOString(),
  version: '1.0.0'
});
```

### **Advanced Features**

#### **Flag Dependencies**
```typescript
// Check flag with dependencies
const { enabled, disabled, dependenciesMet, flag, loading } = 
  useFeatureFlagWithDependencies('ANALYTICS');
```

#### **Flag Management**
```typescript
// Advanced flag management
const {
  flags,
  systemInfo,
  updateFlagMetadata,
  reset,
  exportConfig,
  importConfig,
  loading
} = useFeatureFlagManagement();
```

## 🎯 Usage Examples

### **Admin Dashboard Integration**
```typescript
import { FeatureFlags } from '@/features/admin/components/FeatureFlags';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <FeatureFlags 
        onFlagChange={(flagId, enabled) => {
          console.log(`Flag ${flagId} ${enabled ? 'enabled' : 'disabled'}`);
        }}
      />
    </div>
  );
}
```

### **Basic Flag Checking**
```typescript
import { useAdminStore } from '@/features/admin/lib/store';

function AnalyticsComponent() {
  const { featureFlags } = useAdminStore();
  const isAnalyticsEnabled = featureFlags.flags.ANALYTICS;
  
  if (!isAnalyticsEnabled) {
    return null;
  }
  
  return <AnalyticsWidget />;
}
```

### **Admin Flag Management**
```typescript
import { useAdminStore } from '@/features/admin/lib/store';

function AdminFlagManager() {
  const {
    featureFlags,
    enableFeatureFlag,
    disableFeatureFlag,
    toggleFeatureFlag,
    getAllFeatureFlags
  } = useAdminStore();
  
  const flags = getAllFeatureFlags();
  const enabledCount = featureFlags.enabledFlags.length;
  const totalCount = Object.keys(featureFlags.flags).length;
  
  return (
    <div>
      <h1>Feature Flags ({totalCount})</h1>
      <div>
        <h2>Enabled ({enabledCount})</h2>
        {flags.map(flag => (
          <div key={flag.id}>
            <label>
              <input
                type="checkbox"
                checked={flag.enabled}
                onChange={() => toggleFeatureFlag(flag.id)}
              />
              {flag.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **Conditional Rendering**
```typescript
import { useAdminStore } from '@/features/admin/lib/store';

function App() {
  const { featureFlags } = useAdminStore();
  const isPWAEnabled = featureFlags.flags.PWA;
  const isAnalyticsEnabled = featureFlags.flags.ANALYTICS;
  
  return (
    <div>
      <Header />
      <MainContent />
      {isPWAEnabled && <PWAFeatures />}
      {isAnalyticsEnabled && <Analytics />}
      <Footer />
    </div>
  );
}
```

### **Flag Categories**
```typescript
import { useAdminStore } from '@/features/admin/lib/store';

function FlagCategories() {
  const { getAllFeatureFlags } = useAdminStore();
  const allFlags = getAllFeatureFlags();
  
  const coreFlags = allFlags.filter(flag => flag.category === 'core');
  const enhancedFlags = allFlags.filter(flag => flag.category === 'enhanced');
  const futureFlags = allFlags.filter(flag => flag.category === 'future');
  
  return (
    <div>
      <section>
        <h2>Core Features</h2>
        {coreFlags.map(flag => (
          <FlagItem key={flag.id} flag={flag} />
        ))}
      </section>
      
      <section>
        <h2>Enhanced Features</h2>
        {enhancedFlags.map(flag => (
          <FlagItem key={flag.id} flag={flag} />
        ))}
      </section>
      
      <section>
        <h2>Future Features</h2>
        {futureFlags.map(flag => (
          <FlagItem key={flag.id} flag={flag} />
        ))}
      </section>
    </div>
  );
}
```

## 🔧 Configuration

### **Flag Definitions**
```typescript
// web/lib/core/feature-flags.ts
export const FEATURE_FLAGS = {
  // Core MVP Features (Always Enabled)
  WEBAUTHN: true,
  PWA: true,
  ADMIN: true,
  FEEDBACK_WIDGET: true,
  
  // Enhanced MVP Features
  ENHANCED_PROFILE: true,
  ENHANCED_POLLS: true,
  ENHANCED_VOTING: true,
  CIVICS_ADDRESS_LOOKUP: true,
  CIVICS_REPRESENTATIVE_DATABASE: true,
  CIVICS_CAMPAIGN_FINANCE: true,
  CIVICS_VOTING_RECORDS: true,
  CANDIDATE_ACCOUNTABILITY: true,
  CANDIDATE_CARDS: true,
  ALTERNATIVE_CANDIDATES: true,
  
  // Future Features
  AUTOMATED_POLLS: false,
  DEMOGRAPHIC_FILTERING: false
} as const;
```

### **Store Configuration**
```typescript
// Store with persistence and devtools
export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Store implementation
      })),
      {
        name: 'feature-flags-storage',
        partialize: (state) => ({
          flags: Object.fromEntries(state.flags),
          enabledFlags: state.enabledFlags,
          disabledFlags: state.disabledFlags,
          categories: state.categories,
          systemInfo: state.systemInfo
        })
      }
    ),
    { name: 'feature-flags-store' }
  )
);
```

## 🚀 Performance Features

### **Optimized Re-renders**
- **Selective Subscriptions**: Only re-render when specific flags change
- **Memoized Selectors**: Prevent unnecessary re-renders
- **Efficient Updates**: Batch flag updates for better performance

### **Memory Management**
- **Flag Limits**: Automatic cleanup of old flags
- **Efficient Storage**: Map-based storage for O(1) lookups
- **Persistence**: Only persist essential state

### **Developer Experience**
- **Type Safety**: Comprehensive TypeScript support
- **DevTools**: Full Zustand devtools integration
- **Debugging**: Easy flag state inspection
- **Testing**: Simplified store testing

## 🧪 Testing

### **Store Testing**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useFeatureFlagsStore } from '@/lib/stores/featureFlagsStore';

describe('FeatureFlagsStore', () => {
  beforeEach(() => {
    useFeatureFlagsStore.getState().resetFlags();
  });

  it('should enable flag', () => {
    const { result } = renderHook(() => useFeatureFlagsStore());
    
    act(() => {
      result.current.enableFlag('ANALYTICS');
    });
    
    expect(result.current.isEnabled('ANALYTICS')).toBe(true);
  });
});
```

### **Component Testing**
```typescript
import { render, screen } from '@testing-library/react';
import { FeatureFlagComponent } from './FeatureFlagComponent';

// Mock the store
jest.mock('@/lib/stores', () => ({
  useIsFeatureEnabled: jest.fn(() => true)
}));

test('renders when flag is enabled', () => {
  render(<FeatureFlagComponent />);
  expect(screen.getByText('Analytics')).toBeInTheDocument();
});
```

## 📊 Monitoring & Analytics

### **Flag Usage Tracking**
```typescript
// Track flag usage for analytics
const { recordMetric } = usePerformanceActions();

useEffect(() => {
  if (isAnalyticsEnabled) {
    recordMetric({
      type: 'custom',
      name: 'feature_flag_usage',
      value: 1,
      unit: 'count',
      metadata: { flag: 'ANALYTICS' }
    });
  }
}, [isAnalyticsEnabled]);
```

### **Performance Monitoring**
```typescript
// Monitor flag performance impact
const { recordMetric } = usePerformanceActions();

const startTime = performance.now();
// Flag check
const isEnabled = useIsFeatureEnabled('ANALYTICS');
const endTime = performance.now();

recordMetric({
  type: 'custom',
  name: 'flag_check_duration',
  value: endTime - startTime,
  unit: 'ms'
});
```

## 🔒 Security Considerations

### **Flag Validation**
- **Type Safety**: All flags are strongly typed
- **Validation**: Flag names are validated against known flags
- **Sanitization**: Flag values are sanitized before storage

### **Access Control**
- **Admin Only**: Some flags may require admin privileges
- **User Context**: Flags may be user-specific
- **Environment**: Flags may be environment-specific

## 🚀 Future Enhancements

### **Planned Features**
1. **A/B Testing**: Flag-based A/B testing framework
2. **Gradual Rollout**: Percentage-based flag rollouts
3. **User Targeting**: User-specific flag targeting
4. **Analytics Integration**: Flag usage analytics
5. **Remote Configuration**: Remote flag configuration

### **Advanced Capabilities**
1. **Flag Dependencies**: Complex flag dependency chains
2. **Conditional Logic**: Advanced flag conditions
3. **Time-based Flags**: Scheduled flag changes
4. **Geographic Flags**: Location-based flag targeting

## 📚 Related Documentation

- [Zustand Implementation Guide](../ZUSTAND_IMPLEMENTATION_GUIDE.md)
- [Feature Flags Migration Guide](../ZUSTAND_FEATURE_FLAGS_MIGRATION_GUIDE.md)
- [Store Architecture Overview](../ZUSTAND_STORE_ARCHITECTURE.md)
- [Performance Optimization Guide](../ZUSTAND_PERFORMANCE_GUIDE.md)

## 🏆 Summary

The Feature Flags system provides comprehensive feature flag management with:

- ✅ **Admin Dashboard Integration**: Full production management interface
- ✅ **Centralized State Management**: All flags integrated into admin store
- ✅ **Performance Optimized**: Selective subscriptions and minimal re-renders
- ✅ **Type Safety**: Comprehensive TypeScript support
- ✅ **Persistence**: Automatic state persistence across sessions
- ✅ **Developer Experience**: Simplified API replacing complex hook system
- ✅ **Production Control**: Runtime flag management without code changes
- ✅ **Testing**: Easy testing with centralized state
- ✅ **Monitoring**: Performance and usage tracking
- ✅ **Security**: Validation and access control

This implementation represents a significant improvement over the previous complex hook system, providing better performance, maintainability, developer experience, and production-ready admin management capabilities.

recordMetric({
  type: 'custom',
  name: 'flag_check_duration',
  value: endTime - startTime,
  unit: 'ms'
});
```

## 🔒 Security Considerations

### **Flag Validation**
- **Type Safety**: All flags are strongly typed
- **Validation**: Flag names are validated against known flags
- **Sanitization**: Flag values are sanitized before storage

### **Access Control**
- **Admin Only**: Some flags may require admin privileges
- **User Context**: Flags may be user-specific
- **Environment**: Flags may be environment-specific

## 🚀 Future Enhancements

### **Planned Features**
1. **A/B Testing**: Flag-based A/B testing framework
2. **Gradual Rollout**: Percentage-based flag rollouts
3. **User Targeting**: User-specific flag targeting
4. **Analytics Integration**: Flag usage analytics
5. **Remote Configuration**: Remote flag configuration

### **Advanced Capabilities**
1. **Flag Dependencies**: Complex flag dependency chains
2. **Conditional Logic**: Advanced flag conditions
3. **Time-based Flags**: Scheduled flag changes
4. **Geographic Flags**: Location-based flag targeting

## 📚 Related Documentation

- [Zustand Implementation Guide](../ZUSTAND_IMPLEMENTATION_GUIDE.md)
- [Feature Flags Migration Guide](../ZUSTAND_FEATURE_FLAGS_MIGRATION_GUIDE.md)
- [Store Architecture Overview](../ZUSTAND_STORE_ARCHITECTURE.md)
- [Performance Optimization Guide](../ZUSTAND_PERFORMANCE_GUIDE.md)

## 🏆 Summary

The Feature Flags system provides comprehensive feature flag management with:

- ✅ **Admin Dashboard Integration**: Full production management interface
- ✅ **Centralized State Management**: All flags integrated into admin store
- ✅ **Performance Optimized**: Selective subscriptions and minimal re-renders
- ✅ **Type Safety**: Comprehensive TypeScript support
- ✅ **Persistence**: Automatic state persistence across sessions
- ✅ **Developer Experience**: Simplified API replacing complex hook system
- ✅ **Production Control**: Runtime flag management without code changes
- ✅ **Testing**: Easy testing with centralized state
- ✅ **Monitoring**: Performance and usage tracking
- ✅ **Security**: Validation and access control

This implementation represents a significant improvement over the previous complex hook system, providing better performance, maintainability, developer experience, and production-ready admin management capabilities.

recordMetric({
  type: 'custom',
  name: 'flag_check_duration',
  value: endTime - startTime,
  unit: 'ms'
});
```

## 🔒 Security Considerations

### **Flag Validation**
- **Type Safety**: All flags are strongly typed
- **Validation**: Flag names are validated against known flags
- **Sanitization**: Flag values are sanitized before storage

### **Access Control**
- **Admin Only**: Some flags may require admin privileges
- **User Context**: Flags may be user-specific
- **Environment**: Flags may be environment-specific

## 🚀 Future Enhancements

### **Planned Features**
1. **A/B Testing**: Flag-based A/B testing framework
2. **Gradual Rollout**: Percentage-based flag rollouts
3. **User Targeting**: User-specific flag targeting
4. **Analytics Integration**: Flag usage analytics
5. **Remote Configuration**: Remote flag configuration

### **Advanced Capabilities**
1. **Flag Dependencies**: Complex flag dependency chains
2. **Conditional Logic**: Advanced flag conditions
3. **Time-based Flags**: Scheduled flag changes
4. **Geographic Flags**: Location-based flag targeting

## 📚 Related Documentation

- [Zustand Implementation Guide](../ZUSTAND_IMPLEMENTATION_GUIDE.md)
- [Feature Flags Migration Guide](../ZUSTAND_FEATURE_FLAGS_MIGRATION_GUIDE.md)
- [Store Architecture Overview](../ZUSTAND_STORE_ARCHITECTURE.md)
- [Performance Optimization Guide](../ZUSTAND_PERFORMANCE_GUIDE.md)

## 🏆 Summary

The Feature Flags system provides comprehensive feature flag management with:

- ✅ **Admin Dashboard Integration**: Full production management interface
- ✅ **Centralized State Management**: All flags integrated into admin store
- ✅ **Performance Optimized**: Selective subscriptions and minimal re-renders
- ✅ **Type Safety**: Comprehensive TypeScript support
- ✅ **Persistence**: Automatic state persistence across sessions
- ✅ **Developer Experience**: Simplified API replacing complex hook system
- ✅ **Production Control**: Runtime flag management without code changes
- ✅ **Testing**: Easy testing with centralized state
- ✅ **Monitoring**: Performance and usage tracking
- ✅ **Security**: Validation and access control

This implementation represents a significant improvement over the previous complex hook system, providing better performance, maintainability, developer experience, and production-ready admin management capabilities.
