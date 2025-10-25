# Testing Architecture

**Last Updated**: January 27, 2025  
**Status**: Fully Operational with Expanded E2E Coverage  
**Focus**: Comprehensive Database Usage Analysis & Automated Journey Tracking

## E2E Testing Infrastructure

### Automated Journey Tracking System

**Status**: ✅ FULLY OPERATIONAL  
**Purpose**: Automated file tracking and database monitoring for comprehensive E2E journey expansion

#### Key Features
- **File Tracking**: 8 tracked files (E2E tests + utilities)
- **Database Monitoring**: 20+ tables, 27+ queries tracked
- **CI Compliance**: Automated TypeScript + ESLint cleanup
- **Real-time Status**: Live monitoring of file and database usage

#### Available Commands
```bash
npm run journey:status         # Show detailed status with database info
npm run journey:cleanup        # Run strict cleanup on tracked files
npm run journey:test           # Run journey tests with database tracking
npm run journey:auto           # Full automated workflow (test + cleanup)
```

#### Expanded E2E Coverage
- **User Journey**: 9.5 phases with comprehensive testing
- **Admin Journey**: 6 phases with enhanced admin features
- **Database Analysis**: Real-time tracking of table usage
- **CI Compliance**: Automated cleanup ensures zero technical debt

### Database Tracking System
```typescript
export class DatabaseTracker {
  private static usedTables = new Set<string>();
  private static verifiedTables = new Set<string>();
  private static queryLog: QueryLogEntry[] = [];
  private static dataVerification: DataVerificationEntry[] = [];
  private static supabaseClient: any = null;

  static reset() { /* ... */ }
  static initializeSupabase(url: string, key: string) { /* ... */ }
  static trackQuery(tableName: string, operation = 'unknown', context = '', data?: any, stackTrace?: string) { /* ... */ }
  static async verifyDataStored(tableName: string, operation: string, context: string, expectedData?: any): Promise<boolean> { /* ... */ }
  static generateReport(): TableUsageReport { /* ... */ }
  static async saveReport(filename: string): Promise<void> { /* ... */ }
}
```

### Test Integration Pattern
```typescript
test.beforeEach(async ({ page }) => {
  // Initialize enhanced database tracking
  DatabaseTracker.reset();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
  DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
  
  // Track database usage
  DatabaseTracker.trackQuery('dashboard', 'select', 'test_context');
});
```

## Test Organization

### Test Structure
```
/tests/
├── playwright/
│   ├── e2e/core/              # Core functionality tests
│   │   ├── quick-pages-test.spec.ts
│   │   └── simple-database-analysis.spec.ts
│   ├── e2e/features/          # Feature-specific tests
│   │   ├── internationalization.spec.ts
│   │   └── enabled-feature-flags-comprehensive.spec.ts
│   └── e2e/accessibility/     # Accessibility tests
├── utils/
│   └── database-tracker.ts   # Database usage tracking
└── registry/
    └── testIds.ts            # Centralized test selectors
```

### Test Categories

#### Core Functionality Tests
- **Page Load Performance**: Measure load times across routes
- **Database Usage**: Track which tables are accessed
- **User Journeys**: Complete workflow testing
- **Cross-Browser**: Chromium, Firefox, WebKit compatibility

#### Feature-Specific Tests
- **Internationalization**: Language switching and persistence
- **Feature Flags**: Enabled feature functionality
- **Contact System**: Representative messaging
- **Social Sharing**: Cross-platform sharing

#### Accessibility Tests
- **WCAG Compliance**: Screen reader compatibility
- **Keyboard Navigation**: Tab order and focus management
- **Color Contrast**: Visual accessibility standards
- **Semantic Structure**: Proper HTML semantics

## Database Usage Analysis

### Table Tracking
- **Total Tables**: 120+ discovered through E2E testing
- **Actively Used**: ~60 tables identified through usage tracking
- **Unused Tables**: ~60 tables candidates for removal
- **Usage Patterns**: Real-time query monitoring

### Query Monitoring
```typescript
// Real-time database query tracking
DatabaseTracker.trackQuery('table_name', 'operation', 'context', data, stackTrace);

// Generate usage reports
const report = DatabaseTracker.generateReport();
await DatabaseTracker.saveReport('database-usage-report.json');
```

### Report Generation
- **Usage Reports**: Automated table usage analysis
- **Performance Metrics**: Query performance tracking
- **Optimization Recommendations**: Data-driven consolidation
- **Cross-Browser Analysis**: Usage patterns across browsers

## Performance Testing

### Load Time Monitoring
```typescript
test('should load page within performance target', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 second target
});
```

### Performance Issues Identified
- **Home Page**: 8-24 seconds (target: <3s)
- **Auth Page**: 8-24 seconds (target: <3s)
- **Login Page**: 8-24 seconds (target: <3s)
- **Register Page**: 8-24 seconds (target: <3s)

### Performance Optimization
- **Database Query Optimization**: Single-query functions
- **Caching Strategy**: Redis implementation
- **Bundle Splitting**: Code splitting by route
- **Lazy Loading**: Component-level optimization

## Cross-Browser Testing

### Supported Browsers
- **Chromium**: Primary testing browser
- **Firefox**: Cross-browser compatibility
- **WebKit**: Safari compatibility
- **Mobile Chrome**: Mobile responsiveness

### Browser-Specific Issues
- **Mobile Chrome**: Language selector visibility issues
- **Cross-Browser**: Database tracking consistency
- **Performance**: Load time variations across browsers

## Test Infrastructure

### Test ID Management
```typescript
// Centralized test ID registry
export const T = {
  dashboard: {
    page: 'dashboard-page',
    content: 'dashboard-content',
    settings: 'dashboard-settings'
  },
  i18n: {
    languageSelector: 'language-selector',
    languageDropdown: 'language-dropdown'
  }
};
```

### Test Configuration
```typescript
// Playwright configuration
export default defineConfig({
  testDir: './tests/playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
```

## Quality Assurance

### Test Coverage
- **E2E Tests**: 46 active test files
- **Database Tracking**: 100% coverage for tracked features
- **Cross-Browser**: Chromium, Firefox, WebKit
- **Performance**: Load time monitoring for all routes

### Test Execution
```bash
# Run all E2E tests
npm run test:playwright

# Run specific test categories
npm run test:playwright -- --grep "performance"
npm run test:playwright -- --grep "internationalization"

# Run with database tracking
npm run test:playwright -- --config=tests/playwright/configs/playwright.config.inline.ts
```

### Continuous Integration
- **Automated Testing**: E2E tests on every commit
- **Performance Monitoring**: Load time tracking
- **Database Monitoring**: Query performance tracking
- **Error Tracking**: Comprehensive error logging

## Database Consolidation

### Usage Analysis
- **Table Discovery**: 120+ tables identified
- **Usage Tracking**: Real-time query monitoring
- **Consolidation Planning**: Data-driven table removal
- **Migration Strategy**: Gradual table consolidation

### Consolidation Process
1. **Usage Analysis**: E2E testing identifies used tables
2. **Report Generation**: Automated usage reports
3. **Consolidation Planning**: Remove unused tables
4. **Migration Execution**: Gradual table removal
5. **Validation**: Post-consolidation testing

## Monitoring & Reporting

### Real-time Monitoring
- **Database Queries**: Live query tracking
- **Performance Metrics**: Load time monitoring
- **Error Tracking**: Test failure analysis
- **Usage Patterns**: Table access patterns

### Automated Reports
- **Database Usage**: Table usage analysis
- **Performance Reports**: Load time metrics
- **Test Results**: Comprehensive test reporting
- **Optimization Recommendations**: Data-driven improvements

---

*This testing architecture provides comprehensive database usage analysis, performance monitoring, and quality assurance for the Choices platform.*

### Consolidation Process
1. **Usage Analysis**: E2E testing identifies used tables
2. **Report Generation**: Automated usage reports
3. **Consolidation Planning**: Remove unused tables
4. **Migration Execution**: Gradual table removal
5. **Validation**: Post-consolidation testing

## Monitoring & Reporting

### Real-time Monitoring
- **Database Queries**: Live query tracking
- **Performance Metrics**: Load time monitoring
- **Error Tracking**: Test failure analysis
- **Usage Patterns**: Table access patterns

### Automated Reports
- **Database Usage**: Table usage analysis
- **Performance Reports**: Load time metrics
- **Test Results**: Comprehensive test reporting
- **Optimization Recommendations**: Data-driven improvements

---

*This testing architecture provides comprehensive database usage analysis, performance monitoring, and quality assurance for the Choices platform.*
