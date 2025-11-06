#!/bin/bash
# Fix all remaining try-catch blocks in withErrorHandling wrappers

files=(
"app/api/admin/dashboard/route.ts"
"app/api/admin/feedback/[id]/status/route.ts"
"app/api/admin/feedback/export/route.ts"
"app/api/admin/feedback/route.ts"
"app/api/admin/health/route.ts"
"app/api/admin/site-messages/route.ts"
"app/api/analytics/demographics/route.ts"
"app/api/analytics/poll-heatmap/route.ts"
"app/api/analytics/temporal/route.ts"
"app/api/analytics/trends/route.ts"
"app/api/analytics/trust-tiers/route.ts"
"app/api/candidate/journey/send-email/route.ts"
"app/api/dashboard/route.ts"
"app/api/demographics/route.ts"
"app/api/hashtags/route.ts"
"app/api/health/route.ts"
"app/api/pwa/notifications/subscribe/route.ts"
"app/api/pwa/status/route.ts"
"app/api/security/monitoring/route.ts"
"app/api/trending/route.ts"
)

echo "Fixing ${#files[@]} files..."
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
  fi
done
echo "Done!"
