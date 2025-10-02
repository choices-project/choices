# Current Feature Optimization Plan

**Created:** October 2, 2025  
**Branch:** `feature/improve-testing-and-implementation`  
**Status:** 🎯 Focus on Currently Enabled Features

---

## 🎯 **Current Feature Analysis**

### **✅ PRODUCTION READY (No Action Needed)**
These features have sufficient data and are working:

- **`CIVICS_REPRESENTATIVE_DATABASE`** ✅ - 1,273 representatives
- **`CIVICS_CAMPAIGN_FINANCE`** ✅ - 92 FEC records  
- **`CIVICS_VOTING_RECORDS`** ✅ - 2,185 voting records
- **`CANDIDATE_CARDS`** ✅ - 2 candidates available

### **⚠️ NEEDS OPTIMIZATION (Current Priority)**
These enabled features need more data to be fully functional:

- **`CIVICS_CONTACT_INFO`** ⚠️ - Only 5 records (need more)
- **`CIVICS_VOTING_BEHAVIOR`** ⚠️ - Only 2 records (need more)

### **❌ FUTURE FEATURES (Schema Only)**
These are disabled but need schema preparation:

- **`SOCIAL_SHARING`** ❌ - Empty tables (future feature)
- **`ADVANCED_PRIVACY`** ❌ - Empty tables (future feature)

---

## 🚀 **Immediate Action Plan**

### **Phase 1: Optimize Current Features (THIS SPRINT)**

#### **1.1 Populate Contact Info (HIGH PRIORITY)**
```sql
-- Populate more contact info from existing data
INSERT INTO civics_contact_info (representative_id, official_email, official_phone, official_website, office_addresses)
SELECT 
  id,
  contact->>'email',
  contact->>'phone', 
  contact->>'website',
  jsonb_build_array(contact->>'address')
FROM civics_representatives 
WHERE contact IS NOT NULL 
AND id NOT IN (SELECT representative_id FROM civics_contact_info);
```

#### **1.2 Populate Voting Behavior (HIGH PRIORITY)**
```sql
-- Calculate voting behavior for more representatives
INSERT INTO civics_voting_behavior (representative_id, analysis_period, total_votes, party_line_votes, attendance_rate, party_loyalty_score, bipartisanship_score)
SELECT 
  r.id,
  '2024',
  COUNT(v.*) as total_votes,
  COUNT(CASE WHEN v.vote_position = v.party_position THEN 1 END) as party_line_votes,
  100.0 as attendance_rate,
  ROUND((COUNT(CASE WHEN v.vote_position = v.party_position THEN 1 END)::numeric / COUNT(v.*)) * 100, 2) as party_loyalty_score,
  ROUND((COUNT(CASE WHEN v.vote_position != v.party_position THEN 1 END)::numeric / COUNT(v.*)) * 100, 2) as bipartisanship_score
FROM civics_representatives r
JOIN civics_votes_minimal v ON r.person_id = v.person_id
WHERE r.id NOT IN (SELECT representative_id FROM civics_voting_behavior)
GROUP BY r.id
HAVING COUNT(v.*) > 0;
```

#### **1.3 Add Performance Indexes (MEDIUM PRIORITY)**
```sql
-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_civics_representatives_level_jurisdiction ON civics_representatives(level, jurisdiction);
CREATE INDEX IF NOT EXISTS idx_civics_representatives_person_id ON civics_representatives(person_id);
CREATE INDEX IF NOT EXISTS idx_civics_votes_minimal_person_id ON civics_votes_minimal(person_id);
CREATE INDEX IF NOT EXISTS idx_civics_fec_minimal_person_id ON civics_fec_minimal(person_id);
```

### **Phase 2: Future Feature Schema (NEXT SPRINT)**

#### **2.1 Social Features Schema (PREPARATION ONLY)**
```sql
-- Create tables for future social features (empty for now)
CREATE TABLE IF NOT EXISTS social_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  platform TEXT NOT NULL,
  post_id TEXT,
  engagement_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_sharing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  platform TEXT NOT NULL,
  share_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2.2 Advanced Features Schema (PREPARATION ONLY)**
```sql
-- Create tables for future advanced features (empty for now)
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  ai_model TEXT NOT NULL,
  generation_prompt TEXT,
  generated_content JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privacy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  data_type TEXT NOT NULL,
  consent_level TEXT NOT NULL,
  anonymization_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 **Success Metrics**

### **Current Features (100% Required)**
- [ ] `civics_contact_info`: 100+ records (currently 5)
- [ ] `civics_voting_behavior`: 50+ records (currently 2)
- [ ] All API endpoints return correct data
- [ ] All tests pass with current features
- [ ] Performance is optimal

### **Future Features (Preparation)**
- [ ] Schema created for future features
- [ ] Migration scripts prepared
- [ ] Documentation complete
- [ ] Testing framework ready

---

## 🎯 **Implementation Priority**

### **THIS WEEK (Current Features)**
1. **Populate contact info** - Get 100+ contact records
2. **Populate voting behavior** - Get 50+ behavior records  
3. **Add performance indexes** - Optimize queries
4. **Test all APIs** - Ensure everything works

### **NEXT WEEK (Future Preparation)**
1. **Create future schemas** - Empty tables for future features
2. **Prepare migrations** - Scripts for when features are enabled
3. **Document requirements** - Clear documentation for future development
4. **Test framework** - Prepare testing for future features

**Focus: Ensure current features work 100% before expanding for future features!**
