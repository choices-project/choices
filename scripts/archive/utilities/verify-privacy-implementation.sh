#!/bin/bash

# Privacy Implementation Verification Script
# Created: January 19, 2025
# Purpose: Verify current database state and prepare for privacy migration

set -e

echo "🔒 Privacy Implementation Verification Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Supabase connection
check_supabase_connection() {
    print_status "INFO" "Checking Supabase connection..."
    
    if ! command_exists npx; then
        print_status "ERROR" "npx not found. Please install Node.js and npm."
        exit 1
    fi
    
    # Check if Supabase CLI is available
    if ! npx supabase --version >/dev/null 2>&1; then
        print_status "ERROR" "Supabase CLI not found. Please install it first."
        exit 1
    fi
    
    # Check if project is linked
    if ! npx supabase projects list >/dev/null 2>&1; then
        print_status "ERROR" "Supabase project not linked. Please run 'npx supabase link' first."
        exit 1
    fi
    
    print_status "SUCCESS" "Supabase connection verified"
}

# Function to check environment variables
check_environment() {
    print_status "INFO" "Checking environment variables..."
    
    # Source environment variables from .env.local
    if [ -f "web/.env.local" ]; then
        source web/.env.local
        print_status "SUCCESS" "Environment file loaded"
    else
        print_status "WARNING" "Environment file not found"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        print_status "WARNING" "NEXT_PUBLIC_SUPABASE_URL not set"
    else
        print_status "SUCCESS" "NEXT_PUBLIC_SUPABASE_URL is set"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        print_status "WARNING" "NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    else
        print_status "SUCCESS" "NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_status "WARNING" "SUPABASE_SERVICE_ROLE_KEY not set"
    else
        print_status "SUCCESS" "SUPABASE_SERVICE_ROLE_KEY is set"
    fi
}

# Function to check current database state
check_database_state() {
    print_status "INFO" "Checking current database state..."
    
    # Create temporary SQL file for verification
    cat > /tmp/verify_privacy.sql << 'EOF'
-- Check if dangerous location fields exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE 'geo_%'
ORDER BY column_name;

-- Check if dangerous fields have data
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN geo_lat IS NOT NULL THEN 1 END) as users_with_lat,
    COUNT(CASE WHEN geo_lon IS NOT NULL THEN 1 END) as users_with_lon,
    COUNT(CASE WHEN geo_lat IS NOT NULL AND geo_lon IS NOT NULL THEN 1 END) as users_with_both
FROM user_profiles;

-- Check if privacy tables already exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_location_privacy', 'privacy_zones', 'privacy_audit_log');

-- Check current user count
SELECT COUNT(*) as total_users FROM user_profiles;
EOF

    # Execute verification queries
    if npx supabase db inspect --schema public >/dev/null 2>&1; then
        print_status "SUCCESS" "Database connection successful"
        
        # Check if we can run SQL queries
        if npx supabase db inspect --schema public --table user_profiles >/dev/null 2>&1; then
            print_status "SUCCESS" "user_profiles table accessible"
        else
            print_status "WARNING" "Cannot access user_profiles table"
        fi
    else
        print_status "ERROR" "Cannot connect to database"
        exit 1
    fi
}

# Function to check migration readiness
check_migration_readiness() {
    print_status "INFO" "Checking migration readiness..."
    
    # Check if migration file exists
    if [ -f "supabase/migrations/20250119000006_remove_precise_location_data.sql" ]; then
        print_status "SUCCESS" "Privacy migration file exists"
    else
        print_status "ERROR" "Privacy migration file not found"
        exit 1
    fi
    
    # Check if privacy service exists
    if [ -f "web/lib/privacy/location-privacy-service.ts" ]; then
        print_status "SUCCESS" "Privacy service file exists"
    else
        print_status "ERROR" "Privacy service file not found"
        exit 1
    fi
    
    # Check if TypeScript types are ready
    if [ -f "web/lib/types/database.ts" ]; then
        print_status "SUCCESS" "Database types file exists"
    else
        print_status "ERROR" "Database types file not found"
        exit 1
    fi
}

# Function to check application code
check_application_code() {
    print_status "INFO" "Checking application code..."
    
    # Check if dangerous fields are used in code
    if grep -r "geo_lat\|geo_lon" web/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
        print_status "WARNING" "Dangerous location fields found in code"
        echo "Files containing geo_lat/geo_lon:"
        grep -r "geo_lat\|geo_lon" web/ --include="*.ts" --include="*.tsx" | head -10
    else
        print_status "SUCCESS" "No dangerous location fields found in code"
    fi
    
    # Check if privacy service is imported anywhere
    if grep -r "location-privacy-service" web/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
        print_status "SUCCESS" "Privacy service is being used"
    else
        print_status "WARNING" "Privacy service not yet integrated"
    fi
}

# Function to create backup verification
create_backup_verification() {
    print_status "INFO" "Creating backup verification..."
    
    # Create backup verification SQL
    cat > /tmp/backup_verification.sql << 'EOF'
-- Create backup of dangerous location data
CREATE TABLE IF NOT EXISTS user_location_backup AS
SELECT 
    user_id,
    geo_lat,
    geo_lon,
    geo_precision,
    geo_source,
    geo_trust_gate,
    geo_coarse_hash,
    geo_consent_version,
    geo_updated_at,
    created_at
FROM user_profiles 
WHERE geo_lat IS NOT NULL OR geo_lon IS NOT NULL;

-- Verify backup was created
SELECT COUNT(*) as backed_up_users FROM user_location_backup;
EOF

    print_status "SUCCESS" "Backup verification SQL created"
}

# Function to run final verification
run_final_verification() {
    print_status "INFO" "Running final verification..."
    
    # Check project status
    if npx supabase projects list | grep -q "choices-voting-v2"; then
        print_status "SUCCESS" "Supabase project linked: choices-voting-v2"
    else
        print_status "ERROR" "Supabase project not linked"
        exit 1
    fi
    
    # Check if we can access the database
    if npx supabase db inspect --schema public >/dev/null 2>&1; then
        print_status "SUCCESS" "Database access confirmed"
    else
        print_status "ERROR" "Cannot access database"
        exit 1
    fi
}

# Main execution
main() {
    echo "Starting privacy implementation verification..."
    echo ""
    
    # Step 1: Check Supabase connection
    check_supabase_connection
    echo ""
    
    # Step 2: Check environment variables
    check_environment
    echo ""
    
    # Step 3: Check database state
    check_database_state
    echo ""
    
    # Step 4: Check migration readiness
    check_migration_readiness
    echo ""
    
    # Step 5: Check application code
    check_application_code
    echo ""
    
    # Step 6: Create backup verification
    create_backup_verification
    echo ""
    
    # Step 7: Run final verification
    run_final_verification
    echo ""
    
    print_status "SUCCESS" "Privacy implementation verification completed!"
    echo ""
    echo "Next steps:"
    echo "1. Review the verification results above"
    echo "2. If all checks pass, proceed with migration"
    echo "3. Run: npx supabase db push"
    echo "4. Verify migration success"
    echo "5. Update application code"
    echo "6. Test privacy implementation"
    echo ""
    echo "For any issues, check the logs above and contact support."
}

# Run main function
main "$@"
