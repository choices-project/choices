# usePollWizard Hook Migration Guide

## Overview
This guide shows how to migrate from the `usePollWizard` hook to the new `usePollWizardStore` Zustand store.

## Before (usePollWizard Hook)

```typescript
import { usePollWizard } from './usePollWizard';

function PollCreatePage() {
  const {
    wizardState,
    nextStep,
    prevStep,
    goToStep,
    updateData,
    addOption,
    removeOption,
    updateOption,
    addTag,
    removeTag,
    validateCurrentStep,
    setLoading,
    setError,
    clearError
  } = usePollWizard();

  // Access state
  const { currentStep, data, errors, canProceed, canGoBack } = wizardState;

  // Use actions
  const handleNext = () => {
    if (canProceed) {
      nextStep();
    }
  };

  const handleUpdateData = (updates) => {
    updateData(updates);
  };
}
```

## After (usePollWizardStore)

```typescript
import { 
  usePollWizardData,
  usePollWizardStep,
  usePollWizardProgress,
  usePollWizardErrors,
  usePollWizardCanProceed,
  usePollWizardCanGoBack,
  usePollWizardActions,
  usePollWizardStats
} from '@/lib/stores';

function PollCreatePage() {
  // Access state with optimized selectors
  const data = usePollWizardData();
  const currentStep = usePollWizardStep();
  const progress = usePollWizardProgress();
  const errors = usePollWizardErrors();
  const canProceed = usePollWizardCanProceed();
  const canGoBack = usePollWizardCanGoBack();
  const stats = usePollWizardStats();

  // Get actions
  const {
    nextStep,
    prevStep,
    goToStep,
    updateData,
    addOption,
    removeOption,
    updateOption,
    addTag,
    removeTag,
    validateCurrentStep,
    setLoading,
    setError,
    clearError
  } = usePollWizardActions();

  // Use actions (same API)
  const handleNext = () => {
    if (canProceed) {
      nextStep();
    }
  };

  const handleUpdateData = (updates) => {
    updateData(updates);
  };
}
```

## Key Benefits

### 1. **Performance Optimization**
- **Before**: Single hook with large state object causes unnecessary re-renders
- **After**: Granular selectors only re-render when specific data changes

### 2. **Better State Management**
- **Before**: Local state in hook, lost on unmount
- **After**: Persistent state with Zustand, survives component unmounts

### 3. **Improved Developer Experience**
- **Before**: Complex hook with many responsibilities
- **After**: Clean, focused selectors and actions

### 4. **Enhanced Debugging**
- **Before**: Limited debugging capabilities
- **After**: Full Zustand devtools integration

## Migration Steps

### Step 1: Update Imports
```typescript
// Remove
import { usePollWizard } from './usePollWizard';

// Add
import { 
  usePollWizardData,
  usePollWizardStep,
  usePollWizardProgress,
  usePollWizardErrors,
  usePollWizardCanProceed,
  usePollWizardCanGoBack,
  usePollWizardActions,
  usePollWizardStats
} from '@/lib/stores';
```

### Step 2: Replace Hook Usage
```typescript
// Before
const { wizardState, ...actions } = usePollWizard();
const { currentStep, data, errors, canProceed, canGoBack } = wizardState;

// After
const data = usePollWizardData();
const currentStep = usePollWizardStep();
const errors = usePollWizardErrors();
const canProceed = usePollWizardCanProceed();
const canGoBack = usePollWizardCanGoBack();
const actions = usePollWizardActions();
```

### Step 3: Update State Access
```typescript
// Before
const { currentStep, data, errors, canProceed, canGoBack } = wizardState;

// After
const currentStep = usePollWizardStep();
const data = usePollWizardData();
const errors = usePollWizardErrors();
const canProceed = usePollWizardCanProceed();
const canGoBack = usePollWizardCanGoBack();
```

### Step 4: Update Actions
```typescript
// Before
const { nextStep, prevStep, goToStep, updateData, ... } = usePollWizard();

// After
const { nextStep, prevStep, goToStep, updateData, ... } = usePollWizardActions();
```

## Advanced Usage

### Store Utilities
```typescript
import { pollWizardStoreUtils } from '@/lib/stores';

// Get wizard summary
const summary = pollWizardStoreUtils.getWizardSummary();

// Reset wizard
pollWizardStoreUtils.resetWizard();

// Validate all steps
const validation = pollWizardStoreUtils.validateAllSteps();

// Export/Import data
const exportedData = pollWizardStoreUtils.exportWizardData();
pollWizardStoreUtils.importWizardData(importedData);
```

### Store Subscriptions
```typescript
import { pollWizardStoreSubscriptions } from '@/lib/stores';

// Subscribe to step changes
const unsubscribe = pollWizardStoreSubscriptions.onStepChange((step) => {
  console.log('Step changed to:', step);
});

// Subscribe to progress changes
const unsubscribeProgress = pollWizardStoreSubscriptions.onProgressChange((progress) => {
  console.log('Progress:', progress);
});

// Subscribe to data changes
const unsubscribeData = pollWizardStoreSubscriptions.onDataChange((data) => {
  console.log('Data changed:', data);
});
```

### Store Debugging
```typescript
import { pollWizardStoreDebug } from '@/lib/stores';

// Log current state
pollWizardStoreDebug.logState();

// Log wizard data
pollWizardStoreDebug.logWizardData();

// Reset store
pollWizardStoreDebug.reset();
```

## Testing

### Before (Hook Testing)
```typescript
import { renderHook, act } from '@testing-library/react';
import { usePollWizard } from './usePollWizard';

test('usePollWizard', () => {
  const { result } = renderHook(() => usePollWizard());
  
  act(() => {
    result.current.updateData({ title: 'Test Poll' });
  });
  
  expect(result.current.wizardState.data.title).toBe('Test Poll');
});
```

### After (Store Testing)
```typescript
import { renderHook, act } from '@testing-library/react';
import { usePollWizardStore } from '@/lib/stores';

test('usePollWizardStore', () => {
  const { result } = renderHook(() => usePollWizardStore());
  
  act(() => {
    result.current.updateData({ title: 'Test Poll' });
  });
  
  expect(result.current.data.title).toBe('Test Poll');
});
```

## Performance Comparison

### Before (Hook)
- ❌ Single large state object
- ❌ All components re-render on any state change
- ❌ No persistence
- ❌ Limited debugging

### After (Store)
- ✅ Granular selectors
- ✅ Only re-render when specific data changes
- ✅ Persistent state
- ✅ Full devtools integration
- ✅ Better performance
- ✅ Enhanced debugging

## Conclusion

The migration from `usePollWizard` hook to `usePollWizardStore` provides:

1. **Better Performance** - Granular selectors prevent unnecessary re-renders
2. **Enhanced State Management** - Persistent state with Zustand
3. **Improved Developer Experience** - Clean, focused API
4. **Better Debugging** - Full devtools integration
5. **Future-Proof** - Follows modern state management patterns

The API remains largely the same, making migration straightforward while providing significant benefits.
