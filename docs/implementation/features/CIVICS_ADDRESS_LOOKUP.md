# Civics Address Lookup System

**Created:** 2025-01-27  
**Updated:** 2025-10-01  
**Status:** Production Ready ✅  
**Feature Flags:** `CIVICS_ADDRESS_LOOKUP: true`, `BROWSER_LOCATION_CAPTURE: true`  
**Purpose:** Privacy-first address-based representative lookup system with browser location capture

---

## 🎯 **Overview**

The Civics Address Lookup System provides a privacy-first way for users to discover their elected representatives by entering their address or using browser location capture. The system uses advanced privacy techniques including HMAC hashing, geohashing, and k-anonymity to protect user location data while providing accurate representative information.

### **Browser Location Capture Integration** ✅
The system now includes browser location capture capabilities:
- **Geolocation API** - Direct browser location access with user consent
- **Quantized Coordinates** - Privacy-preserving coordinate precision levels
- **Jurisdiction Resolution** - Automatic mapping to canonical OCD divisions
- **Consent Tracking** - Explicit user consent with audit trails
- **Skip Options** - Users can opt out of location collection

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
- **`privacy-utils.ts`** - Privacy utilities and HMAC functions (peppered HMAC, deterministic jitter)
- **`env-guard.ts`** - Environment configuration validation (pepper sanity checks)
- **`location-resolver.server.ts`** - Server-side resolver chaining Census → Nominatim → Google, persisting OCD-backed records to Supabase
- **`address-lookup/route.ts`** - Authenticated API endpoint enforcing consent, rate limiting, and cookie derivation
- **`CandidateAccountabilityCard.tsx` / `CivicsLure.tsx`** - Representative information display fed by stored OCD divisions
- **`app/(app)/profile/page.tsx`** - Displays stored location snapshot and provides refresh/remove controls

### **Key Files**
```
web/lib/civics/
├── privacy-utils.ts                    # Privacy utilities and HMAC
├── env-guard.ts                        # Environment validation
├── location-resolver.server.ts         # Server resolver + persistence pipeline (NEW)
├── geographic-service.ts               # Geographic data processing
├── canonical-id-service.ts             # Representative ID management
└── types.ts                           # TypeScript definitions

web/app/api/v1/civics/
├── address-lookup/route.ts             # Location capture API (auth + consent + rate limiting)
├── representative/[id]/route.ts        # Representative details
├── by-state/route.ts                   # State-based queries
└── heatmap/route.ts                    # Geographic heatmaps

web/components/civics/
├── CandidateAccountabilityCard.tsx     # Representative cards
├── RepresentativeCard.tsx              # Basic representative info
└── AddressLookupForm.tsx               # Address input form / onboarding integration
```

### **Database Schema**
- **`civic_jurisdictions`** - Canonical OCD divisions (hierarchy metadata, centroids, parents)
- **`jurisdiction_aliases`** - ZIP/place aliases pointing to OCD IDs with confidence scores
- **`jurisdiction_geometries`** - GeoJSON boundaries (simplified + canonical) for choropleths
- **`jurisdiction_tiles`** - H3/S2 tile cache for heatmaps and fast lookups
- **`candidate_jurisdictions`** - Join table linking candidates to OCD divisions and roles
- **`user_location_resolutions`** - Quantized coordinates + consent metadata per user (revocable)
- **`location_consent_audit`** - Immutable audit trail recording grants/revocations/updates
- **Existing Civics Tables** - `representatives`, `campaign_finance`, `voting_records`, `promises`

---

## 🔄 **User Journey Flow**

### **Address Lookup Process**
1. **Capture Request** → User submits address/ZIP or approves browser geolocation
2. **Consent & Rate Check** → API verifies JWT, demographics consent, and 30s per-user rate limit
3. **Resolver Chain** → Server queries Census → Nominatim → Google Civic/Geocode, falling back to ZIP alias/tiles
4. **Persistence** → `user_location_resolutions` updated (quantized coords, hashed address, consent version) + audit log written
5. **Jurisdiction Cookie** → Cookie derived from OCD division (state/county/district identifiers)
6. **Downstream Consumption** → Civic & electoral services read canonical OCD IDs for personalization

### **Data Flow**
```
Location Input → Consent Check → Server Resolver → Supabase Persistence + Audit → Jurisdiction Cookie → Dashboard Filtering
```

### **Privacy Flow**
```
Raw Address → Normalize → HMAC(pepper + scope) → Resolver (Census/Nominatim/Google) → OCD Mapping (`civic_jurisdictions`) → Signed Cookie → SSR Filtering
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
<<<<<<< HEAD
- **`GOOGLE_CIVIC_API_KEY`** - Google Civic Information API
- **`FEC_API_KEY`** - Federal Election Commission API

### **API Integrations**
- **Google Civic Information API** - Address to jurisdiction mapping
- **Congress.gov API** - Congressional voting records
- **FEC API** - Campaign finance data
- **Open States API** - State and local representatives
- **GovTrack.us API** - Congressional data
- **OpenSecrets API** - Campaign finance transparency
=======
- **`GOOGLE_CIVIC_API_KEY`** - Google Civic Information API (optional fallback)
- **`GOOGLE_MAPS_GEOCODE_API_KEY`** - Google Geocoding fallback (optional, reused if Civic key present)
- **`FEC_API_KEY`** - Federal Election Commission API

### **API Integrations & Costs**
- **US Census Geocoder** - Primary free geocoding (no key required)
- **OpenStreetMap Nominatim** - Secondary free geocoding fallback (fair-use throttling)
- **Google Civic/Geocode** - Final fallback for hard addresses (billing: $0.50 per 1,000 requests beyond free tier)
- **Congress.gov / FEC / OpenStates / GovTrack / OpenSecrets** - Downstream civics datasets (free)

### **Rate Limiting & Quota Management**
- **Per-User Rate Limit**: One location capture every 30 seconds (enforced server-side at `/api/v1/civics/address-lookup`)
- **Resolver Chain**: Census → Nominatim → Google to minimize paid quota usage
- **Fallback Mechanisms**: ZIP alias table + H3 tiles when coordinates unavailable
- **Cost Control**: Google Civic usage monitored; free providers hit first
>>>>>>> ce50158 (feat: implement browser location capture system)

---

## 📊 **Data Sources**

### **Representative Database**
- **Federal** - Congress, Senate, President
- **State** - Governors, state legislators
- **Local** - Mayors, city council, county officials
- **Total Coverage** - 1,000+ elected officials

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
- **API Response Shape** – `POST /api/v1/civics/address-lookup` returns `{ location: { lat, lon, precision, provider, jurisdictionIds, primaryOcdId, jurisdictionName, aliasConfidence, storedAt, consentVersion } }`; `DELETE` returns `{ location: null }`; `/api/user/profile` exposes a derived `location` bundle for the profile UI.
- **API Methods** – `POST /api/v1/civics/address-lookup` captures or refreshes location; `DELETE` revokes stored coordinates, clears profile geo fields, and resets the jurisdiction cookie.
