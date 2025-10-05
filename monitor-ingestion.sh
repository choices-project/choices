#!/bin/bash

# Monitor data ingestion progress
echo "🔍 Monitoring data ingestion progress..."
echo "=========================================="

while true; do
    echo "$(date): Checking ingestion status..."
    
    # Get current status
    STATUS=$(curl -s http://localhost:3000/api/test/ingestion-status | jq -r '.status.ingestion.progress')
    
    if [ "$STATUS" != "null" ]; then
        STATES=$(echo "$STATUS" | jq -r '.statesWithData')
        REPS=$(echo "$STATUS" | jq -r '.totalRepresentatives')
        COVERAGE=$(echo "$STATUS" | jq -r '.coveragePercentage')
        MULTI_ID=$(echo "$STATUS" | jq -r '.multiIdPercentage')
        MULTI_SOURCE=$(echo "$STATUS" | jq -r '.multiSourcePercentage')
        
        echo "📊 Progress: $STATES/50 states ($COVERAGE%)"
        echo "👥 Representatives: $REPS"
        echo "🔗 Multi-ID coverage: $MULTI_ID%"
        echo "📡 Multi-source coverage: $MULTI_SOURCE%"
        echo "---"
    else
        echo "❌ Unable to get status"
    fi
    
    # Wait 30 seconds before next check
    sleep 30
done
