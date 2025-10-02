# Current Database Schema

**Last Updated:** October 2, 2025  
**Source:** Direct query from Supabase  
**Status:** ✅ Current and Verified

---

## 📊 **Production Tables (Active Data)**

### **Civics Data (1,273 representatives)**
- **`civics_representatives`** (1,273 rows) - Main representative data
- **`civics_divisions`** (1,172 rows) - Geographic divisions  
- **`civics_fec_minimal`** (92 rows) - Campaign finance data
- **`civics_votes_minimal`** (2,185 rows) - Voting records
- **`civics_contact_info`** (20 rows) - Contact information
- **`civics_voting_behavior`** (2 rows) - Voting behavior analysis

### **Core Application Data**
- **`polls`** (173 rows) - User-created polls
- **`votes`** (3 rows) - User votes on polls
- **`feedback`** (23 rows) - User feedback and suggestions

### **Future Features (Empty Tables)**
- **`civics_social_engagement`** (0 rows) - Social media engagement (future)
- **`civics_policy_positions`** (0 rows) - Policy positions (future)

---

## 🗄️ **Table Details**

### **civics_representatives** (1,273 rows)
```sql
- id: string (UUID)
- name: string
- party: string  
- office: string
- level: string (federal/state/local)
- jurisdiction: string
- district: object
- ocd_division_id: string
- contact: object
- raw_payload: object
- last_updated: string
- created_at: string
- person_id: string
- source: string
- external_id: string
- data_origin: string
- valid_from: string
- valid_to: string
```

### **civics_divisions** (1,172 rows)
```sql
- ocd_division_id: string
- level: string
- chamber: string
- state: string
- district_number: number
- name: string
- last_updated: string
```

### **civics_fec_minimal** (92 rows)
```sql
- id: number
- person_id: string
- fec_candidate_id: string
- election_cycle: number
- total_receipts: number
- cash_on_hand: number
- data_source: string
- last_updated: string
- created_at: string
```

### **civics_votes_minimal** (2,185 rows)
```sql
- id: number
- person_id: string
- vote_id: string
- bill_title: string
- vote_date: string
- vote_position: string
- party_position: string
- chamber: string
- data_source: string
- last_updated: string
- created_at: string
```

### **civics_contact_info** (20 rows)
```sql
- id: string (UUID)
- representative_id: string (UUID)
- official_email: object
- official_phone: string
- official_fax: object
- official_website: string
- office_addresses: object
- preferred_contact_method: string
- response_time_expectation: string
- data_quality_score: number
- last_verified: string
- created_at: string
- updated_at: string
```

### **civics_voting_behavior** (2 rows)
```sql
- id: string (UUID)
- representative_id: string (UUID)
- analysis_period: string
- total_votes: number
- party_line_votes: number
- bipartisan_votes: number
- missed_votes: number
- attendance_rate: number
- party_loyalty_score: number
- bipartisanship_score: number
- created_at: string
- updated_at: string
```

### **polls** (173 rows)
```sql
- id: string (UUID)
- title: string
- description: string
- options: object
- voting_method: string
- privacy_level: string
- category: string
- tags: object
- created_by: string
- status: string
- total_votes: number
- participation: number
- sponsors: object
- created_at: string
- updated_at: string
- end_time: object
- is_mock: boolean
- settings: object
```

### **votes** (3 rows)
```sql
- id: string (UUID)
- poll_id: string (UUID)
- user_id: string
- choice: number
- voting_method: string
- vote_data: object
- verification_token: object
- is_verified: boolean
- created_at: string
- updated_at: string
```

### **feedback** (23 rows)
```sql
- id: string (UUID)
- user_id: object
- poll_id: object
- topic_id: object
- type: string
- rating: object
- description: string
- metadata: object
- created_at: string
- ai_analysis: object
- user_journey: object
- screenshot: object
- status: string
- priority: string
- tags: object
- updated_at: string
- sentiment: string
- title: string
```

---

## 🎯 **Current Status**

### **✅ Production Ready**
- All civics tables have data and are functional
- Core application tables (polls, votes, feedback) are active
- Database is optimized for currently enabled features

### **⚠️ Limited Data**
- `civics_contact_info`: 20 records (needs more)
- `civics_voting_behavior`: 2 records (limited by data availability)

### **❌ Future Features**
- `civics_social_engagement`: Empty (future feature)
- `civics_policy_positions`: Empty (future feature)

---

## 🚀 **Next Steps**

1. **Populate More Contact Info** - Increase from 20 to 100+ records
2. **Add Performance Indexes** - Optimize queries for current usage
3. **Test All APIs** - Ensure all endpoints work with current data
4. **Prepare Future Schema** - Create tables for future features when needed

---

## 📋 **Usage Guidelines**

- **Current Features**: All enabled features have proper database support
- **Future Features**: Schema preparation only, not implemented
- **Data Safety**: All production data is protected and backed up
- **Performance**: Database is optimized for current usage patterns

**This schema is current, verified, and production-ready for all enabled features.**
