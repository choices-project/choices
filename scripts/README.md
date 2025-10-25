# OpenStates Database Population Script

This script processes the OpenStates YAML files and populates your database with **current representatives only** (no retired/historical data).

## 🚀 Quick Start

### 1. Set up your environment variables

Create a `.env.local` file in the project root with your Supabase credentials:

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Run the setup script

```bash
cd scripts
./setup-and-run.sh
```

That's it! The script will:
- Install required dependencies
- Process all OpenStates YAML files
- Populate your database with current representatives only
- Set up the ID crosswalk for your superior ingest pipeline

## 📊 What It Does

### ✅ Processes Only Current Representatives
- **Legislature**: Current senators and representatives
- **Executive**: Current governors and lieutenant governors  
- **Municipal**: Current mayors (if available)
- **Skips**: Retired, historical, and inactive representatives

### ✅ Populates All Tables
- `openstates_people_data` - Core person information
- `openstates_people_roles` - Current roles only
- `openstates_people_contacts` - Contact information
- `openstates_people_social_media` - Social media handles
- `openstates_people_sources` - Source URLs
- `openstates_people_identifiers` - External IDs
- `representatives_core` - Enhanced representative data
- `id_crosswalk` - Canonical ID mapping for superior pipeline

### ✅ Smart Filtering
- Only processes files from `legislature/` and `executive/` directories
- Filters out roles with end dates in the past
- Skips retired representatives
- Focuses on active, current office holders

## 📈 Expected Results

After running, you should see:
- **~5,000-8,000 current representatives** (varies by state)
- **All 50 states + DC + territories** processed
- **Clean, current data** ready for your superior ingest pipeline
- **ID crosswalk** populated for efficient API routing

## 🔧 Manual Setup (Alternative)

If you prefer to run manually:

```bash
# Install dependencies
npm install

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Run the script
node populate-openstates-current.js
```

## 🎯 Next Steps

After population:
1. **Test your superior ingest pipeline** with the ID crosswalk
2. **Verify data quality** with the verification queries
3. **Optimize performance** based on your usage patterns
4. **Scale up** to process additional data sources

## 🐛 Troubleshooting

### Common Issues:

1. **"OpenStates data directory not found"**
   - Make sure the YAML files are in the correct location
   - Check the path in the script configuration

2. **"Supabase connection failed"**
   - Verify your credentials in `.env.local`
   - Check that your Supabase project is active

3. **"Permission denied"**
   - Make sure the script is executable: `chmod +x setup-and-run.sh`

4. **"Module not found"**
   - Run `npm install` to install dependencies

## 📞 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your Supabase credentials
3. Ensure the OpenStates YAML files are accessible
4. Check that your database schema is properly set up

The script will provide detailed statistics and error reporting to help you troubleshoot any issues.