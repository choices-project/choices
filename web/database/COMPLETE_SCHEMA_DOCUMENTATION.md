# 🗄️ Complete Database Schema Documentation

**Generated**: 2025-10-02T03:17:10.391Z  
**Database**: https://[PROJECT-ID].supabase.co  
**Total Tables**: 50

## 📊 **SCHEMA OVERVIEW**

### **Table Summary**
| Table Name | Exists | Rows | RLS Status | Columns |
|------------|--------|------|------------|---------|
| polls | ✅ | 167 | ❌ DISABLED | 18 |
| votes | ✅ | 3 | ❌ DISABLED | 10 |
| user_profiles | ✅ | 3 | ❌ DISABLED | 19 |
| webauthn_credentials | ✅ | 0 | ❌ DISABLED | 0 |
| webauthn_challenges | ✅ | 0 | ❌ DISABLED | 0 |
| error_logs | ✅ | 0 | ❌ DISABLED | 0 |
| feedback | ✅ | 19 | ❌ DISABLED | 18 |
| user_consent | ✅ | 0 | ❌ DISABLED | 0 |
| privacy_logs | ✅ | 0 | ❌ DISABLED | 0 |
| location_consent_audit | ✅ | 0 | ❌ DISABLED | 0 |
| civics_person_xref | ✅ | 540 | ❌ DISABLED | 8 |
| civics_votes_minimal | ✅ | 2185 | ❌ DISABLED | 11 |
| civics_divisions | ✅ | 1172 | ❌ DISABLED | 7 |
| civics_representatives | ✅ | 1273 | ❌ DISABLED | 18 |
| civics_addresses | ✅ | 0 | ❌ DISABLED | 0 |
| civics_campaign_finance | ✅ | 0 | ❌ DISABLED | 0 |
| civics_votes | ✅ | 0 | ❌ DISABLED | 0 |
| civic_jurisdictions | ✅ | 4 | ❌ DISABLED | 17 |
| jurisdiction_aliases | ✅ | 3 | ❌ DISABLED | 9 |
| jurisdiction_geometries | ✅ | 0 | ❌ DISABLED | 0 |
| jurisdiction_tiles | ✅ | 3 | ❌ DISABLED | 6 |
| user_location_resolutions | ✅ | 0 | ❌ DISABLED | 0 |
| candidate_jurisdictions | ✅ | 0 | ❌ DISABLED | 0 |
| auth_users | ✅ | 0 | ❌ DISABLED | 0 |
| auth_sessions | ✅ | 0 | ❌ DISABLED | 0 |
| auth_identities | ✅ | 0 | ❌ DISABLED | 0 |
| auth_mfa_factors | ✅ | 0 | ❌ DISABLED | 0 |
| auth_mfa_challenges | ✅ | 0 | ❌ DISABLED | 0 |
| auth_audit_log_entries | ✅ | 0 | ❌ DISABLED | 0 |
| auth_flow_state | ✅ | 0 | ❌ DISABLED | 0 |
| storage_objects | ✅ | 0 | ❌ DISABLED | 0 |
| storage_buckets | ✅ | 0 | ❌ DISABLED | 0 |
| storage_migrations | ✅ | 0 | ❌ DISABLED | 0 |
| supabase_migrations | ✅ | 0 | ❌ DISABLED | 0 |
| supabase_migrations_schema_migrations | ✅ | 0 | ❌ DISABLED | 0 |
| poll_results_live_view | ✅ | 0 | ❌ DISABLED | 0 |
| poll_results_baseline_view | ✅ | 0 | ❌ DISABLED | 0 |
| poll_results_drift_view | ✅ | 0 | ❌ DISABLED | 0 |
| notifications | ✅ | 0 | ❌ DISABLED | 0 |
| user_preferences | ✅ | 0 | ❌ DISABLED | 0 |
| user_sessions | ✅ | 0 | ❌ DISABLED | 0 |
| api_keys | ✅ | 0 | ❌ DISABLED | 0 |
| webhooks | ✅ | 0 | ❌ DISABLED | 0 |
| integrations | ✅ | 0 | ❌ DISABLED | 0 |
| analytics_events | ✅ | 1 | ❌ DISABLED | 6 |
| audit_logs | ✅ | 0 | ❌ DISABLED | 0 |
| system_settings | ✅ | 0 | ❌ DISABLED | 0 |
| feature_flags | ✅ | 0 | ❌ DISABLED | 0 |
| rate_limits | ✅ | 0 | ❌ DISABLED | 0 |
| security_events | ✅ | 0 | ❌ DISABLED | 0 |

## 📋 **DETAILED TABLE SCHEMAS**

### **polls**

- **Exists**: Yes
- **Row Count**: 167
- **RLS Status**: DISABLED
- **Columns**: 18

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | 7a0f6664-f237-40ab-a59f-e53e7aa1a558 |
| title | string | No | Sample Poll: Climate Action |
| description | string | No | Which climate initiatives should be prioritized in... |
| options | object | No | Renewable Energy Investment,Carbon Tax Implementat... |
| voting_method | string | No | single |
| privacy_level | string | No | public |
| category | string | No | environment |
| tags | object | No | climate,environment,sustainability |
| created_by | string | No | 6f12e40c-fd46-4ace-9470-2016dc0e2e8b |
| status | string | No | active |
| total_votes | number | No | 2847 |
| participation | number | No | 78 |
| sponsors | object | No |  |
| created_at | string | No | 2025-09-09T06:30:29.711119+00:00 |
| updated_at | string | No | 2025-09-09T06:30:29.711119+00:00 |
| end_time | object | Yes | null |
| is_mock | boolean | No | false |
| settings | object | No | [object Object] |

#### **Sample Data**

```json
{
  "id": "7a0f6664-f237-40ab-a59f-e53e7aa1a558",
  "title": "Sample Poll: Climate Action",
  "description": "Which climate initiatives should be prioritized in the coming year?",
  "options": [
    "Renewable Energy Investment",
    "Carbon Tax Implementation",
    "Electric Vehicle Infrastructure",
    "Green Building Standards",
    "Public Transportation"
  ],
  "voting_method": "single",
  "privacy_level": "public",
  "category": "environment",
  "tags": [
    "climate",
    "environment",
    "sustainability"
  ],
  "created_by": "6f12e40c-fd46-4ace-9470-2016dc0e2e8b",
  "status": "active",
  "total_votes": 2847,
  "participation": 78,
  "sponsors": [],
  "created_at": "2025-09-09T06:30:29.711119+00:00",
  "updated_at": "2025-09-09T06:30:29.711119+00:00",
  "end_time": null,
  "is_mock": false,
  "settings": {}
}
```

---

### **votes**

- **Exists**: Yes
- **Row Count**: 3
- **RLS Status**: DISABLED
- **Columns**: 10

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | b1d69be2-4b0a-46ee-8eac-8b2c586288c3 |
| poll_id | string | No | 921e5b76-6852-4700-b98b-238ed2c130dc |
| user_id | string | No | 920f13c5-5cac-4e9f-b989-9e225a41b015 |
| choice | number | No | 2 |
| voting_method | string | No | approval |
| vote_data | object | No | [object Object] |
| verification_token | object | Yes | null |
| is_verified | boolean | No | true |
| created_at | string | No | 2025-09-18T02:07:36.251016+00:00 |
| updated_at | string | No | 2025-09-18T02:07:36.251016+00:00 |

#### **Sample Data**

```json
{
  "id": "b1d69be2-4b0a-46ee-8eac-8b2c586288c3",
  "poll_id": "921e5b76-6852-4700-b98b-238ed2c130dc",
  "user_id": "920f13c5-5cac-4e9f-b989-9e225a41b015",
  "choice": 2,
  "voting_method": "approval",
  "vote_data": {
    "approvals": [
      "0",
      "2"
    ]
  },
  "verification_token": null,
  "is_verified": true,
  "created_at": "2025-09-18T02:07:36.251016+00:00",
  "updated_at": "2025-09-18T02:07:36.251016+00:00"
}
```

---

### **user_profiles**

- **Exists**: Yes
- **Row Count**: 3
- **RLS Status**: DISABLED
- **Columns**: 19

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | 8758815b-1c03-4b03-959c-b9f5ef2bb33c |
| user_id | string | No | 6f12e40c-fd46-4ace-9470-2016dc0e2e8b |
| username | string | No | michaeltempesta@gmail.com |
| email | string | No | michaeltempesta@gmail.com |
| trust_tier | string | No | T0 |
| avatar_url | object | Yes | null |
| bio | object | Yes | null |
| is_active | boolean | No | true |
| created_at | string | No | 2025-09-09T06:30:29.711119+00:00 |
| updated_at | string | No | 2025-09-14T03:57:19.319135+00:00 |
| is_admin | boolean | No | true |
| geo_lat | object | Yes | null |
| geo_lon | object | Yes | null |
| geo_precision | object | Yes | null |
| geo_updated_at | object | Yes | null |
| geo_source | object | Yes | null |
| geo_consent_version | object | Yes | null |
| geo_coarse_hash | object | Yes | null |
| geo_trust_gate | string | No | all |

#### **Sample Data**

```json
{
  "id": "8758815b-1c03-4b03-959c-b9f5ef2bb33c",
  "user_id": "6f12e40c-fd46-4ace-9470-2016dc0e2e8b",
  "username": "michaeltempesta@gmail.com",
  "email": "michaeltempesta@gmail.com",
  "trust_tier": "T0",
  "avatar_url": null,
  "bio": null,
  "is_active": true,
  "created_at": "2025-09-09T06:30:29.711119+00:00",
  "updated_at": "2025-09-14T03:57:19.319135+00:00",
  "is_admin": true,
  "geo_lat": null,
  "geo_lon": null,
  "geo_precision": null,
  "geo_updated_at": null,
  "geo_source": null,
  "geo_consent_version": null,
  "geo_coarse_hash": null,
  "geo_trust_gate": "all"
}
```

---

### **webauthn_credentials**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **webauthn_challenges**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **error_logs**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **feedback**

- **Exists**: Yes
- **Row Count**: 19
- **RLS Status**: DISABLED
- **Columns**: 18

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | d3336504-3fb0-40c1-8905-71dce182b410 |
| user_id | object | Yes | null |
| poll_id | object | Yes | null |
| topic_id | object | Yes | null |
| type | string | No | general |
| rating | object | Yes | null |
| description | string | No | is this making it to the database? |
| metadata | object | No | [object Object] |
| created_at | string | No | 2025-08-19T01:29:08.413681+00:00 |
| ai_analysis | object | No | [object Object] |
| user_journey | object | No | [object Object] |
| screenshot | object | Yes | null |
| status | string | No | open |
| priority | string | No | medium |
| tags | object | No | general,positive-feedback,privacy-security |
| updated_at | string | No | 2025-08-19T01:29:08.413681+00:00 |
| sentiment | string | No | positive |
| title | string | No | test test |

#### **Sample Data**

```json
{
  "id": "d3336504-3fb0-40c1-8905-71dce182b410",
  "user_id": null,
  "poll_id": null,
  "topic_id": null,
  "type": "general",
  "rating": null,
  "description": "is this making it to the database?",
  "metadata": {
    "errors": [],
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "deviceInfo": {
      "os": "macOS",
      "type": "desktop",
      "browser": "Chrome",
      "language": "en-US",
      "timezone": "America/New_York",
      "viewportSize": "1680x928",
      "screenResolution": "1680x1050"
    },
    "sessionInfo": {
      "sessionId": "session_1755566923587_jmur7fdmb",
      "totalPageViews": 1,
      "sessionStartTime": "2025-08-19T01:28:43.587Z"
    },
    "feedbackContext": {
      "type": "general",
      "title": "test test",
      "source": "widget",
      "category": [
        "general",
        "privacy-security"
      ],
      "priority": "low",
      "severity": "minor",
      "sentiment": "positive",
      "timestamp": "2025-08-19T01:29:07.076Z",
      "aiAnalysis": {
        "intent": "",
        "urgency": 0,
        "category": "",
        "keywords": [],
        "sentiment": 0,
        "complexity": 0,
        "suggestedActions": []
      },
      "feedbackId": "feedback_1755566947076_47749ley9",
      "consoleLogs": [],
      "description": "is this making it to the database?\n",
      "userJourney": {
        "errors": [],
        "referrer": "https://vercel.com/",
        "pageTitle": "Choices - Democratic Polling Platform",
        "sessionId": "session_1755566923587_jmur7fdmb",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "deviceInfo": {
          "os": "macOS",
          "type": "desktop",
          "browser": "Chrome",
          "language": "en-US",
          "timezone": "America/New_York",
          "viewportSize": "1680x928",
          "screenResolution": "1680x1050"
        },
        "lastAction": "click:button:p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all bg-green-100",
        "timeOnPage": 0,
        "currentPage": "/",
        "currentPath": "https://choices-platform.vercel.app/",
        "pageLoadTime": 0,
        "viewportSize": "1680x928",
        "actionSequence": [
          "click:svg:[object SVGAnimatedString]",
          "click:button:p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all bg-gray-100",
          "click:input:w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "click:textarea:w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
          "click:button:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
          "click:button:p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all bg-green-100"
        ],
        "activeFeatures": [
          "pwa",
          "push-notifications",
          "intersection-observer",
          "resize-observer"
        ],
        "totalPageViews": 1,
        "isAuthenticated": false,
        "screenResolution": "1680x1050",
        "sessionStartTime": "2025-08-19T01:28:43.587Z",
        "performanceMetrics": {
          "cls": 0,
          "fcp": 1816
        }
      },
      "networkRequests": []
    },
    "performanceMetrics": {
      "cls": 0,
      "fcp": 1816
    }
  },
  "created_at": "2025-08-19T01:29:08.413681+00:00",
  "ai_analysis": {
    "intent": "",
    "urgency": 0,
    "category": "",
    "keywords": [],
    "sentiment": 0,
    "complexity": 0,
    "suggestedActions": []
  },
  "user_journey": {
    "errors": [],
    "referrer": "https://vercel.com/",
    "pageTitle": "Choices - Democratic Polling Platform",
    "sessionId": "session_1755566923587_jmur7fdmb",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "deviceInfo": {
      "os": "macOS",
      "type": "desktop",
      "browser": "Chrome",
      "language": "en-US",
      "timezone": "America/New_York",
      "viewportSize": "1680x928",
      "screenResolution": "1680x1050"
    },
    "lastAction": "click:button:p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all bg-green-100",
    "timeOnPage": 0,
    "currentPage": "/",
    "currentPath": "https://choices-platform.vercel.app/",
    "pageLoadTime": 0,
    "viewportSize": "1680x928",
    "actionSequence": [
      "click:svg:[object SVGAnimatedString]",
      "click:button:p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all bg-gray-100",
      "click:input:w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      "click:textarea:w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
      "click:button:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
      "click:button:p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all bg-green-100"
    ],
    "activeFeatures": [
      "pwa",
      "push-notifications",
      "intersection-observer",
      "resize-observer"
    ],
    "totalPageViews": 1,
    "isAuthenticated": false,
    "screenResolution": "1680x1050",
    "sessionStartTime": "2025-08-19T01:28:43.587Z",
    "performanceMetrics": {
      "cls": 0,
      "fcp": 1816
    }
  },
  "screenshot": null,
  "status": "open",
  "priority": "medium",
  "tags": [
    "general",
    "positive-feedback",
    "privacy-security"
  ],
  "updated_at": "2025-08-19T01:29:08.413681+00:00",
  "sentiment": "positive",
  "title": "test test"
}
```

---

### **user_consent**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **privacy_logs**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **location_consent_audit**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **civics_person_xref**

- **Exists**: Yes
- **Row Count**: 540
- **RLS Status**: DISABLED
- **Columns**: 8

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| person_id | string | No | 001d0776-ab93-49ac-be97-e2a7e6f93780 |
| bioguide | object | Yes | null |
| govtrack_id | object | Yes | null |
| openstates_id | object | Yes | null |
| fec_candidate_id | string | No | H0CA41094 |
| propublica_id | object | Yes | null |
| created_at | string | No | 2025-09-16T20:41:01.055261+00:00 |
| last_updated | string | No | 2025-09-16T20:41:01.055261+00:00 |

#### **Sample Data**

```json
{
  "person_id": "001d0776-ab93-49ac-be97-e2a7e6f93780",
  "bioguide": null,
  "govtrack_id": null,
  "openstates_id": null,
  "fec_candidate_id": "H0CA41094",
  "propublica_id": null,
  "created_at": "2025-09-16T20:41:01.055261+00:00",
  "last_updated": "2025-09-16T20:41:01.055261+00:00"
}
```

---

### **civics_votes_minimal**

- **Exists**: Yes
- **Row Count**: 2185
- **RLS Status**: DISABLED
- **Columns**: 11

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | number | No | 1 |
| person_id | string | No | 001d0776-ab93-49ac-be97-e2a7e6f93780 |
| vote_id | string | No | H269-2025 |
| bill_title | string | No | Honoring Our Heroes Act of 2025 |
| vote_date | string | No | 2025-09-16 |
| vote_position | string | No | yea |
| party_position | string | No | nay |
| chamber | string | No | house |
| data_source | string | No | govtrack_api_mock |
| last_updated | string | No | 2025-09-16T20:55:05.882598+00:00 |
| created_at | string | No | 2025-09-16T20:55:05.882598+00:00 |

#### **Sample Data**

```json
{
  "id": 1,
  "person_id": "001d0776-ab93-49ac-be97-e2a7e6f93780",
  "vote_id": "H269-2025",
  "bill_title": "Honoring Our Heroes Act of 2025",
  "vote_date": "2025-09-16",
  "vote_position": "yea",
  "party_position": "nay",
  "chamber": "house",
  "data_source": "govtrack_api_mock",
  "last_updated": "2025-09-16T20:55:05.882598+00:00",
  "created_at": "2025-09-16T20:55:05.882598+00:00"
}
```

---

### **civics_divisions**

- **Exists**: Yes
- **Row Count**: 1172
- **RLS Status**: DISABLED
- **Columns**: 7

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| ocd_division_id | string | No | ocd-division/country:us/state:ca/cd:28 |
| level | string | No | federal |
| chamber | string | No | us_house |
| state | string | No | CA |
| district_number | number | No | 28 |
| name | string | No | CA-CD28 |
| last_updated | string | No | 2025-09-16T11:40:29.872949+00:00 |

#### **Sample Data**

```json
{
  "ocd_division_id": "ocd-division/country:us/state:ca/cd:28",
  "level": "federal",
  "chamber": "us_house",
  "state": "CA",
  "district_number": 28,
  "name": "CA-CD28",
  "last_updated": "2025-09-16T11:40:29.872949+00:00"
}
```

---

### **civics_representatives**

- **Exists**: Yes
- **Row Count**: 1273
- **RLS Status**: DISABLED
- **Columns**: 18

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | 444cd2be-ad34-4aa9-928b-4efff61b7ffe |
| name | string | No | Rep. Ken Calvert [R-CA41] |
| party | string | No | Republican |
| office | string | No | U.S. Representative (CD 41) |
| level | string | No | federal |
| jurisdiction | string | No | US |
| district | object | Yes | null |
| ocd_division_id | string | No | ocd-division/country:us/state:ca/cd:41 |
| contact | object | No | [object Object] |
| raw_payload | object | No | [object Object] |
| last_updated | string | No | 2025-09-16T11:40:29.661064+00:00 |
| created_at | string | No | 2025-09-16T11:40:29.661064+00:00 |
| person_id | string | No | 001d0776-ab93-49ac-be97-e2a7e6f93780 |
| source | string | No | govtrack_api |
| external_id | string | No | C000059 |
| data_origin | string | No | api |
| valid_from | string | No | 2025-09-16T20:19:56.847993+00:00 |
| valid_to | string | No | infinity |

#### **Sample Data**

```json
{
  "id": "444cd2be-ad34-4aa9-928b-4efff61b7ffe",
  "name": "Rep. Ken Calvert [R-CA41]",
  "party": "Republican",
  "office": "U.S. Representative (CD 41)",
  "level": "federal",
  "jurisdiction": "US",
  "district": null,
  "ocd_division_id": "ocd-division/country:us/state:ca/cd:41",
  "contact": {
    "phone": "202-225-1986",
    "website": "https://calvert.house.gov"
  },
  "raw_payload": {
    "extra": {
      "office": "2205 Rayburn House Office Building",
      "address": "2205 Rayburn House Office Building Washington DC 20515-0541",
      "rss_url": "http://calvert.house.gov/news/rss.aspx"
    },
    "party": "Republican",
    "phone": "202-225-1986",
    "state": "CA",
    "title": "Rep.",
    "caucus": null,
    "person": {
      "link": "https://www.govtrack.us/congress/members/ken_calvert/400057",
      "name": "Rep. Ken Calvert [R-CA41]",
      "osid": "N00007099",
      "pvsid": null,
      "gender": "male",
      "cspanid": 26709,
      "namemod": "",
      "birthday": "1953-06-08",
      "lastname": "Calvert",
      "nickname": "",
      "sortname": "Calvert, Ken (Rep.) [R-CA41]",
      "firstname": "Ken",
      "twitterid": "KenCalvert",
      "youtubeid": "RepKenCalvert",
      "bioguideid": "C000059",
      "middlename": "S.",
      "gender_label": "Male",
      "fediverse_webfinger": null
    },
    "current": true,
    "enddate": "2027-01-03",
    "website": "https://calvert.house.gov",
    "district": 41,
    "role_type": "representative",
    "startdate": "2025-01-03",
    "title_long": "Representative",
    "description": "Representative for California's 41st congressional district",
    "senator_rank": null,
    "senator_class": null,
    "role_type_label": "Representative",
    "congress_numbers": [
      119
    ],
    "leadership_title": null
  },
  "last_updated": "2025-09-16T11:40:29.661064+00:00",
  "created_at": "2025-09-16T11:40:29.661064+00:00",
  "person_id": "001d0776-ab93-49ac-be97-e2a7e6f93780",
  "source": "govtrack_api",
  "external_id": "C000059",
  "data_origin": "api",
  "valid_from": "2025-09-16T20:19:56.847993+00:00",
  "valid_to": "infinity"
}
```

---

### **civics_addresses**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **civics_campaign_finance**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **civics_votes**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **civic_jurisdictions**

- **Exists**: Yes
- **Row Count**: 4
- **RLS Status**: DISABLED
- **Columns**: 17

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| ocd_division_id | string | No | ocd-division/country:us |
| name | string | No | United States |
| level | string | No | country |
| jurisdiction_type | object | Yes | null |
| parent_ocd_id | object | Yes | null |
| country_code | string | No | US |
| state_code | object | Yes | null |
| county_name | object | Yes | null |
| city_name | object | Yes | null |
| geo_scope | object | Yes | null |
| centroid_lat | object | Yes | null |
| centroid_lon | object | Yes | null |
| bounding_box | object | Yes | null |
| population | object | Yes | null |
| source | string | No | manual |
| last_refreshed | string | No | 2025-10-01T22:44:25.335079+00:00 |
| metadata | object | No | [object Object] |

#### **Sample Data**

```json
{
  "ocd_division_id": "ocd-division/country:us",
  "name": "United States",
  "level": "country",
  "jurisdiction_type": null,
  "parent_ocd_id": null,
  "country_code": "US",
  "state_code": null,
  "county_name": null,
  "city_name": null,
  "geo_scope": null,
  "centroid_lat": null,
  "centroid_lon": null,
  "bounding_box": null,
  "population": null,
  "source": "manual",
  "last_refreshed": "2025-10-01T22:44:25.335079+00:00",
  "metadata": {
    "population": 331000000
  }
}
```

---

### **jurisdiction_aliases**

- **Exists**: Yes
- **Row Count**: 3
- **RLS Status**: DISABLED
- **Columns**: 9

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | 2eb73732-70ec-434d-a63a-6a31bd6a1fb9 |
| alias_type | string | No | zip |
| alias_value | string | No | 94601 |
| normalized_value | object | Yes | null |
| ocd_division_id | string | No | ocd-division/country:us/state:ca/place:oakland |
| confidence | number | No | 0.95 |
| source | string | No | manual |
| last_refreshed | string | No | 2025-10-01T22:44:26.158016+00:00 |
| metadata | object | No | [object Object] |

#### **Sample Data**

```json
{
  "id": "2eb73732-70ec-434d-a63a-6a31bd6a1fb9",
  "alias_type": "zip",
  "alias_value": "94601",
  "normalized_value": null,
  "ocd_division_id": "ocd-division/country:us/state:ca/place:oakland",
  "confidence": 0.95,
  "source": "manual",
  "last_refreshed": "2025-10-01T22:44:26.158016+00:00",
  "metadata": {
    "imported_at": "2025-10-01T22:44:25.891Z"
  }
}
```

---

### **jurisdiction_geometries**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **jurisdiction_tiles**

- **Exists**: Yes
- **Row Count**: 3
- **RLS Status**: DISABLED
- **Columns**: 6

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| ocd_division_id | string | No | ocd-division/country:us/state:ca/place:oakland |
| h3_index | string | No | 88283082bffffff |
| resolution | number | No | 8 |
| source | string | No | generated |
| created_at | string | No | 2025-10-01T22:44:26.694244+00:00 |
| metadata | object | No | [object Object] |

#### **Sample Data**

```json
{
  "ocd_division_id": "ocd-division/country:us/state:ca/place:oakland",
  "h3_index": "88283082bffffff",
  "resolution": 8,
  "source": "generated",
  "created_at": "2025-10-01T22:44:26.694244+00:00",
  "metadata": {
    "generated_at": "2025-10-01T22:44:26.518Z"
  }
}
```

---

### **user_location_resolutions**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **candidate_jurisdictions**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_users**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_sessions**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_identities**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_mfa_factors**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_mfa_challenges**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_audit_log_entries**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **auth_flow_state**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **storage_objects**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **storage_buckets**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **storage_migrations**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **supabase_migrations**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **supabase_migrations_schema_migrations**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **poll_results_live_view**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **poll_results_baseline_view**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **poll_results_drift_view**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **notifications**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **user_preferences**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **user_sessions**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **api_keys**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **webhooks**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **integrations**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **analytics_events**

- **Exists**: Yes
- **Row Count**: 1
- **RLS Status**: DISABLED
- **Columns**: 6

#### **Columns**

| Column | Type | Nullable | Sample Value |
|--------|------|-----------|-------------|
| id | string | No | e5da1b00-a047-4185-9f52-1fa37b80f0c0 |
| event_type | string | No | vote |
| poll_id | string | No | test-rls-fix |
| user_id | object | Yes | null |
| metadata | object | No | [object Object] |
| created_at | string | No | 2025-08-16T00:12:36.624954+00:00 |

#### **Sample Data**

```json
{
  "id": "e5da1b00-a047-4185-9f52-1fa37b80f0c0",
  "event_type": "vote",
  "poll_id": "test-rls-fix",
  "user_id": null,
  "metadata": {
    "test": true
  },
  "created_at": "2025-08-16T00:12:36.624954+00:00"
}
```

---

### **audit_logs**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **system_settings**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **feature_flags**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **rate_limits**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

### **security_events**

- **Exists**: Yes
- **Row Count**: 0
- **RLS Status**: DISABLED
- **Columns**: 0


---

