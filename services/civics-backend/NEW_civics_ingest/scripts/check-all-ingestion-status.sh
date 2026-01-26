#!/bin/bash
# Check status of all background ingestion processes
# Usage: ./check-all-ingestion-status.sh

echo "📊 Ingestion Status Check"
echo "=" | awk '{printf "%*s\n", 60, $0}' | tr ' ' '='
echo ""

# FEC Enrichment
echo "💰 FEC Enrichment:"
if [ -f /tmp/fec-enrichment.log ]; then
    echo "   Log: /tmp/fec-enrichment.log"
    tail -5 /tmp/fec-enrichment.log 2>/dev/null | sed 's/^/   /'
else
    echo "   No log file found"
fi
ps aux | grep -E "node.*fec|enrich-fec" | grep -v grep > /dev/null && echo "   ✅ Running" || echo "   ⏸️  Not running"
echo ""

# OpenStates Activity
echo "📜 OpenStates Activity:"
if [ -f /tmp/openstates-activity-final.log ]; then
    echo "   Log: /tmp/openstates-activity-final.log"
    tail -5 /tmp/openstates-activity-final.log 2>/dev/null | sed 's/^/   /'
else
    echo "   No log file found"
fi
ps aux | grep -E "node.*sync-activity" | grep -v grep > /dev/null && echo "   ✅ Running" || echo "   ⏸️  Not running"
echo ""

# OpenStates Committees
echo "🏛️  OpenStates Committees:"
if [ -f /tmp/openstates-committees-final.log ]; then
    echo "   Log: /tmp/openstates-committees-final.log"
    tail -5 /tmp/openstates-committees-final.log 2>/dev/null | sed 's/^/   /'
else
    echo "   No log file found"
fi
ps aux | grep -E "node.*sync-committees" | grep -v grep > /dev/null && echo "   ✅ Running" || echo "   ⏸️  Not running"
echo ""

# OpenStates Events
echo "📅 OpenStates Events:"
if [ -f /tmp/openstates-api-enrichment.log ]; then
    echo "   Log: /tmp/openstates-api-enrichment.log"
    tail -5 /tmp/openstates-api-enrichment.log 2>/dev/null | sed 's/^/   /'
else
    echo "   No log file found"
fi
echo ""

echo "=" | awk '{printf "%*s\n", 60, $0}' | tr ' ' '='
echo ""
echo "To check detailed status:"
echo "  npm run tools:check:fec-status"
echo "  npm run tools:check:openstates-status"
