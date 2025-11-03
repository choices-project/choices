# Testing FEC Integration

**Status:** ✅ Ready to Test

---

## 🚀 Quick Start

### **1. Start Development Server**

```bash
cd web
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### **2. Test Public FEC Lookup**

```bash
# Test the public endpoint (no auth required)
curl "http://localhost:3000/api/candidate/verify-fec?fecId=H8CA15018"
```

**Expected Response:**
```json
{
  "found": true,
  "candidate": {
    "id": "H8CA15018",
    "name": "Ro Khanna",
    "party": "DEMOCRATIC PARTY",
    "office": "House",
    "state": "CA",
    "district": "17",
    "status": "C",
    "active": true,
    "electionYears": [2016, 2018, 2020, 2022, 2024]
  }
}
```

### **3. Test Full Verification Flow**

1. **Login to your app**
2. **Go to:** `/candidate/declare`
3. **Fill out candidacy:**
   - Office: "U.S. House (CA-17)"
   - Level: Federal
   - State: CA
   - Candidate Name: (your name)
   - Complete the wizard
4. **In Step 6 (Official Filing):**
   - Official Filing ID: `H8CA15018` (or any real FEC ID)
   - Fill other fields optionally
5. **Submit** and go to `/candidate/dashboard`
6. **Click "Verify with FEC"** button

---

## 🔍 Verification Checklist

### **API Key Configuration** ✅
- [x] FEC_API_KEY in `.env.local`
- [x] Key format looks correct (alphanumeric)

### **Code Integration** ✅
- [x] FEC client created (`web/lib/integrations/fec.ts`)
- [x] Verification endpoint (`/api/candidate/verify-fec`)
- [x] Dashboard button added
- [x] Types exported from integrations index

### **Database** ✅
- [x] Filing fields migration applied
- [x] Types updated with filing fields

---

## 🧪 Test Cases

### **Test Case 1: Valid FEC ID**
```
FEC ID: H8CA15018
Expected: Candidate found, active status returned
```

### **Test Case 2: Invalid FEC ID**
```
FEC ID: INVALID123
Expected: Candidate not found, appropriate error message
```

### **Test Case 3: Non-Federal Office**
```
Office: State Governor (level: state)
FEC ID: H8CA15018
Expected: Error - FEC verification only for federal offices
```

### **Test Case 4: Missing FEC ID**
```
Platform without FEC ID
Expected: Button doesn't appear or shows error
```

---

## 🐛 Troubleshooting

### **"FEC_API_KEY not configured"**
- Check `.env.local` exists in `web/` directory
- Verify key is on its own line: `FEC_API_KEY=your_key_here`
- Restart dev server after adding key

### **"Failed to connect"**
- Dev server not running: `npm run dev`
- Wrong port: Check if server is on different port
- Check terminal for errors

### **"401 Unauthorized"**
- Must be logged in for POST endpoint
- GET endpoint works without auth (for testing)

### **"Rate limit exceeded"**
- FEC API limit: 1 request per second
- Wait 1 second between requests
- Client has built-in rate limiting

### **"Candidate not found"**
- FEC ID might be invalid
- Try known good ID: `H8CA15018`
- Check FEC website to verify ID exists

---

## 📊 Example FEC IDs for Testing

### **House Candidates:**
- `H8CA15018` - CA-17 (Ro Khanna)
- `H8NY13148` - NY-13
- `H8TX30003` - TX-30

### **Senate Candidates:**
- `S2CA00184` - California Senate
- `S6GA00030` - Georgia Senate

### **Presidential:**
- `P80003338` - Example presidential candidate

---

## ✅ Success Indicators

**When working correctly:**
1. ✅ GET endpoint returns candidate data instantly
2. ✅ POST endpoint verifies and updates platform
3. ✅ Dashboard shows "Verified" badge after verification
4. ✅ Filing status changes to `verified`
5. ✅ Official FEC candidate data displayed

---

## 🔗 Useful Links

- **FEC API Docs:** https://api.open.fec.gov/developers/
- **Get API Key:** https://api.open.fec.gov/developers/
- **FEC Candidate Search:** https://www.fec.gov/data/candidates/

---

**Last Updated:** January 30, 2025

