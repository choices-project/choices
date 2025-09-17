# FEC API Setup Guide

## 🔑 Getting Your FEC API Key

The Federal Election Commission (FEC) provides free access to campaign finance data through their API. Here's how to get your API key:

### Step 1: Visit the FEC API Website
1. Go to [https://api.fec.gov/](https://api.fec.gov/)
2. Click **"Get an API Key"** button

### Step 2: Fill Out the Registration Form
The form requires:
- **Name**: Your full name
- **Email**: Your email address
- **Organization**: Your organization name (can be personal)
- **Purpose**: Brief description of how you'll use the data
- **Agreement**: Check the box to agree to terms

### Step 3: Receive Your API Key
- You'll receive your API key via email (usually within minutes)
- The key will look like: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

### Step 4: Add to Environment Variables
Add your API key to your `.env` file:

```bash
# Add this line to your .env file
FEC_API_KEY=your_actual_api_key_here
```

### Step 5: Test the Integration
Run the FEC integration script:

```bash
cd web
npm run tsx scripts/civics-fec-integration.ts
```

## 📊 What the FEC API Provides

### Campaign Finance Data
- **Total Receipts**: Total money raised by the candidate
- **Total Disbursements**: Total money spent by the candidate
- **Cash on Hand**: Current available funds
- **Debts Owed**: Outstanding debts

### Candidate Information
- **Candidate ID**: Unique FEC identifier
- **Name**: Candidate's name
- **Party**: Political party affiliation
- **Office**: Senate (S) or House (H)
- **State**: State abbreviation
- **District**: Congressional district (for House candidates)
- **Election Years**: Years the candidate ran for office
- **Cycles**: Election cycles (even years: 2024, 2026, etc.)

## 🔄 How Our Integration Works

### 1. Candidate Matching
- Searches FEC database for candidates matching our representatives
- Uses multiple search strategies (full name, first name, without titles)
- Filters by state and office type (Senate vs House)

### 2. Crosswalk Creation
- Links FEC candidate IDs to our canonical person records
- Updates the `civics_person_xref` table with FEC candidate IDs
- Ensures one-to-one mapping between representatives and FEC candidates

### 3. Financial Data Collection
- Fetches financial data for the current election cycle
- Stores minimal financial data in `civics_fec_minimal` table
- Includes total receipts, cash on hand, and election cycle

### 4. Data Quality
- Handles missing financial data gracefully
- Respects API rate limits with delays
- Provides detailed logging for troubleshooting

## 🚀 Running the Integration

### Prerequisites
- FEC API key set in environment variables
- Production guardrails migration applied
- Federal representatives already seeded

### Command
```bash
cd web
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
SUPABASE_SECRET_KEY=your_supabase_key \
FEC_API_KEY=your_fec_key \
npx tsx scripts/civics-fec-integration.ts
```

### Expected Output
```
💰 Starting FEC Campaign Finance Integration...

🔍 Testing FEC API connection...
✅ FEC API connection successful

🔗 Creating FEC candidate crosswalk...
📊 Found 253 federal representatives to process
✅ Linked Rep. Ken Calvert [R-CA41] to FEC candidate H0CA41094
✅ Upserted FEC data for candidate H0CA41094 cycle 2026
...

🎉 Created 245 FEC candidate crosswalks
🎉 FEC integration complete!
📊 Total FEC financial records: 245
```

## 🔍 Troubleshooting

### Common Issues

#### "FEC_API_KEY is required"
- Make sure you've added the API key to your `.env` file
- Restart your terminal/IDE after adding the key
- Check that the key is exactly as provided (no extra spaces)

#### "No FEC candidate found for [Name]"
- Some representatives might not have FEC records (e.g., appointed officials)
- The matching algorithm tries multiple strategies but might not find all matches
- This is normal and expected for some representatives

#### "FEC API error: 429"
- You've hit the rate limit (100 requests per hour)
- The script includes delays, but you might need to wait
- Consider running the script in smaller batches

#### "No person_id found for FEC candidate"
- The representative might not be in our database yet
- Run the federal seeding script first
- Check that the production guardrails migration was applied

### Data Quality Notes

- **Election Cycles**: FEC data is organized by election cycles (even years)
- **Current Cycle**: The script fetches data for the current election cycle
- **Missing Data**: Some candidates might not have financial data for all cycles
- **Data Freshness**: FEC data is updated regularly but not in real-time

## 📈 Next Steps

After running the FEC integration:

1. **Verify Data**: Check that financial data appears in representative profiles
2. **Update Frontend**: Enhance the UI to display campaign finance information
3. **Add Attribution**: Ensure proper attribution to FEC.gov in the UI
4. **Monitor Quality**: Set up monitoring for data freshness and quality

## 🔗 Useful Links

- [FEC API Documentation](https://api.fec.gov/)
- [FEC API Explorer](https://api.fec.gov/developers/)
- [Campaign Finance Data Guide](https://www.fec.gov/campaign-finance-data/)
- [API Rate Limits](https://api.fec.gov/developers/#/rate-limits)
