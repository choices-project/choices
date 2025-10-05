# API Rate Limits Documentation

**Created:** 2025-10-05  
**Updated:** 2025-10-05  
**Status:** Critical limitation identified

## 🚨 **OpenStates API Rate Limit Issue**

### **Current Limitation:**
- **Daily Limit:** 250 requests per day
- **Current Usage:** 391 requests (exceeded by 141)
- **Reset Time:** Daily at midnight UTC

### **Impact on Ingestion:**
- **Expected:** 50 states × 5 representatives = 250 requests minimum
- **Reality:** Need additional requests for data enrichment
- **Problem:** Cannot complete full ingestion in single day

## 📊 **API Rate Limits Summary**

| API | Daily Limit | Current Usage | Status |
|-----|-------------|---------------|---------|
| OpenStates | 250 | 391 | ❌ Exceeded |
| Congress.gov | 5,000 | Unknown | ✅ Available |
| FEC | 1,000 | Unknown | ✅ Available |
| Google Civic | 100,000 | Unknown | ✅ Available |
| LegiScan | 1,000 | Unknown | ✅ Available |

## 🎯 **Optimization Strategies**

### **1. Maximize Each Request:**
- **Batch Processing:** Get multiple representatives per request
- **Data Enrichment:** Collect all possible data in single call
- **Efficient Filtering:** Use API parameters to reduce data transfer

### **2. Alternative Data Sources:**
- **Congress.gov:** Federal representatives (no state limit)
- **LegiScan:** State legislation data
- **Google Civic:** Election and polling data
- **FEC:** Campaign finance data

### **3. Phased Approach:**
- **Phase 1:** Use non-rate-limited APIs
- **Phase 2:** Wait for OpenStates reset
- **Phase 3:** Enhanced data collection

## 🚀 **Recommended Actions**

### **Immediate:**
1. **Switch to Congress.gov** for federal representatives
2. **Use LegiScan** for state legislation data
3. **Implement Google Civic** for election data

### **Long-term:**
1. **Request higher limits** from OpenStates
2. **Implement caching** to reduce API calls
3. **Use bulk data dumps** when available

## 📝 **Notes**

- **OpenStates limitation** is the primary bottleneck
- **250 requests/day** is insufficient for comprehensive ingestion
- **Alternative APIs** must be prioritized
- **Rate limit monitoring** is critical for production

---

**Next Steps:** Implement Phase 1 with alternative APIs while waiting for OpenStates rate limit reset.
