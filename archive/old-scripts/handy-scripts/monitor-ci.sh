#!/bin/bash

# CI Monitoring Script
# Automatically monitors GitHub Actions after pushes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="choices-project/choices"
BRANCH=$(git branch --show-current)
MAX_WAIT_TIME=300  # 5 minutes
CHECK_INTERVAL=10  # 10 seconds

echo -e "${BLUE}🔍 CI Monitor Starting...${NC}"
echo -e "${BLUE}Repository: ${REPO}${NC}"
echo -e "${BLUE}Branch: ${BRANCH}${NC}"
echo ""

# Function to get latest workflow run
get_latest_run() {
    local response=$(curl -s "https://api.github.com/repos/${REPO}/actions/runs?branch=${BRANCH}&per_page=1")
    echo "$response" | jq -r '.workflow_runs[0] // empty'
}

# Function to get run details
get_run_details() {
    local run_id=$1
    curl -s "https://api.github.com/repos/${REPO}/actions/runs/${run_id}"
}

# Function to get run logs
get_run_logs() {
    local run_id=$1
    local job_id=$2
    curl -s "https://api.github.com/repos/${REPO}/actions/runs/${run_id}/jobs/${job_id}/logs"
}

# Function to display status
display_status() {
    local status=$1
    local conclusion=$2
    local name=$3
    local created_at=$4
    
    echo -e "${BLUE}📊 Workflow: ${name}${NC}"
    echo -e "${BLUE}📅 Created: ${created_at}${NC}"
    
    case $status in
        "queued")
            echo -e "${YELLOW}⏳ Status: Queued${NC}"
            ;;
        "in_progress")
            echo -e "${BLUE}🔄 Status: In Progress${NC}"
            ;;
        "completed")
            case $conclusion in
                "success")
                    echo -e "${GREEN}✅ Status: Completed Successfully${NC}"
                    return 0
                    ;;
                "failure")
                    echo -e "${RED}❌ Status: Failed${NC}"
                    return 1
                    ;;
                "cancelled")
                    echo -e "${YELLOW}🚫 Status: Cancelled${NC}"
                    return 1
                    ;;
                *)
                    echo -e "${YELLOW}⚠️  Status: Completed (${conclusion})${NC}"
                    return 1
                    ;;
            esac
            ;;
        *)
            echo -e "${YELLOW}❓ Status: Unknown (${status})${NC}"
            return 1
            ;;
    esac
    
    return 2  # Still running
}

# Function to display job details
display_jobs() {
    local run_id=$1
    local run_details=$(get_run_details $run_id)
    
    echo ""
    echo -e "${BLUE}📋 Job Details:${NC}"
    
    local jobs=$(echo "$run_details" | jq -r '.jobs[] | "\(.id)|\(.name)|\(.status)|\(.conclusion)"')
    
    if [ -z "$jobs" ]; then
        echo "No jobs found"
        return
    fi
    
    while IFS='|' read -r job_id job_name job_status job_conclusion; do
        case $job_status in
            "completed")
                case $job_conclusion in
                    "success")
                        echo -e "  ${GREEN}✅ ${job_name}${NC}"
                        ;;
                    "failure")
                        echo -e "  ${RED}❌ ${job_name}${NC}"
                        ;;
                    *)
                        echo -e "  ${YELLOW}⚠️  ${job_name} (${job_conclusion})${NC}"
                        ;;
                esac
                ;;
            "in_progress")
                echo -e "  ${BLUE}🔄 ${job_name}${NC}"
                ;;
            "queued")
                echo -e "  ${YELLOW}⏳ ${job_name}${NC}"
                ;;
            *)
                echo -e "  ${YELLOW}❓ ${job_name} (${job_status})${NC}"
                ;;
        esac
    done <<< "$jobs"
}

# Function to display error details
display_errors() {
    local run_id=$1
    local run_details=$(get_run_details $run_id)
    
    echo ""
    echo -e "${RED}🔍 Error Analysis:${NC}"
    
    # Get failed jobs
    local failed_jobs=$(echo "$run_details" | jq -r '.jobs[] | select(.conclusion == "failure") | "\(.id)|\(.name)"')
    
    if [ -z "$failed_jobs" ]; then
        echo "No failed jobs found"
        return
    fi
    
    while IFS='|' read -r job_id job_name; do
        echo ""
        echo -e "${RED}❌ Failed Job: ${job_name}${NC}"
        echo -e "${BLUE}Job ID: ${job_id}${NC}"
        
        # Get job details
        local job_details=$(curl -s "https://api.github.com/repos/${REPO}/actions/runs/${run_id}/jobs/${job_id}")
        
        # Get steps
        local steps=$(echo "$job_details" | jq -r '.steps[] | "\(.name)|\(.status)|\(.conclusion)"')
        
        echo "Steps:"
        while IFS='|' read -r step_name step_status step_conclusion; do
            case $step_status in
                "completed")
                    case $step_conclusion in
                        "success")
                            echo -e "  ${GREEN}✅ ${step_name}${NC}"
                            ;;
                        "failure")
                            echo -e "  ${RED}❌ ${step_name}${NC}"
                            ;;
                        *)
                            echo -e "  ${YELLOW}⚠️  ${step_name} (${step_conclusion})${NC}"
                            ;;
                    esac
                    ;;
                *)
                    echo -e "  ${YELLOW}❓ ${step_name} (${step_status})${NC}"
                    ;;
            esac
        done <<< "$steps"
        
        # Show logs URL
        echo ""
        echo -e "${BLUE}📄 Logs: https://github.com/${REPO}/actions/runs/${run_id}/job/${job_id}${NC}"
        
    done <<< "$failed_jobs"
}

# Function to provide suggestions
provide_suggestions() {
    echo ""
    echo -e "${BLUE}💡 Suggestions:${NC}"
    echo "1. Check the logs for detailed error information"
    echo "2. Verify all TypeScript types are correct"
    echo "3. Ensure all imports are properly resolved"
    echo "4. Check for any missing dependencies"
    echo "5. Verify environment variables are set correctly"
    echo ""
    echo -e "${BLUE}🔧 Quick Fixes:${NC}"
    echo "• Run 'npm run lint' to check for linting issues"
    echo "• Run 'npm run type-check' to check TypeScript"
    echo "• Run 'npm run build' to test the build locally"
}

# Main monitoring loop
echo -e "${BLUE}🚀 Starting CI monitoring...${NC}"
echo ""

start_time=$(date +%s)
last_run_id=""

while true; do
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    
    if [ $elapsed_time -gt $MAX_WAIT_TIME ]; then
        echo -e "${YELLOW}⏰ Timeout reached (${MAX_WAIT_TIME}s). Stopping monitoring.${NC}"
        break
    fi
    
    # Get latest run
    latest_run=$(get_latest_run)
    
    if [ -z "$latest_run" ]; then
        echo -e "${YELLOW}⏳ No workflow runs found yet...${NC}"
        sleep $CHECK_INTERVAL
        continue
    fi
    
    # Extract run details
    run_id=$(echo "$latest_run" | jq -r '.id')
    status=$(echo "$latest_run" | jq -r '.status')
    conclusion=$(echo "$latest_run" | jq -r '.conclusion // empty')
    name=$(echo "$latest_run" | jq -r '.name')
    created_at=$(echo "$latest_run" | jq -r '.created_at')
    
    # Check if this is a new run
    if [ "$run_id" != "$last_run_id" ]; then
        echo ""
        echo -e "${BLUE}🆕 New workflow run detected!${NC}"
        last_run_id=$run_id
    fi
    
    # Clear previous lines and display status
    echo -en "\r\033[K"  # Clear line
    display_status "$status" "$conclusion" "$name" "$created_at"
    
    # Check if completed
    if [ "$status" = "completed" ]; then
        display_jobs "$run_id"
        
        if [ "$conclusion" = "success" ]; then
            echo ""
            echo -e "${GREEN}🎉 CI Pipeline completed successfully!${NC}"
            echo -e "${BLUE}🔗 View details: https://github.com/${REPO}/actions/runs/${run_id}${NC}"
            exit 0
        else
            display_errors "$run_id"
            provide_suggestions
            echo ""
            echo -e "${RED}💥 CI Pipeline failed!${NC}"
            echo -e "${BLUE}🔗 View details: https://github.com/${REPO}/actions/runs/${run_id}${NC}"
            exit 1
        fi
    fi
    
    # Show progress
    echo -e "${BLUE}⏱️  Elapsed: ${elapsed_time}s${NC}"
    echo -e "${BLUE}🔄 Checking again in ${CHECK_INTERVAL}s...${NC}"
    
    sleep $CHECK_INTERVAL
done

echo -e "${YELLOW}⏰ Monitoring timeout. Check manually: https://github.com/${REPO}/actions${NC}"
exit 1
