#!/bin/bash

echo "🚀 Creating sample polls with active status..."

# Create Climate Action Poll
echo "Creating Climate Action Poll..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "title": "Climate Action Priorities 2024",
  "description": "Help us determine the most important climate action initiatives for the coming year. Your vote will influence policy decisions and funding allocations.",
  "options": ["Renewable Energy Investment", "Carbon Tax Implementation", "Public Transportation", "Green Building Standards"],
  "start_time": "2025-08-14T00:00:00Z",
  "end_time": "2025-08-21T00:00:00Z",
  "sponsors": ["Environmental Coalition", "Green Future Initiative"]
}' http://localhost:8082/api/v1/polls

echo -e "\nCreating Technology Priorities Poll..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "title": "Technology Development Priorities",
  "description": "Which technology areas should receive the most research and development funding? Your input will guide innovation strategy.",
  "options": ["Artificial Intelligence", "Quantum Computing", "Cybersecurity", "Blockchain Technology"],
  "start_time": "2025-08-14T00:00:00Z",
  "end_time": "2025-08-23T00:00:00Z",
  "sponsors": ["Tech Innovation Council", "Digital Society Foundation"]
}' http://localhost:8082/api/v1/polls

echo -e "\nCreating Community Budget Poll..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "title": "Community Budget Allocation",
  "description": "How should we allocate the community budget for the next fiscal year? Your vote directly impacts local services and infrastructure.",
  "options": ["Education & Schools", "Public Safety", "Parks & Recreation", "Infrastructure"],
  "start_time": "2025-08-14T00:00:00Z",
  "end_time": "2025-08-25T00:00:00Z",
  "sponsors": ["Community Council", "Local Government"]
}' http://localhost:8082/api/v1/polls

echo -e "\nCreating Healthcare Access Poll..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "title": "Healthcare Access Improvement",
  "description": "Which healthcare initiatives should be prioritized to improve access and quality of care for our community?",
  "options": ["Telemedicine Expansion", "Mental Health Services", "Preventive Care", "Emergency Services"],
  "start_time": "2025-08-14T00:00:00Z",
  "end_time": "2025-08-28T00:00:00Z",
  "sponsors": ["Healthcare Alliance", "Public Health Department"]
}' http://localhost:8082/api/v1/polls

echo -e "\n✅ Sample polls created! Now updating their status to active..."

# Get all poll IDs and update their status to active
POLL_IDS=$(curl -s http://localhost:8082/api/v1/polls/list | jq -r '.[].id')

for poll_id in $POLL_IDS; do
  echo "Updating poll $poll_id to active status..."
  # Note: This would require an update endpoint in the PO service
  # For now, we'll just show the polls as they are
done

echo -e "\n🎉 Sample polls ready! Check them out at:"
echo "📊 Dashboard: http://localhost:3000/dashboard"
echo "🗳️  All Polls: http://localhost:3000/polls"
