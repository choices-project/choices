# Database Improvement Plan

**Created:** October 2, 2025  
**Branch:** `feature/improve-testing-and-implementation`  
**Status:** 🚧 In Progress

---

## 🎯 **Current Database State Analysis**

### **✅ Well-Populated Tables:**
- `civics_representatives`: 1,273 records (main data)
- `civics_divisions`: 1,172 records (geographic data)
- `civics_fec_minimal`: 92 records (campaign finance)
- `civics_votes_minimal`: 2,185 records (voting records)

### **❌ Empty Tables Needing Attention:**
- `civics_campaign_finance`: 0 records (redundant with `civics_fec_minimal`)
- `civics_contact_info`: 0 records (should be populated from `civics_representatives.contact`)
- `civics_social_engagement`: 0 records (needs external data)
- `civics_voting_behavior`: 0 records (can be derived from `civics_votes_minimal`)
- `civics_policy_positions`: 0 records (needs external data)

---

## 🚀 **Improvement Strategy**

### **Phase 1: Data Consolidation (Immediate)**
1. **Populate `civics_contact_info`** from existing `civics_representatives.contact` data
2. **Derive `civics_voting_behavior`** from `civics_votes_minimal` data
3. **Remove redundant `civics_campaign_finance`** (use `civics_fec_minimal`)

### **Phase 2: Data Enhancement (Short-term)**
1. **Populate `civics_social_engagement`** with external API data
2. **Populate `civics_policy_positions`** with external API data
3. **Optimize table relationships** and add proper indexes

### **Phase 3: Performance Optimization (Medium-term)**
1. **Add proper indexes** for common queries
2. **Implement data archiving** for old records
3. **Add data quality monitoring**

---

## 📋 **Immediate Actions**

### **1. Populate Contact Info Table**
```sql
-- Extract contact info from civics_representatives
INSERT INTO civics_contact_info (representative_id, official_email, official_phone, official_website, office_addresses)
SELECT 
  id,
  contact->>'email',
  contact->>'phone', 
  contact->>'website',
  jsonb_build_array(contact->>'address')
FROM civics_representatives 
WHERE contact IS NOT NULL;
```

### **2. Derive Voting Behavior**
```sql
-- Calculate voting behavior from votes_minimal
INSERT INTO civics_voting_behavior (representative_id, analysis_period, total_votes, party_line_votes, attendance_rate)
SELECT 
  person_id,
  '2024',
  COUNT(*) as total_votes,
  COUNT(CASE WHEN vote_position = party_position THEN 1 END) as party_line_votes,
  ROUND(COUNT(*)::numeric / 100, 2) as attendance_rate
FROM civics_votes_minimal 
GROUP BY person_id;
```

### **3. Remove Redundant Tables**
```sql
-- Drop redundant civics_campaign_finance (use civics_fec_minimal instead)
DROP TABLE IF EXISTS civics_campaign_finance;
```

---

## 🎯 **Success Metrics**

- [ ] All empty tables populated with relevant data
- [ ] Redundant tables removed
- [ ] Proper relationships established
- [ ] Performance indexes added
- [ ] Data quality validated

---

## 📝 **Next Steps**

1. **Execute Phase 1 improvements** (data consolidation)
2. **Test API endpoints** with populated data
3. **Update tests** to reflect new data structure
4. **Monitor performance** and optimize queries
