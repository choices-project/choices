# E2E Testing Guide
*Last Updated: 2025-09-09*

## Supabase-Friendly Testing Philosophy

Our E2E tests are designed to be **respectful of Supabase limits** and focus on testing how the system SHOULD work without overwhelming the database or authentication service.

## Test Categories

### 1. **Supabase-Safe Tests** (`supabase-safe.test.ts`)
- **Purpose**: Conservative tests that won't cause issues with Supabase
- **Approach**: Test UI functionality and basic flows without heavy API usage
- **Features**:
  - Page loading and navigation
  - Form interaction (without submission)
  - Responsive design
  - Basic accessibility
  - Error page handling

### 2. **Current System Tests** (`current-system-e2e.test.ts`)
- **Purpose**: Test current system functionality to identify gaps
- **Approach**: Modified to avoid overwhelming Supabase
- **Features**:
  - Homepage content verification
  - Form validation (without submission)
  - Protected route access
  - Performance testing

### 3. **Auth Flow Tests** (`auth-flow.test.ts`)
- **Purpose**: Comprehensive authentication testing
- **Approach**: Tests auth flows without creating excessive test users
- **Features**:
  - Registration flow testing
  - Login flow testing
  - Session management
  - Form validation

### 4. **User Journey Tests** (`user-journey.test.ts`)
- **Purpose**: Complete user workflow testing
- **Approach**: End-to-end journey testing with minimal Supabase impact
- **Features**:
  - New user onboarding
  - Returning user flows
  - Poll creation and voting
  - Profile management

## Supabase Considerations

### **Rate Limiting**
- Tests avoid rapid-fire API calls
- No bulk user creation
- Minimal authentication attempts

### **Database Impact**
- Tests don't create excessive test data
- No database cleanup required
- Focus on UI and flow testing

### **Authentication Limits**
- Limited login attempts
- No password reset testing
- Conservative session testing

## Running Tests

### **Safe Testing (Recommended)**
```bash
# Run only Supabase-safe tests
npm run test:e2e -- --grep "Supabase-Safe"

# Run current system tests (modified to be safe)
npm run test:e2e -- --grep "Current System"
```

### **Full Testing (Use Sparingly)**
```bash
# Run all tests (use carefully)
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui
```

### **Specific Test Suites**
```bash
# Auth flow tests only
npm run test:e2e -- --grep "Auth Flow"

# User journey tests only
npm run test:e2e -- --grep "User Journey"
```

## Test Philosophy

### **Test for Intended Functionality**
- Write tests that describe how the system SHOULD work
- Use test failures to identify what needs to be built or fixed
- Focus on critical user journeys and business logic

### **Respect External Services**
- Be conservative with Supabase usage
- Test UI and flows without overwhelming APIs
- Use mocks or stubs when appropriate

### **Identify Gaps**
- Tests should reveal missing functionality
- Failures indicate areas needing development
- Success indicates working features

## Best Practices

### **Before Running Tests**
1. Ensure development server is running
2. Check Supabase connection is stable
3. Verify environment variables are set
4. Clear any existing test data

### **During Testing**
1. Monitor Supabase dashboard for unusual activity
2. Stop tests if rate limits are hit
3. Use conservative timeouts
4. Focus on UI testing over API testing

### **After Testing**
1. Review test results for gaps
2. Document any Supabase issues
3. Update tests based on findings
4. Clean up any test data if needed

## Troubleshooting

### **Common Issues**
- **Rate Limiting**: Reduce test frequency or use mocks
- **Authentication Errors**: Check Supabase configuration
- **Timeout Issues**: Increase timeouts or simplify tests
- **Database Issues**: Use test database or mocks

### **Supabase Dashboard Monitoring**
- Watch for unusual API usage
- Monitor authentication attempts
- Check database query performance
- Review error logs

## Future Improvements

### **Test Data Management**
- Implement test user cleanup
- Use dedicated test database
- Create test data factories

### **Mock Integration**
- Mock Supabase responses for heavy testing
- Use test doubles for external services
- Implement offline testing capabilities

### **Performance Testing**
- Add performance benchmarks
- Test with realistic data volumes
- Monitor Supabase performance impact

---

**Remember**: The goal is to test how the system SHOULD work while being respectful of Supabase resources and limits.


