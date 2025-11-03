# FEC Integration Quick Start

**Status:** ✅ **READY TO USE**

---

## ✅ Setup Complete

Your FEC API key is already configured in `.env.local`. The integration is ready to use!

---

## 🧪 Test It Now

### **1. Test FEC API Connection**

```bash
# Test the public lookup endpoint
curl "http://localhost:3000/api/candidate/verify-fec?fecId=H8CA15018"
```

This should return candidate information if the API is working.

### **2. Use in Candidate Dashboard**

1. Declare candidacy for a federal office
2. In Step 6 (Official Filing), enter a FEC ID
3. Save your platform
4. Go to Candidate Dashboard
5. Click **"Verify with FEC"** button (appears for federal candidates with FEC IDs)

---

## 📋 How It Works

### **Verification Flow:**

1. **User enters FEC ID** in the declaration wizard
2. **Clicks "Verify with FEC"** on dashboard
3. **System calls FEC API** to verify candidate
4. **Updates platform** with verified information:
   - Filing status → `verified` or `filed`
   - Verification method → `api_verification`
   - Official FEC candidate data

### **What Gets Verified:**

- ✅ Candidate exists in FEC database
- ✅ Candidate is active for current election cycle
- ✅ Official candidate name, party, office
- ✅ Election years candidate is running

---

## 🎯 Example FEC IDs to Test

- `H8CA15018` - Example House candidate
- `S2CA00184` - Example Senate candidate
- `P80003338` - Example Presidential candidate

**Note:** These are real FEC IDs for testing. Replace with actual candidates as needed.

---

## 🔧 API Endpoints

### **GET /api/candidate/verify-fec?fecId=...**
Public endpoint to lookup candidate info (no auth required)

```typescript
// Example usage
const response = await fetch('/api/candidate/verify-fec?fecId=H8CA15018')
const data = await response.json()
// Returns: { found: true, candidate: {...} }
```

### **POST /api/candidate/verify-fec**
Verify and update candidate platform (auth required)

```typescript
// Example usage
const response = await fetch('/api/candidate/verify-fec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platformId: 'uuid',
    fecId: 'H8CA15018'
  })
})
// Returns: { success: true, verified: true, candidate: {...} }
```

---

## 🚀 Next Steps

1. **Test the verification** with a real FEC ID
2. **Add more states** - Start with California Cal-Access API
3. **Form generation** - Generate pre-filled FEC forms
4. **Auto-verification** - Auto-verify when FEC ID is entered

---

## ⚠️ Important Notes

- FEC API rate limit: **1 request per second**
- FEC API only provides **lookup/verification**, not filing submission
- Filing submission must be done via official FEC channels
- Verification is for **federal offices only** (House, Senate, President)

---

**Last Updated:** January 30, 2025

