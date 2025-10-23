# Playwright Configuration Guide

**Created: January 27, 2025**  
**Status: ✅ ALL CONFIGS STANDARDIZED AND WORKING**

## 🎯 **Configuration Overview**

This directory contains multiple Playwright configurations for different testing scenarios. All configurations have been standardized to work together correctly.

## 📁 **Available Configurations**

### **1. `playwright.config.inline.ts` - Main Configuration**
- **Purpose**: Primary configuration for comprehensive testing
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome
- **Reporting**: Inline list reporter (no HTML hanging)
- **Use Case**: Full test suite execution
- **Environment**: All environment variables included

### **2. `playwright.config.chrome-only.ts` - Fast Development**
- **Purpose**: Fast iterative development testing
- **Browsers**: Chrome only
- **Reporting**: Inline list reporter
- **Use Case**: Quick development cycles
- **Environment**: All environment variables included

### **3. `playwright.config.performance.ts` - Performance Testing**
- **Purpose**: Performance and load testing
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Reporting**: List, JSON, JUnit
- **Use Case**: Performance benchmarking
- **Environment**: All environment variables included

### **4. `playwright.config.monitoring.ts` - Visual Monitoring**
- **Purpose**: Visual regression and monitoring testing
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Reporting**: List, JSON, JUnit, GitHub
- **Use Case**: Visual monitoring and regression testing
- **Environment**: All environment variables included

## 🔧 **Standardized Settings**

All configurations now use:

### **Test Directory**
```typescript
testDir: '/Users/alaughingkitsune/src/Choices/web/tests/playwright/e2e'
```

### **Base URL**
```typescript
baseURL: 'http://localhost:3000'
```

### **Environment Variables**
```typescript
env: {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}
```

### **Web Server**
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

## 🚀 **Usage Examples**

### **🚀 Quick Development Testing (Chrome Only) - 30-60 seconds**
```bash
# Recommended for daily development
npm run test:playwright -- --config=tests/playwright/configs/playwright.config.chrome-only.ts --reporter=list tests/playwright/e2e/core/user-journey-stage.spec.ts
```

### **🔍 Full Test Suite - 2-5 minutes**
```bash
# Before commits - all browsers
npm run test:playwright -- --config=tests/playwright/configs/playwright.config.inline.ts --reporter=list tests/playwright/e2e/core/user-journey-stage.spec.ts tests/playwright/e2e/core/admin-journey-stage.spec.ts
```

### **📊 Performance Testing - 3-8 minutes**
```bash
# Only when you need performance data
npm run test:playwright -- --config=tests/playwright/configs/playwright.config.performance.ts --reporter=list
```

### **📹 Visual Monitoring - 4-8 minutes**
```bash
# Only when you need visual regression testing
npm run test:playwright:monitoring -- --reporter=list tests/playwright/e2e/core/user-journey-stage.spec.ts
```

## ⚠️ **Important: Avoid Running 300+ Tests**

### **❌ DON'T Run These (Time Sinks):**
```bash
# These will run 300+ tests and take 15-30 minutes
npm run test:playwright  # Without specifying specific tests
npm run test:playwright -- --config=tests/playwright/configs/playwright.config.monitoring.ts  # Without specific tests
```

### **✅ DO Run These (Fast & Focused):**
```bash
# Specific test files (30-60 seconds)
npm run test:playwright -- --config=tests/playwright.config.chrome-only.ts --reporter=list tests/playwright/e2e/core/user-journey-stage.spec.ts

# Specific test patterns (30-60 seconds)
npm run test:playwright -- --config=tests/playwright.config.chrome-only.ts --reporter=list --grep="registration"
```

## 🔍 **Key Features**

### **✅ Standardized Environment Variables**
- All configs include `SUPABASE_SERVICE_ROLE_KEY`
- Consistent environment variable handling
- No more "environment variable required" errors

### **✅ Consistent Test Directory**
- All configs point to the same test directory
- No more path resolution issues

### **✅ Unified Base URL**
- All configs use `localhost:3000`
- No more port conflicts

### **✅ Inline Reporting**
- No HTML reports that cause hanging
- Immediate test results
- JSON output for parsing

### **✅ Global Setup/Teardown**
- Properly referenced global setup files
- Performance and monitoring specific setup

## 🎯 **Configuration Selection Guide**

| Use Case | Recommended Config | Reason |
|----------|-------------------|---------|
| **Development** | `chrome-only.ts` | Fast, single browser |
| **CI/CD** | `inline.ts` | Full browser coverage |
| **Performance** | `performance.ts` | Optimized for benchmarking |
| **Visual Testing** | `monitoring.ts` | Enhanced video recording |

## 🔧 **Troubleshooting**

### **Environment Variables Not Loading**
- All configs now include environment variable configuration
- Use `source .env.local` before running tests
- Check that `.env.local` exists and has required variables

### **Test Directory Issues**
- All configs use absolute paths
- No more relative path resolution issues

### **Port Conflicts**
- All configs use `localhost:3000`
- No more port 3002 conflicts

### **Hanging HTML Reports**
- All configs use inline list reporter
- No more HTML report hanging issues

## 📊 **Configuration Comparison**

| Setting | inline.ts | chrome-only.ts | performance.ts | monitoring.ts |
|---------|-----------|----------------|----------------|---------------|
| **Browsers** | 4 | 1 | 5 | 4 |
| **Parallel** | ✅ | ❌ | ✅ | ✅ |
| **Workers** | Auto | 1 | Auto | Auto |
| **Timeout** | 30s | 60s | 30s | 30s |
| **Video** | On Failure | On Failure | On Failure | On Failure |
| **Tracing** | On Retry | On Retry | On Retry | On Retry |
| **Global Setup** | ❌ | ❌ | ✅ | ✅ |

## 🎉 **Benefits of Standardization**

1. **No More Configuration Conflicts**
2. **Consistent Environment Variable Handling**
3. **Unified Test Directory Structure**
4. **Standardized Base URLs**
5. **Reliable Test Execution**
6. **Easy Configuration Switching**
7. **Maintainable Test Infrastructure**

## 🔄 **Migration Notes**

- **Old configs**: Had inconsistent paths and URLs
- **New configs**: All standardized and working together
- **Environment variables**: Now included in all configs
- **Reporting**: Switched from HTML to inline to prevent hanging
- **Global setup**: Properly referenced in performance and monitoring configs

All configurations are now production-ready and work together seamlessly!
