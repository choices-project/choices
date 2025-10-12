# Feature Flags Feature Documentation

**Created:** October 10, 2025  
**Updated:** October 10, 2025  
**Status:** ✅ Production Ready - Comprehensive Implementation  
**Zustand Integration:** ✅ **MIGRATION COMPLETE**

## 🎯 Overview

The Feature Flags system provides comprehensive feature flag management with centralized state management, performance optimization, and developer-friendly APIs. This system has been completely migrated from a complex 300+ line hook system to a modern Zustand-based architecture.

## 📊 Implementation Status

### **✅ COMPLETE IMPLEMENTATION:**
- **Core System**: Feature flag management with Zustand store
- **Performance**: Optimized re-renders with selective subscriptions
- **Persistence**: Automatic state persistence across sessions
- **Type Safety**: Comprehensive TypeScript support
- **Developer Experience**: Simplified API replacing complex hook system

## 🏗️ **Zustand Integration**

### **Migration Status:**
- **Current State:** Complex useFeatureFlags hook system (300+ lines)
- **Target State:** FeatureFlagsStore integration
- **Migration Guide:** [FEATURE_FLAGS Migration Guide](../ZUSTAND_FEATURE_FLAGS_MIGRATION_GUIDE.md)
- **Status:** ✅ **MIGRATION COMPLETE**

### **Zustand Store Integration:**
```typescript
// Import FeatureFlagsStore for feature flag management
import {
  useFeatureFlags,
  useFeatureFlag,
  useIsFeatureEnabled,
  useIsFeatureDisabled,
  useEnabledFlags,
  useDisabledFlags,
  useFlagsByCategory,
  useFeatureFlagsLoading,
  useFeatureFlagsError,
  useFeatureFlagsActions,
  useFeatureFlagWithDependencies,
  useFeatureFlagManagement
} from '@/lib/stores';

// Replace complex useFeatureFlags hook with FeatureFlagsStore
function FeatureFlagComponent() {
  const { enableFlag, disableFlag, toggleFlag } = useFeatureFlagsActions();
  const isAnalyticsEnabled = useIsFeatureEnabled('ANALYTICS');
  const enabledFlags = useEnabledFlags();
  const loading = useFeatureFlagsLoading();
  const error = useFeatureFlagsError();

  const handleToggleAnalytics = () => {
    toggleFlag('ANALYTICS');
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
          <div key={flag.id}>{flag.name}</div>
        ))}
      </div>
    </div>
  );
}
```

### **Benefits of Migration:**
- **Centralized Flag Management:** All feature flags in one store
- **Performance:** Optimized re-renders with selective subscriptions
- **Persistence:** Automatic state persistence across sessions
- **Type Safety:** Comprehensive TypeScript support
- **Consistency:** Same patterns as other features

## 🏗️ Architecture

### **Core Components**

#### **1. Feature Flags Store (`web/lib/stores/featureFlagsStore.ts`)**
- **Purpose**: Centralized Zustand store for feature flag management
- **Features**: 
  - Flag state management with Map-based storage
  - Performance optimized with selective subscriptions
  - Automatic persistence with Zustand persist middleware
  - Comprehensive TypeScript support
  - DevTools integration for debugging

#### **2. Core Feature Flags System (`web/lib/core/feature-flags.ts`)**
- **Purpose**: Core feature flag definitions and management
- **Features**:
  - Feature flag definitions with categories
  - Runtime flag management with subscription system
  - Flag metadata and dependency management
  - Export/import functionality for configuration

#### **3. Feature Flag Hooks (`web/hooks/useFeatureFlags.ts`)**
- **Purpose**: Legacy hook system (replaced by Zustand store)
- **Status**: Migrated to Zustand store
- **Current Usage**: Components use Zustand store selectors

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
- **Location**: `web/lib/core/types/index.ts`
- **Purpose**: TypeScript type definitions
- **Features**:
  - FeatureFlag interface
  - FeatureFlagKey type
  - FeatureFlagConfig type
  - FeatureFlagMetadata type

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

### **Basic Flag Checking**
```typescript
import { useIsFeatureEnabled } from '@/lib/stores';

function AnalyticsComponent() {
  const isAnalyticsEnabled = useIsFeatureEnabled('ANALYTICS');
  
  if (!isAnalyticsEnabled) {
    return null;
  }
  
  return <AnalyticsWidget />;
}
```

### **Flag Management Interface**
```typescript
import { 
  useFeatureFlags, 
  useEnabledFlags, 
  useFeatureFlagsActions 
} from '@/lib/stores';

function FeatureFlagManager() {
  const { enableFlag, disableFlag, toggleFlag } = useFeatureFlagsActions();
  const enabledFlags = useEnabledFlags();
  const { systemInfo } = useFeatureFlags();
  
  return (
    <div>
      <h1>Feature Flags ({systemInfo.totalFlags})</h1>
      <div>
        <h2>Enabled ({systemInfo.enabledFlags})</h2>
        {enabledFlags.map(flag => (
          <div key={flag.id}>
            <label>
              <input
                type="checkbox"
                checked={true}
                onChange={() => disableFlag(flag.id)}
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
import { useIsFeatureEnabled } from '@/lib/stores';

function App() {
  const isPWAEnabled = useIsFeatureEnabled('PWA');
  const isAnalyticsEnabled = useIsFeatureEnabled('ANALYTICS');
  
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
import { useFlagsByCategory } from '@/lib/stores';

function FlagCategories() {
  const coreFlags = useFlagsByCategory('core');
  const enhancedFlags = useFlagsByCategory('enhanced');
  const futureFlags = useFlagsByCategory('future');
  
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

- ✅ **Centralized State Management**: All flags in one Zustand store
- ✅ **Performance Optimized**: Selective subscriptions and minimal re-renders
- ✅ **Type Safety**: Comprehensive TypeScript support
- ✅ **Persistence**: Automatic state persistence across sessions
- ✅ **Developer Experience**: Simplified API replacing complex hook system
- ✅ **Testing**: Easy testing with centralized state
- ✅ **Monitoring**: Performance and usage tracking
- ✅ **Security**: Validation and access control

This implementation represents a significant improvement over the previous complex hook system, providing better performance, maintainability, and developer experience.
