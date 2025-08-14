#!/bin/bash

# Simple test script to verify the Choices system is working
# This script tests basic functionality and displays sample data

echo "🧪 Testing Choices system..."

# Base URLs
IA_BASE_URL="http://localhost:8081/api"
PO_BASE_URL="http://localhost:8082/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test health endpoints
echo -e "${BLUE}🔍 Testing health endpoints...${NC}"

IA_HEALTH=$(curl -s "$IA_BASE_URL/../healthz")
if [ "$IA_HEALTH" = "ok" ]; then
    echo -e "${GREEN}✅ IA Service: Healthy${NC}"
else
    echo -e "${RED}❌ IA Service: Unhealthy${NC}"
fi

PO_HEALTH=$(curl -s "$PO_BASE_URL/../healthz")
if [ "$PO_HEALTH" = "ok" ]; then
    echo -e "${GREEN}✅ PO Service: Healthy${NC}"
else
    echo -e "${RED}❌ PO Service: Unhealthy${NC}"
fi

# Test polls list
echo -e "\n${BLUE}📋 Testing polls list...${NC}"
POLLS_RESPONSE=$(curl -s "$PO_BASE_URL/v1/polls/list")
if echo "$POLLS_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ Polls available${NC}"
    echo "$POLLS_RESPONSE" | jq -r '.[] | "  • \(.title) (\(.status))"'
else
    echo -e "${RED}❌ No polls available${NC}"
fi

# Test dashboard data
echo -e "\n${BLUE}📊 Testing dashboard data...${NC}"
DASHBOARD_RESPONSE=$(curl -s "$PO_BASE_URL/v1/dashboard")
if echo "$DASHBOARD_RESPONSE" | grep -q "polls"; then
    echo -e "${GREEN}✅ Dashboard data available${NC}"
    
    # Extract and display key metrics
    TOTAL_POLLS=$(echo "$DASHBOARD_RESPONSE" | jq -r '.overall_metrics.total_polls')
    ACTIVE_POLLS=$(echo "$DASHBOARD_RESPONSE" | jq -r '.overall_metrics.active_polls')
    TOTAL_VOTES=$(echo "$DASHBOARD_RESPONSE" | jq -r '.overall_metrics.total_votes')
    TOTAL_USERS=$(echo "$DASHBOARD_RESPONSE" | jq -r '.overall_metrics.total_users')
    
    echo -e "${YELLOW}📈 Key Metrics:${NC}"
    echo -e "  • Total Polls: $TOTAL_POLLS"
    echo -e "  • Active Polls: $ACTIVE_POLLS"
    echo -e "  • Total Votes: $TOTAL_VOTES"
    echo -e "  • Total Users: $TOTAL_USERS"
else
    echo -e "${RED}❌ Dashboard data not available${NC}"
fi

# Test geographic data
echo -e "\n${BLUE}🌍 Testing geographic data...${NC}"
GEO_RESPONSE=$(curl -s "$PO_BASE_URL/v1/dashboard/geographic")
if echo "$GEO_RESPONSE" | grep -q "regions"; then
    echo -e "${GREEN}✅ Geographic data available${NC}"
    echo "$GEO_RESPONSE" | jq -r '.regions[] | "  • \(.region): \(.vote_count) votes (\(.percentage)%)"'
else
    echo -e "${RED}❌ Geographic data not available${NC}"
fi

# Test demographics
echo -e "\n${BLUE}👥 Testing demographics...${NC}"
DEMO_RESPONSE=$(curl -s "$PO_BASE_URL/v1/dashboard/demographics")
if echo "$DEMO_RESPONSE" | grep -q "age_groups"; then
    echo -e "${GREEN}✅ Demographics data available${NC}"
    echo "$DEMO_RESPONSE" | jq -r '.age_groups | to_entries[] | "  • \(.key): \(.value) voters"'
else
    echo -e "${RED}❌ Demographics data not available${NC}"
fi

# Test engagement metrics
echo -e "\n${BLUE}📱 Testing engagement metrics...${NC}"
ENGAGE_RESPONSE=$(curl -s "$PO_BASE_URL/v1/dashboard/engagement")
if echo "$ENGAGE_RESPONSE" | grep -q "active_users"; then
    echo -e "${GREEN}✅ Engagement data available${NC}"
    ACTIVE_USERS=$(echo "$ENGAGE_RESPONSE" | jq -r '.active_users')
    NEW_USERS=$(echo "$ENGAGE_RESPONSE" | jq -r '.new_users')
    SESSION_DURATION=$(echo "$ENGAGE_RESPONSE" | jq -r '.session_duration')
    echo -e "${YELLOW}📈 Engagement Metrics:${NC}"
    echo -e "  • Active Users: $ACTIVE_USERS"
    echo -e "  • New Users: $NEW_USERS"
    echo -e "  • Avg Session Duration: ${SESSION_DURATION} minutes"
else
    echo -e "${RED}❌ Engagement data not available${NC}"
fi

echo -e "\n${GREEN}🎉 System test complete!${NC}"
echo -e "${BLUE}💡 You can now test the web interface or mobile app with this data.${NC}"

