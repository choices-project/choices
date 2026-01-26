#!/bin/bash
# Monitor FEC enrichment running in background
# Usage: ./monitor-fec-background.sh

LOG_FILE="/tmp/fec-enrichment.log"
PID_FILE="/tmp/fec-enrichment.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ FEC enrichment is running (PID: $PID)"
        echo ""
        echo "📊 Latest output:"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file yet"
    else
        echo "❌ Process not running (PID: $PID)"
        rm -f "$PID_FILE"
    fi
else
    echo "⚠️  No PID file found. Process may not be running."
fi

echo ""
echo "To check status: npm run tools:check:fec-status"
echo "To view full log: tail -f $LOG_FILE"
