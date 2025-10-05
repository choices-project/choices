# FEC Campaign Finance Data Collection Strategy

## 🎯 **Objective**
Collect "who bought who" data from FEC for all federal candidates to enable accountability tracking.

## 📊 **Current Status**
- **2 representatives** in database (test data)
- **FEC API working** (tested with real candidates)
- **Need schema updates** for FEC data storage

## 🚀 **Implementation Plan**

### **Phase 1: Schema Enhancement**
1. **Add FEC columns** to `representatives_core` table
2. **Add indexes** for efficient FEC data queries
3. **Add documentation** for FEC fields

### **Phase 2: Data Collection Strategy**
1. **Federal Candidates First**
   - Use existing representatives with `level = 'federal'`
   - Search FEC API for each federal candidate
   - Store campaign finance data

2. **State Candidates**
   - Most state candidates won't have FEC data
   - Focus on federal races (President, Senate, House)
   - Use OpenStates for state-level data

3. **Bulk Collection Process**
   - Process all representatives in batches
   - Rate limit FEC API calls (1,000/day limit)
   - Update data sources to include 'fec'

### **Phase 3: Data Quality & Validation**
1. **Verify FEC data** is being stored correctly
2. **Check data completeness** for federal candidates
3. **Update quality scores** based on FEC data availability

## 🔧 **Technical Implementation**

### **FEC Data Fields to Collect**
- `fec_id` - FEC candidate identifier
- `total_receipts` - Total money raised
- `total_disbursements` - Total money spent
- `cash_on_hand` - Money remaining
- `individual_contributions` - Individual donations
- `pac_contributions` - PAC donations
- `party_contributions` - Party donations
- `self_financing` - Candidate's own money
- `fec_last_updated` - Last update timestamp

### **API Integration**
- **Search by name and state** for federal candidates
- **Get detailed totals** for each candidate
- **Handle rate limits** (1,000 requests/day)
- **Error handling** for missing candidates

## 📈 **Expected Results**
- **Federal candidates** with complete FEC data
- **Campaign finance transparency** for accountability
- **"Who bought who" tracking** for vote analysis
- **Enhanced data quality** scores

## 🎯 **Success Metrics**
- **FEC data coverage** for federal candidates
- **Data completeness** scores
- **Accountability tracking** capabilities
- **Campaign finance transparency**

## 🚀 **Next Steps**
1. **Run schema update** (`add-fec-schema.sql`)
2. **Test FEC collection** with real federal candidates
3. **Implement bulk collection** for all representatives
4. **Verify data quality** and completeness
