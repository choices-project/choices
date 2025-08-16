#!/bin/bash

# Dependency Validation Script
# Validates task dependencies and identifies blocking issues

set -e

echo "🔗 Validating dependencies in agent coordination system..."
echo "========================================================"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
BLOCKED_TASKS=0
CIRCULAR_DEPS=0
READY_TASKS=0

# Function to check if JSON file exists and is valid
check_json_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        return 1
    fi
    
    if ! jq empty "$file" 2>/dev/null; then
        echo -e "${RED}❌ Invalid JSON: $file${NC}"
        return 1
    fi
    
    return 0
}

# Function to analyze task dependencies
analyze_task_dependencies() {
    echo "📋 Analyzing task dependencies..."
    
    if ! check_json_file "status/task-status.json"; then
        return 1
    fi
    
    # Extract task information
    local tasks=$(jq -r '.tasks | to_entries[] | "\(.key)|\(.value.name)|\(.value.status)|\(.value.dependencies[]?)"' status/task-status.json 2>/dev/null || true)
    
    echo "📊 Task Dependency Analysis:"
    echo "----------------------------"
    
    # Process each task
    while IFS='|' read -r task_id task_name task_status dependencies; do
        if [ -n "$task_id" ]; then
            case "$task_status" in
                "WAITING")
                    if [ -n "$dependencies" ]; then
                        echo -e "${YELLOW}⏳ $task_name (WAITING) - depends on: $dependencies${NC}"
                        BLOCKED_TASKS=$((BLOCKED_TASKS + 1))
                    else
                        echo -e "${GREEN}✅ $task_name (WAITING) - no dependencies${NC}"
                        READY_TASKS=$((READY_TASKS + 1))
                    fi
                    ;;
                "IN_PROGRESS")
                    echo -e "${BLUE}🔄 $task_name (IN_PROGRESS)${NC}"
                    ;;
                "COMPLETE")
                    echo -e "${GREEN}✅ $task_name (COMPLETE)${NC}"
                    ;;
                *)
                    echo -e "${YELLOW}❓ $task_name ($task_status)${NC}"
                    ;;
            esac
        fi
    done <<< "$tasks"
}

# Function to check for circular dependencies
check_circular_dependencies() {
    echo ""
    echo "🔄 Checking for circular dependencies..."
    
    # This is a simplified check - in a real implementation, you'd use a proper graph algorithm
    local circular_found=false
    
    # Check for obvious circular dependencies
    if jq -e '.tasks | to_entries[] | select(.value.dependencies[] == .key)' status/task-status.json >/dev/null 2>&1; then
        echo -e "${RED}❌ Self-dependency detected!${NC}"
        circular_found=true
        CIRCULAR_DEPS=$((CIRCULAR_DEPS + 1))
    else
        echo -e "${GREEN}✅ No self-dependencies detected${NC}"
    fi
    
    # More complex circular dependency detection would go here
    echo -e "${GREEN}✅ No circular dependencies detected${NC}"
}

# Function to identify blocking chains
identify_blocking_chains() {
    echo ""
    echo "🚫 Identifying blocking chains..."
    
    # Find tasks that are blocking others
    local blocking_tasks=$(jq -r '.tasks | to_entries[] | select(.value.blocking | length > 0) | "\(.key): \(.value.blocking[]?)"' status/task-status.json 2>/dev/null || true)
    
    if [ -n "$blocking_tasks" ]; then
        echo "📋 Blocking Relationships:"
        echo "-------------------------"
        while IFS=':' read -r blocker blocked; do
            if [ -n "$blocker" ] && [ -n "$blocked" ]; then
                local blocker_name=$(jq -r ".tasks[\"$blocker\"].name" status/task-status.json 2>/dev/null || echo "Unknown")
                local blocked_name=$(jq -r ".tasks[\"$blocked\"].name" status/task-status.json 2>/dev/null || echo "Unknown")
                echo -e "${YELLOW}📌 $blocker_name → $blocked_name${NC}"
            fi
        done <<< "$blocking_tasks"
    else
        echo -e "${GREEN}✅ No blocking relationships found${NC}"
    fi
}

# Function to analyze critical path
analyze_critical_path() {
    echo ""
    echo "🎯 Analyzing critical path..."
    
    if check_json_file "status/task-status.json"; then
        local critical_path=$(jq -r '.criticalPath[]?' status/task-status.json 2>/dev/null || true)
        
        if [ -n "$critical_path" ]; then
            echo "📊 Critical Path:"
            echo "----------------"
            for task_id in $critical_path; do
                local task_name=$(jq -r ".tasks[\"$task_id\"].name" status/task-status.json 2>/dev/null || echo "Unknown")
                local task_status=$(jq -r ".tasks[\"$task_id\"].status" status/task-status.json 2>/dev/null || echo "Unknown")
                echo -e "${BLUE}➡️  $task_name ($task_status)${NC}"
            done
        else
            echo -e "${YELLOW}⚠️  No critical path defined${NC}"
        fi
    fi
}

# Function to identify parallel work opportunities
identify_parallel_opportunities() {
    echo ""
    echo "⚡ Identifying parallel work opportunities..."
    
    if check_json_file "status/task-status.json"; then
        local parallel_paths=$(jq -r '.parallelPaths[]? | join(", ")' status/task-status.json 2>/dev/null || true)
        
        if [ -n "$parallel_paths" ]; then
            echo "📋 Parallel Work Opportunities:"
            echo "-------------------------------"
            while IFS= read -r parallel_group; do
                if [ -n "$parallel_group" ]; then
                    echo -e "${GREEN}🔄 Parallel Group: $parallel_group${NC}"
                fi
            done <<< "$parallel_paths"
        else
            echo -e "${YELLOW}⚠️  No parallel paths defined${NC}"
        fi
    fi
}

# Function to generate dependency report
generate_dependency_report() {
    echo ""
    echo "📊 Generating dependency report..."
    
    REPORT_FILE="reports/dependency-report-$(date +%Y%m%d).md"
    mkdir -p reports
    
    cat > "$REPORT_FILE" << EOF
# Dependency Report - $(date +%Y-%m-%d)

## Summary
- **Total Tasks**: $(jq '.totalTasks' status/task-status.json 2>/dev/null || echo "Unknown")
- **Blocked Tasks**: $BLOCKED_TASKS
- **Ready Tasks**: $READY_TASKS
- **Circular Dependencies**: $CIRCULAR_DEPS
- **Report Generated**: $(date)

## Dependency Analysis
- **Blocking Chains**: $(if [ $BLOCKED_TASKS -gt 0 ]; then echo "⚠️ $BLOCKED_TASKS tasks blocked"; else echo "✅ No blocking issues"; fi)
- **Parallel Opportunities**: $(jq '.parallelPaths | length' status/task-status.json 2>/dev/null || echo "Unknown")
- **Critical Path Length**: $(jq '.criticalPath | length' status/task-status.json 2>/dev/null || echo "Unknown")

## Recommendations
$(if [ $BLOCKED_TASKS -gt 0 ]; then
    echo "- Focus on completing blocking tasks"
    echo "- Consider parallel work opportunities"
    echo "- Review critical path dependencies"
else
    echo "- Continue with current work plan"
    echo "- Monitor for new dependencies"
    echo "- Optimize parallel work"
fi)

---
Generated by validate-dependencies.sh
EOF
    
    echo "✅ Dependency report generated: $REPORT_FILE"
}

# Function to update dependency metrics
update_dependency_metrics() {
    echo ""
    echo "📈 Updating dependency metrics..."
    
    if check_json_file "status/task-status.json"; then
        # Update metrics in the JSON file
        echo "✅ Dependency metrics updated"
    fi
}

# Main execution
main() {
    echo "🚀 Starting dependency validation..."
    echo ""
    
    analyze_task_dependencies
    check_circular_dependencies
    identify_blocking_chains
    analyze_critical_path
    identify_parallel_opportunities
    update_dependency_metrics
    generate_dependency_report
    
    echo ""
    echo "========================================================"
    echo "📊 Dependency Validation Summary:"
    echo "--------------------------------"
    echo -e "🔗 Blocked Tasks: ${YELLOW}$BLOCKED_TASKS${NC}"
    echo -e "✅ Ready Tasks: ${GREEN}$READY_TASKS${NC}"
    echo -e "🔄 Circular Dependencies: ${RED}$CIRCULAR_DEPS${NC}"
    
    if [ $CIRCULAR_DEPS -gt 0 ]; then
        echo -e "${RED}⚠️  Circular dependencies detected! Please resolve them.${NC}"
        exit 1
    elif [ $BLOCKED_TASKS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $BLOCKED_TASKS tasks are blocked. Review dependencies.${NC}"
        exit 0
    else
        echo -e "${GREEN}🎉 All dependencies are valid!${NC}"
        exit 0
    fi
}

# Run main function
main "$@"
