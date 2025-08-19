#!/bin/bash

# Script to populate the Choices system with sample data for testing
# This script creates sample polls and generates realistic voting data

echo "🎯 Populating Choices system with sample data..."

# Base URLs
IA_BASE_URL="http://localhost:8081/api"
PO_BASE_URL="http://localhost:8082/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local service_name=$1
    local url=$2
    
    echo -e "${BLUE}Checking $service_name...${NC}"
    if curl -s "$url/healthz" > /dev/null; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running${NC}"
        return 1
    fi
}

# Function to create a poll
create_poll() {
    local title=$1
    local description=$2
    local options=$3
    local start_time=$4
    local end_time=$5
    local sponsors=$6
    
    echo -e "${YELLOW}Creating poll: $title${NC}"
    
    local poll_data=$(cat <<EOF
{
    "title": "$title",
    "description": "$description",
    "options": $options,
    "start_time": "$start_time",
    "end_time": "$end_time",
    "sponsors": $sponsors
}
EOF
)
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$poll_data" \
        "$PO_BASE_URL/v1/polls")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ Poll created successfully${NC}"
        echo "$response" | jq -r '.id'
    else
        echo -e "${RED}❌ Failed to create poll${NC}"
        echo "$response"
        return 1
    fi
}

# Function to submit sample votes
submit_sample_votes() {
    local poll_id=$1
    local num_votes=$2
    
    echo -e "${YELLOW}Submitting $num_votes sample votes for poll $poll_id...${NC}"
    
    for i in $(seq 1 $num_votes); do
        # Generate a mock token (in real system, this would come from IA service)
        local mock_token="mock-token-$poll_id-$i"
        local mock_tag="mock-tag-$poll_id-$i"
        local choice=$((RANDOM % 4))  # Random choice 0-3
        
        local vote_data=$(cat <<EOF
{
    "token": "$mock_token",
    "tag": "$mock_tag",
    "choice": $choice
}
EOF
)
        
        local response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$vote_data" \
            "$PO_BASE_URL/v1/votes?poll_id=$poll_id")
        
        if echo "$response" | grep -q "success"; then
            echo -n "."
        else
            echo -e "${RED}x${NC}"
        fi
        
        # Small delay to avoid overwhelming the system
        sleep 0.1
    done
    
    echo -e "\n${GREEN}✅ Sample votes submitted${NC}"
}

# Check if services are running
echo -e "${BLUE}🔍 Checking if services are running...${NC}"

if ! check_service "IA Service" "$IA_BASE_URL"; then
    echo -e "${RED}Please start the IA service first${NC}"
    exit 1
fi

if ! check_service "PO Service" "$PO_BASE_URL"; then
    echo -e "${RED}Please start the PO service first${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All services are running!${NC}"

# Create sample polls
echo -e "\n${BLUE}📊 Creating sample polls...${NC}"

# Current time for poll scheduling
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_TIME=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME_1=$(date -u -d "+3 days" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME_2=$(date -u -d "+5 days" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME_3=$(date -u -d "+7 days" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME_4=$(date -u -d "+10 days" +"%Y-%m-%dT%H:%M:%SZ")

# Poll 1: Climate Action
CLIMATE_POLL_ID=$(create_poll \
    "Climate Action Priorities 2024" \
    "Help us determine the most important climate action initiatives for the coming year. Your vote will influence policy decisions and funding allocations." \
    '["Renewable Energy Investment", "Carbon Tax Implementation", "Public Transportation", "Green Building Standards"]' \
    "$START_TIME" \
    "$END_TIME_1" \
    '["Environmental Coalition", "Green Future Initiative"]')

# Poll 2: Technology Priorities
TECH_POLL_ID=$(create_poll \
    "Technology Development Priorities" \
    "Which technology areas should receive the most research and development funding? Your input will guide innovation strategy." \
    '["Artificial Intelligence", "Quantum Computing", "Cybersecurity", "Blockchain Technology"]' \
    "$START_TIME" \
    "$END_TIME_2" \
    '["Tech Innovation Council", "Digital Society Foundation"]')

# Poll 3: Community Budget
COMMUNITY_POLL_ID=$(create_poll \
    "Community Budget Allocation" \
    "How should we allocate the community budget for the next fiscal year? Your vote directly impacts local services and infrastructure." \
    '["Education & Schools", "Public Safety", "Parks & Recreation", "Infrastructure"]' \
    "$START_TIME" \
    "$END_TIME_3" \
    '["Community Council", "Local Government"]')

# Poll 4: Healthcare Access
HEALTHCARE_POLL_ID=$(create_poll \
    "Healthcare Access Improvement" \
    "Which healthcare initiatives should be prioritized to improve access and quality of care for our community?" \
    '["Telemedicine Expansion", "Mental Health Services", "Preventive Care", "Emergency Services"]' \
    "$START_TIME" \
    "$END_TIME_4" \
    '["Healthcare Alliance", "Public Health Department"]')

echo -e "\n${GREEN}✅ All sample polls created!${NC}"

# Submit sample votes for each poll
echo -e "\n${BLUE}🗳️  Submitting sample votes...${NC}"

if [ ! -z "$CLIMATE_POLL_ID" ]; then
    submit_sample_votes "$CLIMATE_POLL_ID" 1200
fi

if [ ! -z "$TECH_POLL_ID" ]; then
    submit_sample_votes "$TECH_POLL_ID" 980
fi

if [ ! -z "$COMMUNITY_POLL_ID" ]; then
    submit_sample_votes "$COMMUNITY_POLL_ID" 750
fi

if [ ! -z "$HEALTHCARE_POLL_ID" ]; then
    submit_sample_votes "$HEALTHCARE_POLL_ID" 1100
fi

# Test dashboard data
echo -e "\n${BLUE}📈 Testing dashboard endpoints...${NC}"

echo -e "${YELLOW}Testing dashboard data...${NC}"
DASHBOARD_RESPONSE=$(curl -s "$PO_BASE_URL/v1/dashboard")
if echo "$DASHBOARD_RESPONSE" | grep -q "polls"; then
    echo -e "${GREEN}✅ Dashboard data available${NC}"
else
    echo -e "${RED}❌ Dashboard data not available${NC}"
fi

echo -e "\n${BLUE}📊 Testing poll metrics...${NC}"
if [ ! -z "$CLIMATE_POLL_ID" ]; then
    METRICS_RESPONSE=$(curl -s "$PO_BASE_URL/v1/dashboard/metrics?poll_id=$CLIMATE_POLL_ID")
    if echo "$METRICS_RESPONSE" | grep -q "total_votes"; then
        echo -e "${GREEN}✅ Poll metrics available${NC}"
    else
        echo -e "${RED}❌ Poll metrics not available${NC}"
    fi
fi

# List all polls
echo -e "\n${BLUE}📋 Listing all polls...${NC}"
POLLS_RESPONSE=$(curl -s "$PO_BASE_URL/v1/polls/list")
if echo "$POLLS_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ Polls listed successfully${NC}"
    echo "$POLLS_RESPONSE" | jq -r '.[] | "\(.id): \(.title) (\(.status))"'
else
    echo -e "${RED}❌ Failed to list polls${NC}"
fi

echo -e "\n${GREEN}🎉 Sample data population complete!${NC}"
echo -e "${BLUE}You can now test the system with realistic data.${NC}"
echo -e "${YELLOW}📱 Try the web interface or mobile app to see the populated polls and analytics!${NC}"

