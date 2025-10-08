#!/bin/bash

# Monitor the batch reimport progress
echo "🔍 Monitoring batch reimport progress..."
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  clear
  echo "📊 BATCH REIMPORT MONITOR"
  echo "========================="
  echo ""
  
  # Check if process is running
  if pgrep -f "node batch-reimport.js" > /dev/null; then
    echo "✅ Reimport process is running"
  else
    echo "❌ Reimport process is not running"
  fi
  
  echo ""
  echo "📋 Recent log output:"
  echo "--------------------"
  tail -15 reimport.log
  
  echo ""
  echo "⏳ Waiting 5 seconds for next update..."
  sleep 5
done


# Monitor the batch reimport progress
echo "🔍 Monitoring batch reimport progress..."
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  clear
  echo "📊 BATCH REIMPORT MONITOR"
  echo "========================="
  echo ""
  
  # Check if process is running
  if pgrep -f "node batch-reimport.js" > /dev/null; then
    echo "✅ Reimport process is running"
  else
    echo "❌ Reimport process is not running"
  fi
  
  echo ""
  echo "📋 Recent log output:"
  echo "--------------------"
  tail -15 reimport.log
  
  echo ""
  echo "⏳ Waiting 5 seconds for next update..."
  sleep 5
done
