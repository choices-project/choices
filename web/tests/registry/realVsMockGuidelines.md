# Real vs Mock Testing Guidelines

**Created:** January 27, 2025  
**Status:** ✅ **PRODUCTION READY**  
**Version:** 1.0

---

## 🎯 **Overview**

This document provides clear guidelines for when to use real components vs mocks in testing, based on the "test real components to catch real issues" philosophy.

---

## 🚀 **Core Philosophy**

### **Test Real Components to Catch Real Issues**
- **Real Testing**: Test actual components, business logic, and user interactions
- **Real Behavior**: Test how the system actually works, not mock implementations
- **Real Confidence**: Tests must catch real bugs and provide genuine confidence
- **Real Value**: Tests must improve code quality and catch regressions
- **No Fake Tests**: Never test mock components or hardcoded HTML - test real code

---

## 📋 **Decision Matrix**

### **✅ USE REAL COMPONENTS WHEN:**

#### **1. Testing User Interactions**
```typescript
// ✅ Good - Test real user interactions
it('should handle real user clicks', async () => {
  render(<RealComponent />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(button).toHaveBeenClicked();
});

// ❌ Bad - Test mock interactions
it('should handle mock clicks', () => {
  const mockButton = { click: jest.fn() };
  mockButton.click();
  expect(mockButton.click).toHaveBeenCalled();
});
```

#### **2. Testing Business Logic**
```typescript
// ✅ Good - Test real business logic
it('should calculate real vote results', () => {
  const votes = [{ option: 'A', count: 5 }, { option: 'B', count: 3 }];
  const result = calculateVoteResults(votes);
  expect(result.winner).toBe('A');
});

// ❌ Bad - Test mock business logic
it('should return mock results', () => {
  const mockCalculator = { calculate: jest.fn().mockReturnValue({ winner: 'A' }) };
  const result = mockCalculator.calculate();
  expect(result.winner).toBe('A');
});
```

#### **3. Testing State Management**
```typescript
// ✅ Good - Test real state management
it('should update real Zustand store', () => {
  const { result } = renderHook(() => useMyStore());
  act(() => {
    result.current.setValue('new value');
  });
  expect(result.current.value).toBe('new value');
});

// ❌ Bad - Test mock state management
it('should call mock setter', () => {
  const mockSetter = jest.fn();
  mockSetter('new value');
  expect(mockSetter).toHaveBeenCalledWith('new value');
});
```

#### **4. Testing Component Integration**
```typescript
// ✅ Good - Test real component integration
it('should integrate with real stores', () => {
  render(<ComponentWithRealStore />);
  expect(screen.getByText('Real Data')).toBeInTheDocument();
});

// ❌ Bad - Test mock integration
it('should work with mock data', () => {
  const mockData = { text: 'Mock Data' };
  expect(mockData.text).toBe('Mock Data');
});
```

#### **5. Testing Error Handling**
```typescript
// ✅ Good - Test real error handling
it('should handle real API errors', async () => {
  const mockApi = jest.fn().mockRejectedValue(new Error('API Error'));
  render(<ComponentWithRealErrorHandling api={mockApi} />);
  await waitFor(() => {
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});

// ❌ Bad - Test mock error handling
it('should handle mock errors', () => {
  const mockError = new Error('Mock Error');
  expect(mockError.message).toBe('Mock Error');
});
```

#### **6. Testing Performance**
```typescript
// ✅ Good - Test real performance
it('should render within acceptable time', async () => {
  const startTime = performance.now();
  render(<RealComponent />);
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(2000);
});

// ❌ Bad - Test mock performance
it('should have mock performance', () => {
  const mockPerformance = { renderTime: 1000 };
  expect(mockPerformance.renderTime).toBeLessThan(2000);
});
```

### **⚠️ USE MOCKS WHEN:**

#### **1. External Dependencies**
```typescript
// ✅ Good - Mock external APIs
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    })
  }))
}));

// ❌ Bad - Don't mock internal business logic
jest.mock('@/lib/vote/engine', () => ({
  calculateVotes: jest.fn().mockReturnValue({ winner: 'A' })
}));
```

#### **2. Browser APIs**
```typescript
// ✅ Good - Mock browser APIs
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
});

// ❌ Bad - Don't mock React components
jest.mock('@/components/MyComponent', () => ({
  MyComponent: () => <div>Mock Component</div>
}));
```

#### **3. Network Requests**
```typescript
// ✅ Good - Mock network requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' })
  })
);

// ❌ Bad - Don't mock internal state management
jest.mock('@/lib/stores/myStore', () => ({
  useMyStore: () => ({ value: 'mock value' })
}));
```

#### **4. Third-party Libraries**
```typescript
// ✅ Good - Mock third-party libraries
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}));

// ❌ Bad - Don't mock internal utilities
jest.mock('@/lib/utils/validation', () => ({
  validateEmail: jest.fn().mockReturnValue(true)
}));
```

---

## 🎯 **Testing Patterns**

### **Real Component Testing Pattern**
```typescript
describe('Real Component Testing', () => {
  it('should test real functionality', async () => {
    // 1. Render real component
    render(<RealComponent />);
    
    // 2. Test real user interactions
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // 3. Test real business logic
    await waitFor(() => {
      expect(screen.getByText('Real Result')).toBeInTheDocument();
    });
    
    // 4. Test real state management
    expect(mockStore.setValue).toHaveBeenCalledWith('real value');
  });
});
```

### **Mock Testing Pattern**
```typescript
describe('Mock Testing', () => {
  it('should test with mocked dependencies', async () => {
    // 1. Mock external dependencies
    jest.mock('@/utils/api', () => ({
      fetchData: jest.fn().mockResolvedValue({ data: 'test' })
    }));
    
    // 2. Test real component with mocked dependencies
    render(<ComponentWithMockedAPI />);
    
    // 3. Test real interactions
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // 4. Verify real behavior with mocked data
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
```

---

## 📊 **Decision Flowchart**

```
Start Testing
     ↓
Is it a React component? → Yes → Test Real Component
     ↓ No
Is it business logic? → Yes → Test Real Logic
     ↓ No
Is it a utility function? → Yes → Test Real Function
     ↓ No
Is it an external dependency? → Yes → Mock It
     ↓ No
Is it a browser API? → Yes → Mock It
     ↓ No
Is it a third-party library? → Yes → Mock It
     ↓ No
Test Real Implementation
```

---

## 🚨 **Anti-Patterns to Avoid**

### **❌ Don't Mock Internal Components**
```typescript
// ❌ Bad - Mocking internal components
jest.mock('@/components/MyComponent', () => ({
  MyComponent: () => <div>Mock</div>
}));

// ✅ Good - Test real internal components
render(<MyComponent />);
```

### **❌ Don't Mock Business Logic**
```typescript
// ❌ Bad - Mocking business logic
jest.mock('@/lib/vote/engine', () => ({
  calculateVotes: jest.fn().mockReturnValue({ winner: 'A' })
}));

// ✅ Good - Test real business logic
const result = calculateVotes(realVotes);
expect(result.winner).toBe('A');
```

### **❌ Don't Mock State Management**
```typescript
// ❌ Bad - Mocking state management
jest.mock('@/lib/stores/myStore', () => ({
  useMyStore: () => ({ value: 'mock' })
}));

// ✅ Good - Test real state management
const { result } = renderHook(() => useMyStore());
act(() => {
  result.current.setValue('real value');
});
expect(result.current.value).toBe('real value');
```

### **❌ Don't Mock User Interactions**
```typescript
// ❌ Bad - Mocking user interactions
const mockClick = jest.fn();
mockClick();

// ✅ Good - Test real user interactions
const button = screen.getByRole('button');
fireEvent.click(button);
```

---

## 🎯 **Best Practices**

### **1. Test Real Components**
- Always test actual React components
- Test real user interactions
- Test real business logic
- Test real state management

### **2. Mock External Dependencies**
- Mock external APIs
- Mock browser APIs
- Mock third-party libraries
- Mock network requests

### **3. Test Real Behavior**
- Test how the system actually works
- Test real user journeys
- Test real error scenarios
- Test real performance

### **4. Avoid Fake Tests**
- Don't test mock components
- Don't test hardcoded HTML
- Don't test fake data
- Don't test fake interactions

---

## 📈 **Success Metrics**

### **Real Testing Success**
- ✅ 100% of tests test actual components and business logic
- ✅ Tests catch real bugs and prevent regressions
- ✅ Tests improve code quality and user experience
- ✅ Zero tests of mock components or hardcoded HTML

### **Mock Testing Success**
- ✅ External dependencies properly mocked
- ✅ Browser APIs properly mocked
- ✅ Third-party libraries properly mocked
- ✅ Network requests properly mocked

---

## 🎉 **Conclusion**

The key to effective testing is to **test real components to catch real issues** while **mocking external dependencies** that are outside your control. This approach provides genuine confidence in your codebase and catches real problems that fake tests miss.

**Remember: Real testing reveals real problems - and that's exactly what we need to make this codebase production-ready! 🚀**

---

**Documentation Generated:** January 27, 2025  
**Status:** ✅ **PRODUCTION READY**  
**Version:** 1.0
