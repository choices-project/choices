# E2E Registration Form Debugging Request

## Current Issue

The E2E authentication and onboarding flow test is failing at the registration step. The form submission is not working correctly - instead of calling the `handleSubmit` function and redirecting to `/onboarding?step=welcome`, the form is being submitted as a GET request with query parameters.

## Test Failure Details

**Expected**: Redirect to `/onboarding?step=welcome` after successful registration
**Actual**: URL shows `register?username=testuser&email=test%40test.com&password=password123&confirmPassword=password123`

**Test Output**:
```
Password values: { password: 'password123', confirmPassword: 'password123' }
Registration error: Password must be at least 8 characters long
```

## Key Observations

1. **Form fields are correctly filled**: The E2E test successfully fills all form fields with valid data
2. **Password validation is failing**: Despite `password123` being 11 characters long, the validation claims it's less than 8 characters
3. **Form submission is not working**: The `handleSubmit` function is not being called (no debug logs appear)
4. **URL shows query parameters**: This indicates the form is being submitted as a GET request instead of being handled by the React form handler

## Files Involved

### Registration Form
- **File**: `/web/features/auth/pages/register/page.tsx`
- **Issue**: Form submission not triggering `handleSubmit` function
- **Form setup**: 
  ```tsx
  <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6" data-testid="register-form">
  ```
- **Submit button**:
  ```tsx
  <button type="submit" data-testid="register-button">
  ```

### E2E Test
- **File**: `/web/tests/e2e/authentication-flow.spec.ts`
- **Test flow**: Fills form fields → clicks submit button → expects redirect to onboarding
- **Form filling**: Uses `page.fill()` and `page.click()` methods

### Server Action
- **File**: `/web/app/actions/register.ts`
- **Status**: Has E2E mocking logic for `NEXT_PUBLIC_SUPABASE_URL === 'https://test.supabase.co'`
- **Mock behavior**: Returns `{ ok: true }` immediately for E2E tests

## Debugging Steps Needed

1. **Check for JavaScript errors**: The form submission might be failing due to a JavaScript error
2. **Verify event handler binding**: Ensure the `onSubmit={handleSubmit}` is properly bound
3. **Check form validation**: The password length validation is failing despite correct input
4. **Investigate form submission mechanism**: Why is the form submitting as GET instead of being handled by React

## Potential Root Causes

1. **JavaScript Error**: An uncaught error might be preventing the form submission
2. **Event Handler Issue**: The `onSubmit` handler might not be properly bound
3. **Form Validation Bug**: The password length validation logic might have a bug
4. **E2E Test Environment**: There might be an issue with how Playwright interacts with the form
5. **React State Issue**: The `formData` state might not be properly updated

## Request for AI Assistance

Please help debug this registration form submission issue. The main problems to investigate are:

1. Why is the form submitting as a GET request instead of calling `handleSubmit`?
2. Why is the password length validation failing despite correct input?
3. How can we ensure the form submission works correctly in the E2E test environment?

## Test Environment

- **Framework**: Next.js with React
- **Testing**: Playwright E2E tests
- **Environment**: Mock Supabase (`NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co`)
- **Browser**: Chromium

## Expected Behavior

1. User fills registration form
2. Clicks submit button
3. `handleSubmit` function is called
4. Form validation passes
5. Server action is called (mocked for E2E)
6. User is redirected to `/onboarding?step=welcome`

## Current Behavior

1. User fills registration form ✅
2. Clicks submit button ✅
3. Form submits as GET request with query parameters ❌
4. No redirect occurs ❌
5. Test fails ❌

Please help identify and fix the root cause of this form submission issue.
