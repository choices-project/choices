# Visual Progress Guide for Playwright Tests

**Created: January 27, 2025**  
**Purpose: Guide for getting visual progress feedback during test execution**

## 🎯 **Progress Bar Options**

### **✅ Option 1: Line Reporter (Clean Progress)**
```bash
# Shows dots for progress: [1/2] [2/2] with clean output
npm run test:playwright:progress -- tests/playwright/e2e/core/user-journey-stage.spec.ts
```

### **✅ Option 2: List Reporter (Detailed Progress)**
```bash
# Shows ✅ and ❌ with detailed output
npm run test:playwright:iterative -- --reporter=list tests/playwright/e2e/core/user-journey-stage.spec.ts
```

### **✅ Option 3: Chrome Only (Fast Progress)**
```bash
# Fastest progress feedback (30-60 seconds)
npm run test:playwright -- --config=tests/playwright.config.chrome-only.ts --reporter=line tests/playwright/e2e/core/user-journey-stage.spec.ts
```

## 📊 **What You'll See**

### **Line Reporter (Clean)**
```
Running 2 tests using 1 worker

[1/2] [chromium-progress] › User Journey Stage › should handle user registration
[2/2] [chromium-progress] › User Journey Stage › should handle admin login

  2 passed (20.7s)
```

### **List Reporter (Detailed)**
```
Running 2 tests using 1 worker

✓  1 [chromium-inline] › User Journey Stage › should handle user registration (6.0s)
✓  2 [chromium-inline] › User Journey Stage › should handle admin login (20.2s)

  2 passed (28.9s)
```

## 🚀 **Recommended Commands for Your Workflow**

### **Daily Development (Fast Progress)**
```bash
# Clean progress with dots (30-60 seconds)
npm run test:playwright:progress -- tests/playwright/e2e/core/user-journey-stage.spec.ts
```

### **Debugging (Detailed Progress)**
```bash
# Detailed progress with ✅/❌ (2-3 minutes)
npm run test:playwright:iterative -- --reporter=list tests/playwright/e2e/core/user-journey-stage.spec.ts
```

### **Specific Test Debugging**
```bash
# Debug registration issues with progress
npm run test:playwright:progress -- tests/playwright/e2e/core/user-journey-stage.spec.ts --grep="registration"

# Debug admin issues with progress
npm run test:playwright:progress -- tests/playwright/e2e/core/admin-journey-stage.spec.ts --grep="admin"
```

## ⏱️ **Progress Timing Expectations**

| Command | Time | Progress Style | Use Case |
|---------|------|----------------|----------|
| `test:playwright:progress` | 30-60s | Dots `[1/2] [2/2]` | Daily development |
| `test:playwright:iterative` | 2-3min | Detailed ✅/❌ | Debugging |
| `test:playwright:chrome-only` | 30-60s | Fast dots | Quick checks |

## 🎯 **Pro Tips**

### **1. Use Progress for Development**
- Line reporter shows clean progress
- You can see exactly which test is running
- No overwhelming output

### **2. Use Detailed for Debugging**
- List reporter shows detailed steps
- You can see what's happening inside tests
- Good for understanding failures

### **3. Avoid Running Too Many Tests**
```bash
# ❌ DON'T - This will run 300+ tests
npm run test:playwright

# ✅ DO - This runs only your specific tests
npm run test:playwright:progress -- tests/playwright/e2e/core/user-journey-stage.spec.ts
```

### **4. Use Grep for Specific Tests**
```bash
# Run only registration tests
npm run test:playwright:progress -- tests/playwright/e2e/core/user-journey-stage.spec.ts --grep="registration"

# Run only admin tests
npm run test:playwright:progress -- tests/playwright/e2e/core/admin-journey-stage.spec.ts --grep="admin"
```

## 🔧 **Configuration Comparison**

| Setting | progress | iterative | chrome-only |
|---------|----------|-----------|-------------|
| **Reporter** | Line (dots) | List (✅/❌) | List (✅/❌) |
| **Browsers** | 1 (Chrome) | 1 (Chrome) | 1 (Chrome) |
| **Time** | 30-60s | 2-3min | 30-60s |
| **Use Case** | Daily dev | Debugging | Quick checks |

## 🎉 **Bottom Line**

**For your iterative development, use:**

1. **`npm run test:playwright:progress`** - Clean progress with dots (recommended)
2. **`npm run test:playwright:iterative`** - Detailed progress for debugging
3. **Always specify test files** - Don't run the entire suite

You'll get clear visual feedback on test progress without overwhelming output!
