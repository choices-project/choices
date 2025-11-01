# ⏱️ Timeout Configuration Guide

**Created:** January 29, 2025  
**Purpose:** Comprehensive timeout configuration to prevent stuck processes and resource exhaustion

---

## 🎯 **Overview**

This document outlines the timeout configurations implemented across the Choices project to prevent development processes from getting stuck and consuming excessive system resources.

---

## 📋 **Timeout Settings by Process Type**

### **ESLint (Linting)**
- **Timeout**: 300 seconds (5 minutes)
- **Rationale**: Linting should complete quickly; 5 minutes is generous for large codebases
- **Scripts**: All `lint:*` commands

### **TypeScript Compilation**
- **Timeout**: 180 seconds (3 minutes)
- **Rationale**: Type checking should be fast with incremental compilation
- **Scripts**: All `types:*` and `type-check:*` commands

### **Jest Testing**
- **Global Timeout**: 30 seconds per test
- **Client Tests**: 20 seconds per test
- **Server Tests**: 25 seconds per test
- **Slow Test Threshold**: 10 seconds
- **Rationale**: Tests should be fast and focused

### **Playwright E2E Testing**
- **Test Timeout**: 30 seconds per test
- **Action Timeout**: 10 seconds per action
- **Navigation Timeout**: 15 seconds per navigation
- **Overall Timeout**: 600 seconds (10 minutes) for full test suite
- **Rationale**: E2E tests need more time for browser interactions

### **Build Processes**
- **Next.js Build**: 900 seconds (15 minutes)
- **CI Verification**: 600 seconds (10 minutes)
- **Rationale**: Builds can take longer but should not run indefinitely

---

## 🛠️ **Implementation Details**

### **Package.json Scripts**
All development scripts now include `timeout` commands:

```json
{
  "lint:test": "timeout 300 eslint . --max-warnings=0",
  "types:ci": "timeout 180 tsc -p ../tsconfig.ci.json --noEmit",
  "test": "timeout 300 jest",
  "test:e2e": "timeout 600 playwright test"
}
```

### **Jest Configuration**
```javascript
module.exports = {
  testTimeout: 30000, // 30 seconds per test
  slowTestThreshold: 10, // Mark tests as slow if > 10 seconds
  projects: [
    {
      displayName: 'client',
      testTimeout: 20000, // 20 seconds for client tests
    },
    {
      displayName: 'server', 
      testTimeout: 25000, // 25 seconds for server tests
    }
  ]
};
```

### **Playwright Configuration**
```javascript
export default defineConfig({
  timeout: 30_000, // 30 seconds per test
  expect: { timeout: 5_000 }, // 5 seconds for assertions
  use: {
    actionTimeout: 10_000, // 10 seconds per action
    navigationTimeout: 15_000, // 15 seconds per navigation
  }
});
```

---

## 🔍 **Process Monitoring**

### **Automatic Monitoring Script**
A monitoring script (`scripts/monitor-processes.sh`) automatically detects and kills stuck processes:

```bash
npm run monitor:processes
```

**Monitoring Criteria:**
- **ESLint**: >200% CPU, >10% memory, >5 minutes runtime
- **TypeScript**: >150% CPU, >15% memory, >10 minutes runtime  
- **Jest**: >100% CPU, >20% memory, >15 minutes runtime
- **Playwright**: >80% CPU, >25% memory, >20 minutes runtime

### **Manual Process Cleanup**
If processes get stuck, you can manually kill them:

```bash
# Kill all ESLint processes
pkill -f "eslint"

# Kill all TypeScript processes  
pkill -f "tsc"

# Kill all Jest processes
pkill -f "jest"

# Kill all Playwright processes
pkill -f "playwright"
```

---

## ⚡ **Performance Optimizations**

### **ESLint Optimizations**
- **Caching**: Enabled with `.eslintcache`
- **Parallel Processing**: Limited to 50% of CPU cores
- **File Limits**: Maximum 1000 files per run
- **Memory Limits**: 2GB maximum

### **TypeScript Optimizations**
- **Incremental Compilation**: Enabled
- **Skip Lib Check**: Enabled for faster compilation
- **Isolated Modules**: Enabled for better performance

### **Jest Optimizations**
- **Parallel Execution**: Limited workers
- **Cache**: Enabled for faster subsequent runs
- **Coverage**: Optimized collection patterns

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Process Still Getting Stuck**
   - Check for infinite loops in code
   - Verify configuration files are valid
   - Clear caches: `rm -rf .eslintcache .next/cache`

2. **Timeouts Too Short**
   - Adjust timeout values in `package.json`
   - Consider breaking large test suites into smaller chunks

3. **High Resource Usage**
   - Run `npm run monitor:processes` regularly
   - Check for memory leaks in code
   - Restart development server periodically

### **Emergency Cleanup**
```bash
# Kill all Node.js processes (use with caution)
pkill -f "node"

# Kill all development processes
pkill -f "eslint|tsc|jest|playwright|next"
```

---

## 📊 **Monitoring Commands**

```bash
# Check running processes
ps aux | grep -E "(eslint|tsc|jest|playwright|next)"

# Monitor resource usage
top -l 1 | grep -E "(eslint|tsc|jest|playwright|next)"

# Check port usage
lsof -i :3000,3001,8080,8081

# Run process monitor
npm run monitor:processes
```

---

## 🎯 **Best Practices**

1. **Regular Monitoring**: Run `npm run monitor:processes` every 30 minutes during development
2. **Clean Restarts**: Restart development server every few hours
3. **Cache Management**: Clear caches when switching branches or after major changes
4. **Resource Limits**: Monitor system resources and adjust timeouts as needed
5. **Process Cleanup**: Always clean up processes before switching tasks

---

**Last Updated:** January 29, 2025  
**Status:** ✅ Active - All timeouts configured and monitoring enabled
