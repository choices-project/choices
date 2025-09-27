# Civics Address Lookup Feature Testing Plan

## 🎯 **Objective**
Test the civics address lookup feature to ensure it works correctly with API keys and environment variables.

## 🔧 **Required Environment Variables**

### **Vercel Production:**
```bash
PRIVACY_PEPPER_CURRENT=hex:14709a10febd0d5daf27f70c07be2239f3ff92092201a0f7f90a3f79f2c5d348
GOOGLE_CIVIC_API_KEY=your_google_civic_api_key_here
```

### **Local Development (.env.local):**
```bash
PRIVACY_PEPPER_DEV=hex:your_dev_pepper_here
GOOGLE_CIVIC_API_KEY=your_google_civic_api_key_here
```

## 🧪 **Testing Steps**

### **1. Local Testing**
```bash
# Start development server
cd web
npm run dev

# In another terminal, run the test script
node scripts/test-civics-feature.js
```

### **2. API Endpoint Testing**
Test the endpoint directly:
```bash
curl -X POST http://localhost:3000/api/v1/civics/address-lookup \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, Springfield, IL 62704"}'
```

### **3. E2E Testing**
```bash
# Run the existing E2E tests
npm run test:e2e -- --grep "CIVICS_ADDRESS_LOOKUP"
```

### **4. Feature Flag Verification**
Check that the feature is enabled:
```bash
curl http://localhost:3000/api/e2e/flags
```

## 📋 **Test Cases**

### **Valid Addresses:**
- `123 Main St, Springfield, IL 62704`
- `1600 Pennsylvania Avenue NW, Washington, DC 20500`
- `1 Hacker Way, Menlo Park, CA 94025`

### **Expected Responses:**
- **Success (200)**: `{"ok": true, "jurisdiction": {...}}`
- **Not Configured (503)**: `{"error": "Civics address lookup is not configured"}`
- **Missing Address (400)**: `{"error": "address required"}`

## 🔍 **Debugging**

### **Check Environment Variables:**
```bash
# In your app, add this to see what's available
console.log('GOOGLE_CIVIC_API_KEY:', !!process.env.GOOGLE_CIVIC_API_KEY);
console.log('PRIVACY_PEPPER_CURRENT:', !!process.env.PRIVACY_PEPPER_CURRENT);
```

### **Check Feature Flags:**
```bash
curl http://localhost:3000/api/e2e/flags | jq '.CIVICS_ADDRESS_LOOKUP'
```

## 🚀 **Deployment Testing**

1. **Update Vercel Environment Variables** with the correct format
2. **Redeploy** the application
3. **Test the production endpoint** with the same test cases
4. **Verify** that the civics page loads correctly

## 📝 **Success Criteria**

- ✅ API endpoint responds correctly
- ✅ Address lookup returns jurisdiction data
- ✅ Error handling works for missing configuration
- ✅ E2E tests pass
- ✅ Production deployment works
- ✅ Feature flag is properly enabled

## 🐛 **Common Issues**

1. **Environment Variable Format**: Must include `hex:` or `base64:` prefix
2. **API Key Missing**: Check that `GOOGLE_CIVIC_API_KEY` is set
3. **Feature Flag**: Ensure `CIVICS_ADDRESS_LOOKUP` is enabled
4. **Privacy Pepper**: Must be properly formatted and ≥32 bytes
