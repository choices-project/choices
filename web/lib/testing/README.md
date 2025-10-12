# Testing Infrastructure - T Registry

**Created:** January 27, 2025  
**Status:** ✅ **PRODUCTION READY**  
**Version:** 2.0

---

## 🎯 **Overview**

The T Registry is a centralized test ID management system that provides type-safe, maintainable test targeting across the entire Choices codebase.

---

## 🚀 **Quick Start**

### **Import the Registry**
```typescript
import { T } from '@/lib/testing/testIds';
```

### **Use in Components**
```typescript
// ✅ Good - Using T registry
<button data-testid={T.submitButton}>Submit</button>
<form data-testid={T.login.form}>...</form>
<input data-testid={T.login.email} />

// ❌ Bad - Hardcoded test IDs
<button data-testid="submit-button">Submit</button>
<form data-testid="auth-form">...</form>
```

### **Use in Tests**
```typescript
// ✅ Good - Using T registry
await page.locator(`[data-testid="${T.login.toggle}"]`).click();
await expect(page.locator(`[data-testid="${T.login.error}"]`)).toBeVisible();

// ❌ Bad - Hardcoded test IDs
await page.locator('[data-testid="auth-toggle"]').click();
await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
```

---

## 📋 **Registry Structure**

### **Authentication**
```typescript
T.login = {
  email: 'login-email',
  password: 'login-password',
  submit: 'login-submit',
  form: 'auth-form',
  toggle: 'auth-toggle',
  error: 'auth-error',
  success: 'success-message',
}
```

### **Poll Creation**
```typescript
T.pollCreate = {
  title: 'poll-create-title',
  description: 'poll-create-description',
  category: 'poll-create-category',
  votingMethod: 'poll-create-voting-method',
  optionInput: (index: number) => `poll-create-option-input-${index}`,
  addOption: 'poll-create-add-option',
  submit: 'poll-create-submit',
  reset: 'poll-create-reset',
}
```

### **WebAuthn**
```typescript
T.webauthn = {
  register: 'webauthn-register',
  login: 'webauthn-login',
  prompt: 'webauthn-prompt',
  features: 'webauthn-features',
  biometricButton: 'webauthn-biometric-button',
  crossDeviceButton: 'webauthn-cross-device-button',
}
```

### **Admin Dashboard**
```typescript
T.admin = {
  accessDenied: 'admin-access-denied',
  usersTab: 'admin-users-tab',
  pollsTab: 'admin-polls-tab',
  userList: 'admin-user-list',
  pollList: 'admin-poll-list',
  promoteUser: (userId: string) => `admin-promote-user-${userId}`,
  banUser: (userId: string) => `admin-ban-user-${userId}`,
}
```

### **Generic Elements**
```typescript
T = {
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',
  loadingSpinner: 'loading-spinner',
  // ... more generic elements
}
```

---

## 🔧 **Advanced Usage**

### **Dynamic Test IDs**
```typescript
// For dynamic test IDs with parameters
T.pollCreate.optionInput(0) // 'poll-create-option-input-0'
T.pollCreate.optionInput(1) // 'poll-create-option-input-1'
T.admin.promoteUser('user-123') // 'admin-promote-user-user-123'
```

### **Type Safety**
```typescript
// TypeScript provides autocomplete and validation
const testId: TestId = T.login.email; // ✅ Valid
const testId: TestId = 'hardcoded-id'; // ❌ Type error
```

### **Refactoring**
```typescript
// Change test ID in one place
export const T = {
  login: {
    email: 'user-email', // Changed from 'login-email'
    // ... rest unchanged
  }
}

// All components and tests automatically use the new ID
```

---

## 📚 **Best Practices**

### **Component Development**
1. **Always Import T:** `import { T } from '@/lib/testing/testIds';`
2. **Use Descriptive IDs:** Choose meaningful test ID names
3. **Group Related IDs:** Use nested objects for related test IDs
4. **Avoid Hardcoding:** Never hardcode test IDs in components

### **Test Development**
1. **Use T Registry:** Always use `T.*` for test targeting
2. **Consistent Targeting:** Use the same test IDs in components and tests
3. **Type Safety:** Leverage TypeScript for test ID validation
4. **Easy Maintenance:** Changes to test IDs only need to be made in one place

### **Registry Maintenance**
1. **Add New IDs:** Add new test IDs to the appropriate section
2. **Use Consistent Naming:** Follow the established naming patterns
3. **Group Related IDs:** Use nested objects for logical grouping
4. **Document Changes:** Update documentation when adding new sections

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Import Errors**
```typescript
// ❌ Wrong import path
import { T } from '@/lib/testing/testIds';

// ✅ Correct import path
import { T } from '@/lib/testing/testIds';
```

#### **Type Errors**
```typescript
// ❌ Using hardcoded IDs
await page.locator('[data-testid="hardcoded-id"]').click();

// ✅ Using T registry
await page.locator(`[data-testid="${T.login.toggle}"]`).click();
```

#### **Missing Test IDs**
```typescript
// If a test ID doesn't exist, add it to the registry
export const T = {
  // ... existing IDs
  newFeature: {
    button: 'new-feature-button',
    input: 'new-feature-input',
  }
}
```

---

## 🎉 **Benefits**

### **Type Safety**
- TypeScript autocomplete and validation
- Compile-time error detection
- Refactoring safety

### **Maintainability**
- Centralized test ID management
- Easy refactoring and updates
- Consistent naming patterns

### **Developer Experience**
- IntelliSense support
- Clear documentation
- Reduced errors

### **Testing Reliability**
- Consistent test targeting
- Reduced test flakiness
- Easy test maintenance

---

**Documentation Generated:** January 27, 2025  
**Status:** ✅ **PRODUCTION READY**  
**Version:** 2.0
