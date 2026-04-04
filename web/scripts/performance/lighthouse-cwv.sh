#!/usr/bin/env bash
# Run Lighthouse on key pages to measure Core Web Vitals (LCP, CLS, INP).
# Requires: dev server running (npm run dev) or pass production URL.
#
# Usage:
#   npm run dev &  # in another terminal
#   ./scripts/performance/lighthouse-cwv.sh
#
# Or with production URL:
#   ./scripts/performance/lighthouse-cwv.sh https://www.choices-app.com

set -e

BASE_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="_reports/lighthouse"
PATHS=("" "/feed" "/polls" "/civics" "/representatives")

mkdir -p "$OUTPUT_DIR"

echo "Measuring Core Web Vitals on $BASE_URL"
echo "Reports will be written to $OUTPUT_DIR/"
echo ""

for path in "${PATHS[@]}"; do
  url="${BASE_URL}${path}"
  name="${path:-landing}"
  name="${name#/}"
  echo "Running Lighthouse: $url"
  npx lighthouse "$url" \
    --only-categories=performance \
    --output=html \
    --output-path="$OUTPUT_DIR/${name}.html" \
    --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
    --quiet \
    || true
done

echo ""
echo "Done. Open $OUTPUT_DIR/*.html in a browser to view reports."
