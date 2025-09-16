# 🧪 **TESTING GUIDE**

**Created**: September 15, 2025  
**Updated**: September 15, 2025  
**Scope**: Comprehensive testing strategy for the Choices platform

---

## 📋 **OVERVIEW**

This guide provides comprehensive documentation for the testing infrastructure of the Choices platform. Our testing strategy includes unit tests, integration tests, end-to-end tests, performance tests, and security tests.

### **Testing Philosophy**

- **Quality First**: All code must be tested before deployment
- **Comprehensive Coverage**: Multiple testing layers ensure reliability
- **Automated Testing**: CI/CD pipeline runs all tests automatically
- **Performance Monitoring**: Continuous performance and load testing
- **Security Focus**: Security tests prevent vulnerabilities

---

## 🏗️ **TESTING ARCHITECTURE**

### **Test Types**

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test interactions between modules
3. **End-to-End Tests** - Test complete user workflows
4. **Performance Tests** - Test system performance under load
5. **Security Tests** - Test security vulnerabilities and compliance

### **Test Structure**

```
web/
├── lib/
│   ├── vote/
│   │   ├── engine.test.ts          # Unit tests for voting engine
│   │   └── strategies/             # Strategy-specific tests
│   ├── core/
│   │   └── security/
│   │       └── rate-limit.test.ts  # Security utility tests
│   └── shared/
│       └── webauthn.test.ts        # WebAuthn utility tests
├── tests/
│   ├── baseline-system.test.ts     # Integration tests
│   ├── poll-lifecycle.test.ts      # Integration tests
│   ├── vote-processing.test.ts     # Integration tests
│   └── e2e/
│       ├── webauthn.cdp.spec.ts    # E2E WebAuthn tests
│       ├── poll-creation.spec.ts   # E2E poll creation tests
│       └── voting-flow.spec.ts     # E2E voting flow tests
└── jest.config.js                  # Jest configuration
```

---

## 🔧 **TESTING SETUP**

### **Prerequisites**

- Node.js 22.x
- npm 10.9.3
- Playwright browsers
- Jest testing framework

### **Installation**

```bash
# Install dependencies
npm run ci:install

# Install Playwright browsers
npx playwright install --with-deps
```

### **Configuration Files**

- `jest.config.js` - Main Jest configuration
- `jest.client.config.js` - Client-side test configuration
- `jest.server.config.js` - Server-side test configuration
- `playwright.config.ts` - Main Playwright configuration
- `playwright.staging.config.ts` - Staging environment tests
- `playwright.production.config.ts` - Production environment tests
- `playwright.monitoring.config.ts` - Performance monitoring tests

---

## 🧪 **UNIT TESTS**

### **Purpose**

Unit tests verify that individual functions, classes, and components work correctly in isolation.

### **Coverage Areas**

- **Voting Engine**: All voting strategies and validation logic
- **Security Utilities**: Rate limiting, authentication, and authorization
- **WebAuthn Functions**: Biometric authentication utilities
- **Data Processing**: Vote processing and results calculation
- **Utility Functions**: Helper functions and data transformations

### **Running Unit Tests**

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Run specific test file
npm run test:unit -- engine.test.ts

# Run in watch mode
npm run test:unit -- --watch
```

### **Example Unit Test**

```typescript
describe('VoteEngine', () => {
  let engine: VoteEngine;
  
  beforeEach(() => {
    engine = new VoteEngine();
  });

  it('should validate a valid single-choice vote', async () => {
    const voteRequest: VoteRequest = {
      pollId: 'poll-123',
      userId: 'user-456',
      voteData: { selectedOption: 'option-1' },
      privacyLevel: 'public'
    };

    const validation = await engine.validateVote(voteRequest, mockPoll);
    expect(validation.isValid).toBe(true);
  });
});
```

---

## 🔗 **INTEGRATION TESTS**

### **Purpose**

Integration tests verify that different modules work together correctly and that the system behaves as expected under various conditions.

### **Coverage Areas**

- **Baseline System**: Baseline voting functionality and drift detection
- **Poll Lifecycle**: Poll creation, activation, closing, and locking
- **Vote Processing**: Complete vote processing workflows
- **Database Integration**: Data persistence and retrieval
- **API Integration**: API endpoint functionality

### **Running Integration Tests**

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run specific test file
npm run test:integration -- baseline-system.test.ts
```

### **Example Integration Test**

```typescript
describe('Baseline System Integration', () => {
  it('should calculate baseline results correctly', async () => {
    const baselineVotes = testVotes.filter(vote => 
      vote.timestamp < testPoll.baselineAt!
    );

    const results = await engine.calculateResults(testPoll, baselineVotes);
    
    expect(results.pollId).toBe('baseline-poll-123');
    expect(results.totalVotes).toBe(baselineVotes.length);
  });
});
```

---

## 🎭 **END-TO-END TESTS**

### **Purpose**

E2E tests verify complete user workflows from start to finish, ensuring the entire system works together correctly.

### **Coverage Areas**

- **WebAuthn Authentication**: Passkey registration and authentication
- **Poll Creation**: Complete poll creation workflow
- **Voting Flows**: All voting methods and user interactions
- **Results Display**: Results calculation and presentation
- **Error Handling**: User-facing error scenarios

### **Running E2E Tests**

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- voting-flow.spec.ts

# Run against staging
npm run test:e2e:staging

# Run against production
npm run test:e2e:production
```

### **Example E2E Test**

```typescript
test('should complete single choice voting flow', async ({ page }) => {
  await page.goto(`/polls/${pollId}`);
  await page.waitForSelector('[data-testid="poll-details"]');
  
  await page.click('[data-testid="start-voting-button"]');
  await page.waitForSelector('[data-testid="voting-form"]');
  
  await page.click('[data-testid="option-1-radio"]');
  await page.click('[data-testid="submit-vote-button"]');
  
  await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
});
```

---

## ⚡ **PERFORMANCE TESTS**

### **Purpose**

Performance tests ensure the system can handle expected load and performs well under various conditions.

### **Coverage Areas**

- **Load Testing**: System behavior under high load
- **Stress Testing**: System limits and breaking points
- **Response Time**: API and page load times
- **Memory Usage**: Memory consumption patterns
- **Database Performance**: Query performance and optimization

### **Running Performance Tests**

```bash
# Run performance tests
npm run test:performance

# Run load tests
npm run test:load

# Run with monitoring
npm run test:performance -- --config=playwright.monitoring.config.ts
```

### **Performance Metrics**

- **Response Time**: < 200ms for API calls
- **Page Load Time**: < 2s for initial page load
- **Throughput**: > 1000 requests per minute
- **Memory Usage**: < 512MB per instance
- **Database Queries**: < 100ms average query time

---

## 🔒 **SECURITY TESTS**

### **Purpose**

Security tests verify that the system is secure against common vulnerabilities and follows security best practices.

### **Coverage Areas**

- **Authentication**: User authentication and session management
- **Authorization**: Access control and permissions
- **Input Validation**: SQL injection, XSS prevention
- **Rate Limiting**: DDoS protection and abuse prevention
- **Data Protection**: Encryption and data privacy

### **Running Security Tests**

```bash
# Run security audit
npm run audit:high

# Run security checks
npm run security-check

# Test security headers
npm run test:security-headers

# Check Next.js security
npm run check:next-security
```

### **Security Checklist**

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Proper authentication and authorization
- [ ] Rate limiting on all endpoints
- [ ] Security headers configured
- [ ] Dependencies are up to date
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection enabled

---

## 🚀 **CI/CD PIPELINE**

### **Test Pipeline**

The CI/CD pipeline runs tests automatically on every push and pull request:

1. **Pre-deployment Validation**
   - Type checking
   - Linting
   - Security audit
   - Dependency scanning

2. **Build and Test**
   - Unit tests with coverage
   - Integration tests
   - Build verification

3. **E2E Testing**
   - Cross-browser testing
   - WebAuthn functionality
   - Complete user workflows

4. **Performance Testing**
   - Load testing
   - Performance monitoring
   - Resource usage validation

5. **Security Testing**
   - Vulnerability scanning
   - Security header validation
   - Authentication testing

### **Deployment Pipeline**

1. **Staging Deployment**
   - Deploy to staging environment
   - Run E2E tests against staging
   - Health check validation

2. **Production Deployment**
   - Deploy to production environment
   - Run smoke tests
   - Monitor deployment health

3. **Post-deployment Monitoring**
   - Performance monitoring
   - Error rate checking
   - Database connectivity verification

---

## 📊 **TEST COVERAGE**

### **Coverage Targets**

- **Unit Tests**: 90% line coverage
- **Integration Tests**: 80% branch coverage
- **E2E Tests**: 100% critical user paths
- **Security Tests**: 100% security-critical functions

### **Coverage Reports**

Coverage reports are generated automatically and available in:
- Codecov dashboard
- GitHub Actions artifacts
- Local coverage reports in `coverage/` directory

### **Viewing Coverage**

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## 🐛 **DEBUGGING TESTS**

### **Common Issues**

1. **Test Timeouts**
   - Increase timeout values
   - Check for infinite loops
   - Verify async operations

2. **Flaky Tests**
   - Add proper waits
   - Use deterministic data
   - Avoid race conditions

3. **Environment Issues**
   - Check environment variables
   - Verify database connections
   - Ensure proper test isolation

### **Debug Commands**

```bash
# Debug E2E tests
npm run test:e2e:debug

# Run tests in headed mode
npm run test:e2e:headed

# Run specific test with verbose output
npm run test:unit -- --verbose engine.test.ts

# Run tests with debugging
DEBUG=* npm run test:unit
```

---

## 📝 **BEST PRACTICES**

### **Writing Tests**

1. **Test Structure**
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests focused and simple
   - Use proper setup and teardown

2. **Test Data**
   - Use realistic test data
   - Avoid hardcoded values
   - Create reusable test fixtures
   - Clean up test data

3. **Assertions**
   - Use specific assertions
   - Test both positive and negative cases
   - Verify error conditions
   - Check edge cases

### **Maintaining Tests**

1. **Regular Updates**
   - Update tests when code changes
   - Remove obsolete tests
   - Refactor test code
   - Keep tests fast

2. **Documentation**
   - Document complex test scenarios
   - Explain test purposes
   - Update test documentation
   - Share test knowledge

---

## 🔧 **TROUBLESHOOTING**

### **Common Problems**

1. **Tests Failing in CI but Passing Locally**
   - Check environment differences
   - Verify dependency versions
   - Check for race conditions
   - Review CI configuration

2. **Slow Test Performance**
   - Optimize test data
   - Use test databases
   - Parallelize tests
   - Remove unnecessary waits

3. **Intermittent Test Failures**
   - Add proper synchronization
   - Use deterministic data
   - Check for timing issues
   - Review test isolation

### **Getting Help**

- Check test logs in GitHub Actions
- Review test documentation
- Ask team members for assistance
- Create issues for persistent problems

---

## 📚 **RESOURCES**

### **Documentation**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Documentation](https://testing-library.com/docs/)

### **Tools**

- [Jest](https://jestjs.io/) - JavaScript testing framework
- [Playwright](https://playwright.dev/) - End-to-end testing
- [Codecov](https://codecov.io/) - Code coverage reporting
- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD pipeline

### **Standards**

- [Testing Standards](https://testingjavascript.com/)
- [Security Testing Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/)

---

**Status**: ✅ **COMPREHENSIVE TESTING INFRASTRUCTURE COMPLETE**  
**TypeScript Status**: ✅ **0 ERRORS - PERFECT COMPILATION**  
**Created**: September 15, 2025  
**Updated**: September 15, 2025  
**Next Steps**: Monitor test performance and update as needed
