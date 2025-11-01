#!/bin/bash

# Process Monitoring Script
# Monitors for stuck development processes and kills them if necessary

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Monitoring development processes...${NC}"

# Function to check and kill stuck processes
check_and_kill_stuck_processes() {
    local process_name=$1
    local max_cpu=$2
    local max_memory=$3
    local max_runtime=$4
    
    echo -e "${YELLOW}Checking $process_name processes...${NC}"
    
    # Find processes matching the name
    local pids=$(pgrep -f "$process_name" 2>/dev/null)
    
    if [ -z "$pids" ]; then
        echo -e "${GREEN}✅ No $process_name processes running${NC}"
        return 0
    fi
    
    for pid in $pids; do
        # Get process info
        local info=$(ps -p $pid -o pid,ppid,etime,pcpu,pmem,command 2>/dev/null)
        
        if [ -z "$info" ]; then
            continue
        fi
        
        # Extract values
        local cpu=$(echo "$info" | tail -1 | awk '{print $4}' | sed 's/%//')
        local memory=$(echo "$info" | tail -1 | awk '{print $5}' | sed 's/%//')
        local runtime=$(echo "$info" | tail -1 | awk '{print $3}')
        
        # Convert runtime to minutes for comparison
        local runtime_minutes=0
        if [[ $runtime =~ ^([0-9]+):([0-9]+)$ ]]; then
            runtime_minutes=$((10#${BASH_REMATCH[1]} * 60 + 10#${BASH_REMATCH[2]}))
        elif [[ $runtime =~ ^([0-9]+)-([0-9]+):([0-9]+)$ ]]; then
            runtime_minutes=$((10#${BASH_REMATCH[1]} * 24 * 60 + 10#${BASH_REMATCH[2]} * 60 + 10#${BASH_REMATCH[3]}))
        fi
        
        # Check if process is stuck
        local should_kill=false
        local reason=""
        
        if (( $(echo "$cpu > $max_cpu" | bc -l) )); then
            should_kill=true
            reason="High CPU usage: ${cpu}%"
        fi
        
        if (( $(echo "$memory > $max_memory" | bc -l) )); then
            should_kill=true
            reason="High memory usage: ${memory}%"
        fi
        
        if [ $runtime_minutes -gt $max_runtime ]; then
            should_kill=true
            reason="Long runtime: ${runtime}"
        fi
        
        if [ "$should_kill" = true ]; then
            echo -e "${RED}⚠️  Killing stuck $process_name process (PID: $pid) - $reason${NC}"
            kill -9 $pid 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Successfully killed process $pid${NC}"
            else
                echo -e "${RED}❌ Failed to kill process $pid${NC}"
            fi
        else
            echo -e "${GREEN}✅ $process_name process $pid is healthy (CPU: ${cpu}%, Memory: ${memory}%, Runtime: ${runtime})${NC}"
        fi
    done
}

# Check for stuck processes
check_and_kill_stuck_processes "eslint" 200 10 5  # Max 200% CPU, 10% memory, 5 minutes
check_and_kill_stuck_processes "tsc" 150 15 10    # Max 150% CPU, 15% memory, 10 minutes
check_and_kill_stuck_processes "jest" 100 20 15   # Max 100% CPU, 20% memory, 15 minutes
check_and_kill_stuck_processes "playwright" 80 25 20  # Max 80% CPU, 25% memory, 20 minutes

echo -e "${GREEN}🎉 Process monitoring complete!${NC}"
