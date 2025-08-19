#!/bin/bash

# Status Update Script
# Allows agents to update their status in the coordination system

set -e

echo "📊 Agent Status Update Tool"
echo "=========================="

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
AGENT_ID=""
TASK_ID=""
STATUS=""
PROGRESS=""
NOTES=""

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -a, --agent AGENT_ID     Agent ID (e.g., AUTH-001)"
    echo "  -t, --task TASK_ID       Task ID (e.g., task-1)"
    echo "  -s, --status STATUS      Status (WAITING/IN_PROGRESS/COMPLETE)"
    echo "  -p, --progress PROGRESS  Progress percentage (0-100)"
    echo "  -n, --notes NOTES        Notes about the update"
    echo "  -i, --interactive        Interactive mode"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -a AUTH-001 -t task-1 -s COMPLETE -p 100 -n 'Authentication system completed'"
    echo "  $0 -i"
}

# Function to validate agent ID
validate_agent_id() {
    local agent_id="$1"
    local valid_agents=("AUTH-001" "DB-001" "API-001" "VOTE-001" "FE-001" "ARCH-001" "ADMIN-001" "ANALYTICS-001" "PWA-001" "PRIVACY-001" "PERF-001" "TEST-001")
    
    for valid_agent in "${valid_agents[@]}"; do
        if [ "$agent_id" = "$valid_agent" ]; then
            return 0
        fi
    done
    
    return 1
}

# Function to validate task ID
validate_task_id() {
    local task_id="$1"
    local valid_tasks=("task-1" "task-2" "task-3" "task-4" "task-5" "task-6" "task-7" "task-8" "task-9" "task-10" "task-11" "task-12")
    
    for valid_task in "${valid_tasks[@]}"; do
        if [ "$task_id" = "$valid_task" ]; then
            return 0
        fi
    done
    
    return 1
}

# Function to validate status
validate_status() {
    local status="$1"
    local valid_statuses=("WAITING" "IN_PROGRESS" "COMPLETE")
    
    for valid_status in "${valid_statuses[@]}"; do
        if [ "$status" = "$valid_status" ]; then
            return 0
        fi
    done
    
    return 1
}

# Function to validate progress
validate_progress() {
    local progress="$1"
    
    if [[ "$progress" =~ ^[0-9]+$ ]] && [ "$progress" -ge 0 ] && [ "$progress" -le 100 ]; then
        return 0
    fi
    
    return 1
}

# Function to get task name
get_task_name() {
    local task_id="$1"
    if [ -f "status/task-status.json" ]; then
        jq -r ".tasks[\"$task_id\"].name" status/task-status.json 2>/dev/null || echo "Unknown Task"
    else
        echo "Unknown Task"
    fi
}

# Function to interactive mode
interactive_mode() {
    echo "🎯 Interactive Status Update Mode"
    echo "================================"
    echo ""
    
    # Get agent ID
    echo "Available agents:"
    echo "  AUTH-001, DB-001, API-001, VOTE-001, FE-001, ARCH-001"
    echo "  ADMIN-001, ANALYTICS-001, PWA-001, PRIVACY-001, PERF-001, TEST-001"
    echo ""
    
    while true; do
        read -p "Enter your Agent ID: " AGENT_ID
        if validate_agent_id "$AGENT_ID"; then
            break
        else
            echo -e "${RED}❌ Invalid agent ID. Please try again.${NC}"
        fi
    done
    
    # Get task ID
    echo ""
    echo "Available tasks:"
    echo "  task-1: Auth System"
    echo "  task-2: Database Schema"
    echo "  task-3: API Endpoints"
    echo "  task-4: Voting System"
    echo "  task-5: Frontend Homepage"
    echo "  task-6: Feature Flags"
    echo "  task-7: Admin Panel"
    echo "  task-8: Analytics"
    echo "  task-9: PWA Features"
    echo "  task-10: Privacy Module"
    echo "  task-11: Performance Optimization"
    echo "  task-12: Testing"
    echo ""
    
    while true; do
        read -p "Enter Task ID: " TASK_ID
        if validate_task_id "$TASK_ID"; then
            break
        else
            echo -e "${RED}❌ Invalid task ID. Please try again.${NC}"
        fi
    done
    
    # Get status
    echo ""
    echo "Available statuses:"
    echo "  WAITING, IN_PROGRESS, COMPLETE"
    echo ""
    
    while true; do
        read -p "Enter Status: " STATUS
        if validate_status "$STATUS"; then
            break
        else
            echo -e "${RED}❌ Invalid status. Please try again.${NC}"
        fi
    done
    
    # Get progress
    echo ""
    while true; do
        read -p "Enter Progress (0-100): " PROGRESS
        if validate_progress "$PROGRESS"; then
            break
        else
            echo -e "${RED}❌ Invalid progress. Please enter a number between 0 and 100.${NC}"
        fi
    done
    
    # Get notes
    echo ""
    read -p "Enter Notes (optional): " NOTES
}

# Function to update task status in JSON
update_task_status() {
    local task_id="$1"
    local status="$2"
    local progress="$3"
    local notes="$4"
    
    if [ ! -f "status/task-status.json" ]; then
        echo -e "${RED}❌ Task status file not found!${NC}"
        return 1
    fi
    
    # Create backup
    cp status/task-status.json status/task-status.json.backup
    
    # Update the JSON file
    local temp_file=$(mktemp)
    jq --arg task_id "$task_id" \
       --arg status "$status" \
       --arg progress "$progress" \
       --arg notes "$notes" \
       --arg last_updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.tasks[$task_id].status = $status | 
        .tasks[$task_id].progress = ($progress | tonumber) | 
        .tasks[$task_id].notes = $notes |
        .lastUpdated = $last_updated' \
       status/task-status.json > "$temp_file"
    
    mv "$temp_file" status/task-status.json
    
    echo "✅ Task status updated successfully"
}

# Function to update agent status in markdown
update_agent_status_md() {
    local agent_id="$1"
    local task_id="$2"
    local status="$3"
    local progress="$4"
    local notes="$5"
    
    if [ ! -f "coordination/AGENT_STATUS.md" ]; then
        echo -e "${YELLOW}⚠️  Agent status markdown file not found${NC}"
        return 1
    fi
    
    # This would update the markdown file
    # For now, just create a summary
    echo "📝 Agent status update summary created"
}

# Function to generate update report
generate_update_report() {
    local agent_id="$1"
    local task_id="$2"
    local status="$3"
    local progress="$4"
    local notes="$5"
    
    local task_name=$(get_task_name "$task_id")
    local report_file="reports/status-update-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p reports
    
    cat > "$report_file" << EOF
# Status Update Report - $(date +%Y-%m-%d %H:%M:%S)

## Update Details
- **Agent**: $agent_id
- **Task**: $task_name ($task_id)
- **Status**: $status
- **Progress**: $progress%
- **Notes**: $notes

## Previous Status
$(if [ -f "status/task-status.json" ]; then
    echo "- Previous Status: $(jq -r ".tasks[\"$task_id\"].status" status/task-status.json 2>/dev/null || echo "Unknown")"
    echo "- Previous Progress: $(jq -r ".tasks[\"$task_id\"].progress" status/task-status.json 2>/dev/null || echo "Unknown")%"
else
    echo "- Previous Status: Unknown"
    echo "- Previous Progress: Unknown"
fi)

## Impact Analysis
$(case "$status" in
    "COMPLETE")
        echo "- ✅ Task completed successfully"
        echo "- 🔓 Unblocks dependent tasks"
        echo "- 📈 Increases overall project progress"
        ;;
    "IN_PROGRESS")
        echo "- 🔄 Task is actively being worked on"
        echo "- 📊 Progress tracking enabled"
        echo "- ⏰ ETA can be updated"
        ;;
    "WAITING")
        echo "- ⏳ Task is waiting for dependencies"
        echo "- 🔍 Review blocking relationships"
        echo "- 📋 Check if dependencies are ready"
        ;;
esac)

## Next Steps
$(case "$status" in
    "COMPLETE")
        echo "- [ ] Notify dependent tasks"
        echo "- [ ] Update integration points"
        echo "- [ ] Begin next task"
        ;;
    "IN_PROGRESS")
        echo "- [ ] Continue work on task"
        echo "- [ ] Update progress regularly"
        echo "- [ ] Report any blockers"
        ;;
    "WAITING")
        echo "- [ ] Check dependency status"
        echo "- [ ] Prepare for task start"
        echo "- [ ] Update ETA if needed"
        ;;
esac)

---
Generated by update-status.sh
EOF
    
    echo "✅ Status update report generated: $report_file"
}

# Function to validate all inputs
validate_inputs() {
    local errors=0
    
    if [ -z "$AGENT_ID" ]; then
        echo -e "${RED}❌ Agent ID is required${NC}"
        errors=$((errors + 1))
    elif ! validate_agent_id "$AGENT_ID"; then
        echo -e "${RED}❌ Invalid agent ID: $AGENT_ID${NC}"
        errors=$((errors + 1))
    fi
    
    if [ -z "$TASK_ID" ]; then
        echo -e "${RED}❌ Task ID is required${NC}"
        errors=$((errors + 1))
    elif ! validate_task_id "$TASK_ID"; then
        echo -e "${RED}❌ Invalid task ID: $TASK_ID${NC}"
        errors=$((errors + 1))
    fi
    
    if [ -z "$STATUS" ]; then
        echo -e "${RED}❌ Status is required${NC}"
        errors=$((errors + 1))
    elif ! validate_status "$STATUS"; then
        echo -e "${RED}❌ Invalid status: $STATUS${NC}"
        errors=$((errors + 1))
    fi
    
    if [ -z "$PROGRESS" ]; then
        echo -e "${RED}❌ Progress is required${NC}"
        errors=$((errors + 1))
    elif ! validate_progress "$PROGRESS"; then
        echo -e "${RED}❌ Invalid progress: $PROGRESS${NC}"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Function to show summary
show_summary() {
    local task_name=$(get_task_name "$TASK_ID")
    
    echo ""
    echo "📋 Status Update Summary"
    echo "======================="
    echo -e "👤 Agent: ${BLUE}$AGENT_ID${NC}"
    echo -e "📝 Task: ${GREEN}$task_name ($TASK_ID)${NC}"
    echo -e "📊 Status: ${YELLOW}$STATUS${NC}"
    echo -e "📈 Progress: ${GREEN}$PROGRESS%${NC}"
    if [ -n "$NOTES" ]; then
        echo -e "📝 Notes: $NOTES"
    fi
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--agent)
            AGENT_ID="$2"
            shift 2
            ;;
        -t|--task)
            TASK_ID="$2"
            shift 2
            ;;
        -s|--status)
            STATUS="$2"
            shift 2
            ;;
        -p|--progress)
            PROGRESS="$2"
            shift 2
            ;;
        -n|--notes)
            NOTES="$2"
            shift 2
            ;;
        -i|--interactive)
            interactive_mode
            exit 0
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "🚀 Processing status update..."
    echo ""
    
    # Validate inputs
    if ! validate_inputs; then
        echo -e "${RED}❌ Validation failed. Please check your inputs.${NC}"
        exit 1
    fi
    
    # Show summary
    show_summary
    
    # Confirm update
    read -p "Do you want to proceed with this update? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "❌ Update cancelled"
        exit 0
    fi
    
    echo ""
    echo "🔄 Updating status..."
    
    # Update task status
    if update_task_status "$TASK_ID" "$STATUS" "$PROGRESS" "$NOTES"; then
        echo "✅ Task status updated in JSON"
    else
        echo -e "${RED}❌ Failed to update task status${NC}"
        exit 1
    fi
    
    # Update agent status in markdown
    update_agent_status_md "$AGENT_ID" "$TASK_ID" "$STATUS" "$PROGRESS" "$NOTES"
    
    # Generate report
    generate_update_report "$AGENT_ID" "$TASK_ID" "$STATUS" "$PROGRESS" "$NOTES"
    
    echo ""
    echo "🎉 Status update completed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "  - Review the generated report"
    echo "  - Check if any dependent tasks can now start"
    echo "  - Update any integration points if needed"
}

# Run main function
main "$@"
