# Civics Database Schema Documentation

**Created:** October 8, 2025  
**Updated:** October 8, 2025  
**Status:** ✅ **VERIFIED AND WORKING**  
**Purpose:** Complete documentation of the civics database schema and API data structures

---

## 📊 **DATABASE SCHEMA OVERVIEW**

### **Primary Table: `representatives_core`**
The main table storing all representative data with enhanced JSONB columns for rich data.

---

## 🏗️ **CORE TABLE STRUCTURE**

### **`public.representatives_core`**

#### **Primary Key & Identifiers:**
- `id` (SERIAL PRIMARY KEY) - Auto-incrementing unique identifier
- `bioguide_id` (VARCHAR(20) UNIQUE) - Congress.gov unique identifier
- `openstates_id` (VARCHAR(50)) - OpenStates API identifier
- `fec_id` (VARCHAR(20)) - Federal Election Commission identifier
- `google_civic_id` (VARCHAR(50)) - Google Civic API identifier
- `legiscan_id` (VARCHAR(50)) - LegiScan API identifier
- `congress_gov_id` (VARCHAR(50)) - Congress.gov internal ID
- `govinfo_id` (VARCHAR(50)) - GovInfo API identifier

#### **Basic Representative Information:**
- `name` (VARCHAR(255) NOT NULL) - Full name of representative
- `office` (VARCHAR(100)) - Office title (e.g., "US House", "US Senate")
- `level` (VARCHAR(50)) - Government level (federal, state, local)
- `state` (VARCHAR(10)) - State abbreviation (e.g., "NY", "CA")
- `district` (VARCHAR(50)) - District number or identifier
- `party` (VARCHAR(100)) - Political party affiliation

#### **Contact Information:**
- `primary_email` (VARCHAR(255)) - Primary email address
- `primary_phone` (VARCHAR(50)) - Primary phone number
- `primary_website` (TEXT) - Primary website URL
- `primary_photo_url` (TEXT) - Primary photo URL

#### **Social Media:**
- `twitter_handle` (VARCHAR(100)) - Twitter handle
- `facebook_url` (TEXT) - Facebook page URL
- `instagram_handle` (VARCHAR(100)) - Instagram handle
- `linkedin_url` (TEXT) - LinkedIn profile URL
- `youtube_channel` (VARCHAR(100)) - YouTube channel

#### **External References:**
- `wikipedia_url` (TEXT) - Wikipedia article URL
- `ballotpedia_url` (TEXT) - Ballotpedia page URL

#### **Term Information:**
- `term_start_date` (DATE) - Start date of current term
- `term_end_date` (DATE) - End date of current term
- `next_election_date` (DATE) - Next election date

#### **Data Quality & Verification:**
- `data_quality_score` (INTEGER DEFAULT 0) - Quality score (0-100)
- `data_sources` (TEXT[]) - Array of data sources used
- `last_verified` (TIMESTAMP) - Last verification timestamp
- `verification_status` (VARCHAR(50) DEFAULT 'unverified') - Verification status

#### **Timestamps:**
- `created_at` (TIMESTAMP DEFAULT NOW()) - Record creation time
- `last_updated` (TIMESTAMP DEFAULT NOW()) - Last update time

---

## 🗃️ **ENHANCED DATA (JSONB COLUMNS)**

### **`enhanced_contacts` (JSONB)**
Stores multiple contact methods with source attribution.

**Structure:**
```json
[
  {
    "type": "website|email|phone|address|social_media",
    "value": "contact_value",
    "source": "congress-gov|wikipedia|openstates|google-civic",
    "isPrimary": boolean,
    "isVerified": boolean,
    "platform": "twitter|facebook|instagram|youtube" // for social_media
  }
]
```

**Example:**
```json
[
  {
    "type": "website",
    "value": "https://ocasio-cortez.house.gov/",
    "source": "congress-gov",
    "isPrimary": true,
    "isVerified": true
  },
  {
    "type": "phone",
    "value": "(202) 225-3965",
    "source": "congress-gov",
    "isPrimary": false,
    "isVerified": true
  }
]
```

### **`enhanced_photos` (JSONB)**
Stores multiple photos with metadata.

**Structure:**
```json
[
  {
    "url": "photo_url",
    "source": "wikipedia|congress-gov|openstates|google-civic",
    "width": integer,
    "height": integer,
    "altText": "alt_text",
    "attribution": "source_attribution",
    "isPrimary": boolean
  }
]
```

**Example:**
```json
[
  {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Alexandria_Ocasio-Cortez_Official_Portrait.jpg/330px-Alexandria_Ocasio-Cortez_Official_Portrait.jpg",
    "width": 320,
    "height": 400,
    "source": "wikipedia",
    "altText": "Wikipedia photo of Alexandria Ocasio-Cortez",
    "attribution": "Wikipedia"
  }
]
```

### **`enhanced_activity` (JSONB)**
Stores rich activity timeline with source attribution.

**Structure:**
```json
[
  {
    "type": "biography|election|bill_sponsored|voter_info|polling_location|ballot_contest|official_activity",
    "title": "activity_title",
    "description": "activity_description",
    "url": "activity_url",
    "date": "ISO_date_string",
    "source": "wikipedia|congress-gov|google-civic|openstates"
  }
]
```

**Example:**
```json
[
  {
    "type": "biography",
    "title": "Wikipedia: Alexandria Ocasio-Cortez",
    "description": "Alexandria Ocasio-Cortez, also known by her initials AOC...",
    "url": "https://en.wikipedia.org/wiki/Alexandria_Ocasio-Cortez",
    "date": "2025-10-08T15:46:47.416Z",
    "source": "wikipedia"
  },
  {
    "type": "election",
    "title": "Election: VIP Test Election",
    "description": "Election on 2031-12-06",
    "date": "2031-12-06",
    "source": "google-civic"
  }
]
```

### **`enhanced_social_media` (JSONB)**
Stores social media accounts with follower counts and verification status.

**Structure:**
```json
[
  {
    "platform": "twitter|facebook|instagram|youtube|linkedin",
    "handle": "social_media_handle",
    "url": "profile_url",
    "followersCount": integer,
    "isVerified": boolean,
    "source": "congress-gov|google-civic|openstates"
  }
]
```

---

## 🔍 **DATABASE INDEXES**

### **Performance Indexes:**
- `idx_representatives_core_bioguide_id` - Primary identifier lookup
- `idx_representatives_core_state` - State-based queries
- `idx_representatives_core_level` - Level-based filtering
- `idx_representatives_core_office` - Office-based filtering
- `idx_representatives_core_party` - Party-based filtering

### **JSONB Indexes (GIN):**
- `idx_representatives_core_enhanced_contacts` - Contact data queries
- `idx_representatives_core_enhanced_photos` - Photo data queries
- `idx_representatives_core_enhanced_activity` - Activity timeline queries
- `idx_representatives_core_enhanced_social_media` - Social media queries

---

## 🔌 **API DATA STRUCTURES**

### **Ingest API (`/api/civics/ingest`)**

#### **Request Structure:**
```json
{
  "representatives": [
    {
      "name": "Alexandria Ocasio-Cortez",
      "office": "US House",
      "level": "federal",
      "state": "NY",
      "party": "Democratic",
      "bioguide_id": "O000172",
      "fec_id": "H8NY15148",
      "term_start_date": "2021-01-03",
      "term_end_date": "2025-01-03",
      "next_election_date": "2024-11-05"
    }
  ]
}
```

#### **Response Structure:**
```json
{
  "success": true,
  "message": "Civics ingest completed",
  "results": {
    "processed": 1,
    "successful": 1,
    "failed": 0,
    "errors": [],
    "startTime": "2025-10-08T15:46:45.774Z",
    "duration": "2 seconds",
    "approach": "Simple - Direct API calls to JSONB storage with enhanced Google Civic"
  }
}
```

### **Retrieval API (`/api/civics/by-state`)**

#### **Request Parameters:**
- `state` (required) - State abbreviation
- `level` (optional) - federal, state, local
- `chamber` (optional) - us_senate, us_house, state_upper, state_lower
- `limit` (optional) - Maximum records to return (default: 50)

#### **Response Structure:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 3,
      "name": "Alexandria Ocasio-Cortez",
      "party": "Democratic",
      "office": "US House",
      "level": "federal",
      "state": "NY",
      "district": null,
      "bioguide_id": "O000172",
      "data_quality_score": 70,
      "data_sources": ["congress-gov", "wikipedia"],
      "verification_status": "verified",
      "contacts": [...], // enhanced_contacts
      "photos": [...],   // enhanced_photos
      "activity": [...], // enhanced_activity
      "social_media": [] // enhanced_social_media
    }
  ],
  "count": 1
}
```

---

## 📡 **EXTERNAL API INTEGRATION**

### **Data Sources:**
1. **Congress.gov API** - Federal representatives, official contacts, legislative activity
2. **Wikipedia API** - Biographical information, photos, biographical data
3. **Google Civic API** - Elections, voter info, polling locations, social media
4. **OpenStates API v3** - State legislators, legislative data (250/day limit)

### **Rate Limits:**
- **Congress.gov**: 5,000/day, 200/hour, 10/minute
- **Wikipedia**: 10,000/day, 500/hour, 20/minute
- **Google Civic**: 25,000/day, 1,000/hour, 50/minute
- **OpenStates**: 250/day, 10/hour, 1/minute (VERY LIMITED)

### **Data Quality Scoring:**
- **Congress.gov**: +30 points
- **Wikipedia**: +25 points
- **OpenStates**: +20 points
- **Google Civic**: +15 points
- **Contacts**: +10 points
- **Photos**: +5 points

---

## ✅ **VERIFICATION STATUS**

### **Database Verification:**
- ✅ Table exists and accessible
- ✅ JSONB columns working correctly
- ✅ Indexes created for performance
- ✅ Sample data verified

### **API Verification:**
- ✅ Ingest API working with enhanced data collection
- ✅ Retrieval API returning rich data
- ✅ Rate limiting functioning correctly
- ✅ Error handling robust

### **Data Quality Verification:**
- ✅ Enhanced contacts: 3 contacts per representative
- ✅ Enhanced photos: 1 Wikipedia photo per representative
- ✅ Enhanced activity: 4 activities per representative (biography + elections)
- ✅ Source attribution working correctly

---

## 🎯 **SCHEMA SUMMARY**

The civics database schema is designed for:

1. **Comprehensive Data Storage**: All representative data in a single table
2. **Enhanced Data**: Rich JSONB columns for contacts, photos, activity, social media
3. **Source Attribution**: Clear tracking of data sources and quality
4. **Performance**: Optimized indexes for fast queries
5. **Flexibility**: JSONB allows for evolving data structures
6. **API Integration**: Seamless integration with multiple external APIs

The schema successfully supports the civics ingestion system with enhanced Google Civic integration, providing rich, engaging data for user consumption.

---

**🎯 Current Status: VERIFIED AND PRODUCTION READY**

**📊 Schema Status: Complete with Enhanced JSONB Data Storage**

**🔌 API Status: Fully Functional with Rich Data Collection**

**✅ Verification: Database and APIs tested and working correctly**

