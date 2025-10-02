# Comprehensive Testing Suite

## Overview

This directory contains a comprehensive testing suite for the Choices application, covering unit tests, integration tests, and end-to-end tests. The testing philosophy is to guide how the system should work, not just conform to current state.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── lib/                 # Library function tests
│   ├── vote/                # Voting system tests
│   ├── irv/                 # IRV calculation tests
│   ├── location-resolver.test.ts    # Location resolution tests
│   ├── location-database.test.ts   # Database integration tests
│   └── privacy-features.test.ts    # Privacy feature tests
├── e2e/                     # End-to-end tests
│   ├── browser-location-capture.spec.ts  # Location capture E2E
│   ├── civics-address-lookup.spec.ts     # Address lookup E2E
│   └── helpers/             # E2E test helpers
├── components/              # Component tests
│   └── LocationSetupStep.test.tsx  # Location setup component tests
├── helpers/                 # Test utilities and mocks
│   ├── supabase-mock.ts     # Supabase mock factory
│   ├── supabase-when.ts     # When DSL for test arrangements
│   └── arrange-helpers.ts    # Domain-specific helpers
└── fixtures/                # Test data fixtures
```

## Test Categories

### 1. Unit Tests (`tests/unit/`)

**Location Resolver Tests** (`location-resolver.test.ts`)
- Input validation and error handling
- Privacy and security enforcement
- Performance and reliability testing
- Jurisdiction validation
- Data quality and accuracy
- Network error handling

**Database Integration Tests** (`location-database.test.ts`)
- User location resolutions table operations
- Jurisdiction aliases table management
- Jurisdiction tiles table for geospatial queries
- Location resolution workflow testing
- Privacy and data retention compliance
- Performance and scalability testing

**Privacy Features Tests** (`privacy-features.test.ts`)
- Coordinate quantization for k-anonymity
- HMAC hashing for address privacy
- Deterministic jitter for location privacy
- Cookie privacy and security
- Consent tracking and withdrawal
- Data minimization and anonymization
- K-anonymity enforcement
- Audit trail and compliance

**Voting System Tests**
- IRV calculator tests with golden cases
- Vote validation and processing
- Vote engine functionality
- Vote processor operations

### 2. Component Tests (`tests/components/`)

**LocationSetupStep Tests** (`LocationSetupStep.test.tsx`)
- Feature flag handling
- Location capture flow
- Skip functionality
- Navigation and error handling
- Privacy and UX requirements
- Data persistence validation

### 3. End-to-End Tests (`tests/e2e/`)

**Browser Location Capture E2E** (`browser-location-capture.spec.ts`)
- Geolocation API integration
- Address input fallback
- Privacy and consent flows
- Feature flag integration
- Mobile experience testing
- Data persistence
- Error recovery

**Civics Address Lookup E2E** (`civics-address-lookup.spec.ts`)
- Address lookup functionality
- Authentication and authorization
- Error handling and validation
- Performance and user experience

## Test Philosophy

### Tests Guide Implementation

Our tests are designed to guide how the system should work, not just conform to the current state:

- **Privacy-First**: Tests enforce coordinate quantization, HMAC hashing, and k-anonymity
- **User Experience**: Tests ensure graceful error handling and clear privacy notices
- **Data Integrity**: Tests validate proper data persistence and consent tracking
- **Performance**: Tests ensure efficient database operations and network handling
- **Security**: Tests enforce secure data handling and audit trails

### Test Quality Standards

- **Comprehensive Coverage**: All major functionality paths tested
- **Edge Case Handling**: Tests cover error conditions and edge cases
- **Privacy Enforcement**: Tests ensure privacy requirements are met
- **Performance Validation**: Tests verify acceptable performance characteristics
- **User Experience**: Tests ensure smooth user interactions

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Specific Test Suites
```bash
# Location resolver tests
npm test -- --testPathPatterns="location-resolver.test.ts"

# Database integration tests
npm test -- --testPathPatterns="location-database.test.ts"

# Privacy feature tests
npm test -- --testPathPatterns="privacy-features.test.ts"

# Browser location capture E2E
npm run test:e2e -- --grep="browser-location-capture"
```

## Test Infrastructure

### Mock Factory System

The test suite uses a comprehensive mock factory system for Supabase operations:

```typescript
import { getMS } from '../setup';

const { client, handles, getMetrics } = getMS();

// 1-line arrangement
arrangeFindById(handles, 'polls', 'poll-123', { id: 'poll-123', title: 'Test' });

// Execute code under test
const result = await client.from('polls').select('*').eq('id', 'poll-123').single();

// Assert
expect(result.data?.id).toBe('poll-123');
```

### E2E Test Helpers

E2E tests use comprehensive setup and cleanup helpers:

```typescript
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  E2E_CONFIG
} from './helpers/e2e-setup';
```

## Key Test Areas

### 1. Browser Location Capture

**Unit Tests:**
- Location resolver input validation
- Privacy feature enforcement
- Database integration
- Error handling

**Component Tests:**
- LocationSetupStep component behavior
- Feature flag integration
- User interaction flows

**E2E Tests:**
- Complete user journey
- Geolocation API integration
- Fallback mechanisms
- Mobile experience

### 2. Privacy and Security

**Privacy Features:**
- Coordinate quantization (k-anonymity)
- HMAC hashing for addresses
- Deterministic jitter
- Consent tracking
- Data minimization

**Security Testing:**
- Input validation
- Error handling
- Rate limiting
- Audit trails

### 3. Database Operations

**Integration Testing:**
- User location resolutions
- Jurisdiction aliases
- Jurisdiction tiles
- Privacy-preserving queries
- Data retention and deletion

### 4. User Experience

**E2E Testing:**
- Complete user journeys
- Error recovery
- Mobile compatibility
- Performance validation
- Accessibility

## Test Data Management

### Unit Test Data
- Mock factories for consistent test data
- Isolated test environments
- Automatic cleanup between tests

### E2E Test Data
- Realistic test user creation
- Poll and vote data setup
- External API mocking
- Database seeding

## Continuous Integration

All tests are integrated into the CI/CD pipeline:

- **Unit Tests**: Run on every commit
- **Integration Tests**: Run on pull requests
- **E2E Tests**: Run on deployment
- **Performance Tests**: Run on release

## Test Coverage

The test suite provides comprehensive coverage for:

- **Functionality**: All major features tested
- **Edge Cases**: Error conditions and boundary cases
- **Privacy**: Privacy requirements enforced
- **Performance**: Performance characteristics validated
- **Security**: Security measures tested
- **User Experience**: User interaction flows tested

## Maintenance

### Adding New Tests

1. **Unit Tests**: Add to appropriate `tests/unit/` directory
2. **Component Tests**: Add to `tests/components/` directory
3. **E2E Tests**: Add to `tests/e2e/` directory
4. **Update Documentation**: Update this README with new test areas

### Test Maintenance

- **Regular Updates**: Keep tests current with code changes
- **Performance Monitoring**: Monitor test execution times
- **Coverage Analysis**: Ensure comprehensive coverage
- **Documentation Updates**: Keep test documentation current

## Troubleshooting

### Common Issues

1. **Mock Isolation**: Ensure proper mock cleanup between tests
2. **Async Operations**: Handle async operations properly in tests
3. **Test Data**: Use consistent test data across test suites
4. **E2E Timing**: Account for timing issues in E2E tests

### Debugging

- **Unit Tests**: Use `--verbose` flag for detailed output
- **E2E Tests**: Use `--headed` flag for visual debugging
- **Integration Tests**: Check mock factory setup
- **Performance Tests**: Monitor execution times

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Assertions**: Use descriptive assertion messages
3. **Mock Management**: Properly manage mocks and cleanup
4. **Data Consistency**: Use consistent test data patterns
5. **Documentation**: Keep test documentation current
6. **Performance**: Monitor test execution performance
7. **Coverage**: Ensure comprehensive test coverage

---

**Last Updated**: January 2, 2025
**Test Suite Version**: 2.0
**Coverage**: Comprehensive (Unit, Integration, E2E)
