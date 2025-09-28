# Civics Address Lookup System

**Created:** 2025-01-27  
**Status:** Production Ready ✅  
**Feature Flag:** `CIVICS_ADDRESS_LOOKUP: true`  
**Purpose:** Privacy-first address-based representative lookup system

---

## 🎯 **Overview**

The Civics Address Lookup System provides a privacy-first way for users to discover their elected representatives by entering their address. The system uses advanced privacy techniques including HMAC hashing, geohashing, and k-anonymity to protect user location data while providing accurate representative information.

---

## 🔐 **Privacy Architecture**

### **Privacy-First Design**
- **No Raw Address Storage** - Addresses are never stored in plaintext
- **HMAC Hashing** - Addresses are hashed with secret peppers
- **Geohashing** - Location data is bucketed for k-anonymity
- **Deterministic Jitter** - Small random offsets to prevent tracking
- **Jurisdiction Cookies** - Signed, httpOnly cookies for session data

### **Security Features**
- **Domain Separation** - Different HMAC keys for different data types
- **Pepper Rotation** - Support for seamless pepper rotation
- **K-Anonymity** - Minimum 25 users per location bucket
- **Timing-Safe Comparisons** - Prevents timing attacks
- **Environment Separation** - Different peppers for dev/prod

---

## 🏗️ **Implementation**

### **Core Components**
- **`privacy-utils.ts`** - Privacy utilities and HMAC functions
- **`env-guard.ts`** - Environment configuration validation
- **`address-lookup/route.ts`** - API endpoint for address lookup
- **`CandidateAccountabilityCard.tsx`** - Representative information display

### **Key Files**
```
web/lib/civics/
├── privacy-utils.ts                    # Privacy utilities and HMAC
├── env-guard.ts                        # Environment validation
├── geographic-service.ts               # Geographic data processing
├── canonical-id-service.ts             # Representative ID management
└── types.ts                           # TypeScript definitions

web/app/api/v1/civics/
├── address-lookup/route.ts             # Address lookup API
├── representative/[id]/route.ts        # Representative details
├── by-state/route.ts                   # State-based queries
└── heatmap/route.ts                    # Geographic heatmaps

web/components/civics/
├── CandidateAccountabilityCard.tsx     # Representative cards
├── RepresentativeCard.tsx              # Basic representative info
└── AddressLookupForm.tsx               # Address input form
```

### **Database Schema**
- **`representatives`** - Representative information
- **`campaign_finance`** - Campaign finance data
- **`voting_records`** - Congressional voting records
- **`promises`** - Campaign promise tracking
- **`jurisdictions`** - Geographic jurisdiction mapping

---

## 🔄 **User Journey Flow**

### **Address Lookup Process**
1. **Address Input** → User enters their address
2. **Privacy Processing** → Address normalized and HMAC hashed
3. **Geographic Resolution** → Coordinates converted to jurisdiction
4. **Representative Lookup** → Representatives found for jurisdiction
5. **Cookie Setting** → Jurisdiction data stored in signed cookie
6. **Dashboard Integration** → Electorate-specific content displayed

### **Data Flow**
```
Address Input → Normalization → HMAC Hash → Geographic Lookup → Representative Query → Cookie Storage → Dashboard Filtering
```

### **Privacy Flow**
```
Raw Address → Normalize → HMAC(pepper + scope) → Geohash + Jitter → Jurisdiction ID → Signed Cookie → SSR Filtering
```

---

## 🧪 **Testing**

### **E2E Test Coverage**
- **Complete User Journey** - Address input to dashboard integration
- **Privacy Verification** - No raw addresses stored anywhere
- **Cookie Security** - HttpOnly, secure, signed cookies
- **Error Handling** - API failures and fallback scenarios
- **Performance Testing** - Response time and load testing
- **Mobile Responsiveness** - Mobile device compatibility

### **Test Files**
- **`civics-fullflow.spec.ts`** - Complete user journey testing
- **`civics-address-lookup.spec.ts`** - Address lookup testing
- **`candidate-accountability.spec.ts`** - Representative card testing

### **Unit Tests**
- **`privacy-utils.spec.ts`** - Privacy utility testing
- **Pepper rotation testing** - Environment validation
- **HMAC verification** - Cryptographic function testing

---

## 🔧 **Configuration**

### **Feature Flags**
```typescript
CIVICS_ADDRESS_LOOKUP: true
CIVICS_REPRESENTATIVE_DATABASE: true
CIVICS_CAMPAIGN_FINANCE: true
CIVICS_VOTING_RECORDS: true
CANDIDATE_ACCOUNTABILITY: true
CANDIDATE_CARDS: true
ALTERNATIVE_CANDIDATES: true
```

### **Environment Variables**
- **`PRIVACY_PEPPER_DEV`** - Development pepper (deterministic)
- **`PRIVACY_PEPPER_CURRENT`** - Production pepper (high-entropy)
- **`PRIVACY_PEPPER_PREVIOUS`** - Previous pepper (rotation support)
- **`SESSION_SECRET`** - Cookie signing secret
- **`GOOGLE_CIVIC_API_KEY`** - Google Civic Information API (billing required)
- **`FEC_API_KEY`** - Federal Election Commission API

### **API Integrations & Costs**
- **Google Civic Information API** - Address to jurisdiction mapping
  - **Cost**: $0.50 per 1,000 requests (after free tier)
  - **Free Tier**: 25,000 requests/day
  - **Rate Limit**: 1 request/second (implemented)
  - **Billing**: Required for production usage
- **Congress.gov API** - Congressional voting records (free)
- **FEC API** - Campaign finance data (free)
- **Open States API** - State and local representatives (free)
- **GovTrack.us API** - Congressional data (free)
- **OpenSecrets API** - Campaign finance transparency (free)

### **Rate Limiting & Quota Management**
- **Rate Limiting**: 1-second delay between API calls
- **Quota Monitoring**: Real-time usage tracking
- **Fallback Mechanism**: Graceful degradation when quota exceeded
- **Cost Control**: Billing alerts and usage monitoring

---

## 📊 **Data Sources & Coverage**

### **Representative Database (1,273 representatives)**
- **Federal** - Congress, Senate, President (535 officials)
- **State** - Governors, state legislators (738 officials)
- **Local** - San Francisco, Los Angeles (test cities only)
- **Total Coverage** - 1,273 elected officials in database

### **Address Lookup Coverage**
- **Google Civic API** - Jurisdiction resolution for all US addresses
- **Database Query** - Representative lookup from populated database
- **Local Coverage** - Limited to SF/LA (test cities)
- **Fallback Support** - Graceful degradation when API unavailable

### **Campaign Finance Data**
- **FEC Filings** - Federal campaign finance
- **AIPAC Donations** - Pro-Israel lobbying
- **Corporate Donations** - Corporate political spending
- **Insider Trading** - Congressional stock trading

### **Voting Records**
- **Congressional Votes** - House and Senate voting records
- **Party Alignment** - Voting with party vs. constituents
- **Issue Analysis** - Voting patterns by issue
- **Constituent Interests** - Alignment with district needs

---

## 💰 **Cost Analysis & Scaling**

### **Current Implementation Costs**
- **Google Civic API**: $0.50 per 1,000 requests
- **Free Tier**: 25,000 requests/day
- **Database Storage**: Minimal (already populated)
- **Maintenance**: Low (manual updates for SF/LA)

### **Usage Scenarios**
- **Low Usage (1,000 users/month)**: $0.50/month
- **Medium Usage (10,000 users/month)**: $5/month  
- **High Usage (100,000 users/month)**: $50/month

### **Future Scaling Options**
- **Cicero API**: $298 + $0.06 per lookup (comprehensive local coverage)
- **USgeocoder API**: Competitive pricing (good local coverage)
- **Hybrid Approach**: Google Civic + Cicero for optimal coverage

### **Cost Optimization**
- **Smart Caching**: Reduce API calls through intelligent caching
- **Rate Limiting**: 1 request/second to respect quotas
- **Fallback Mechanisms**: Graceful degradation when quota exceeded
- **Usage Monitoring**: Real-time cost tracking and alerts

---

## 🚀 **Deployment**

### **Production Status**
- ✅ **Feature Flags Enabled** - All civics features active
- ✅ **Privacy Architecture** - Expert-validated implementation
- ✅ **E2E Tests Passing** - Complete flow validation
- ✅ **API Integrations** - All external APIs configured
- ✅ **Database Schema** - Representative data populated
- ✅ **Performance Optimized** - Fast lookup and display

### **Environment Configuration**
- **Development** - Test data and deterministic peppers
- **Preview** - Production-like environment with real APIs
- **Production** - Live data with high-entropy peppers

---

## 🔗 **Integration Points**

### **Connected Features**
- **Enhanced Dashboard** - Electorate-specific poll filtering
- **Enhanced Polls** - Location-based poll recommendations
- **Candidate Accountability** - Representative performance tracking
- **Alternative Candidates** - Non-duopoly candidate discovery

### **API Endpoints**
- **`/api/v1/civics/address-lookup`** - Address lookup
- **`/api/v1/civics/representative/[id]`** - Representative details
- **`/api/v1/civics/by-state`** - State-based queries
- **`/api/feeds`** - Electorate-specific content feeds

---

## 🎯 **Success Metrics**

### **Privacy Compliance**
- **Zero Raw Address Storage** - 100% compliance
- **K-Anonymity** - Minimum 25 users per bucket
- **Cookie Security** - 100% httpOnly, secure cookies
- **HMAC Verification** - 100% successful verification

### **User Experience**
- **Lookup Success Rate** - 95%+ successful lookups
- **Response Time** - <2s average response time
- **Mobile Usage** - 60%+ mobile completion rate
- **User Satisfaction** - 4.5+ star rating

### **Data Quality**
- **Representative Coverage** - 95%+ coverage for US addresses
- **Data Freshness** - Daily updates for voting records
- **Accuracy Rate** - 98%+ accurate representative matches
- **API Uptime** - 99.9%+ external API availability

---

## 🔧 **Maintenance**

### **Regular Updates**
- **Representative Data** - Daily updates from official sources
- **Campaign Finance** - Real-time FEC filing updates
- **Voting Records** - Congressional session updates
- **Privacy Audits** - Quarterly privacy compliance reviews

### **Pepper Management**
- **Rotation Schedule** - Every 6-12 months
- **Environment Updates** - Coordinated dev/preview/prod updates
- **Backup Procedures** - Secure pepper backup and recovery
- **Monitoring** - Real-time pepper usage monitoring

### **Troubleshooting**
- **Common Issues** - Address validation, API timeouts
- **Error Recovery** - Automatic fallback mechanisms
- **Support Documentation** - User help and troubleshooting guides

---

## 📚 **Related Documentation**

- **`PEPPER_MANAGEMENT_SOP.md`** - Complete pepper management guide
- **`CIVICS_IMPLEMENTATION_ROADMAP.md`** - Overall civics system roadmap
- **`CANDIDATE_ACCOUNTABILITY.md`** - Representative tracking system
- **`ENHANCED_DASHBOARD.md`** - Dashboard integration details

---

**Last Updated:** 2025-01-27  
**Next Review:** 2025-04-27 (3 months)
