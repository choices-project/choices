#!/usr/bin/env bash
# Quick local smoke: CSRF → login → session → /feed (requires dev server + web/.env.local E2E_* creds).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env.local ]]; then
  echo "Missing web/.env.local (E2E_USER_EMAIL, E2E_USER_PASSWORD)" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env.local
set +a
BASE="${BASE_URL:-http://localhost:3000}"
JAR=$(mktemp)
trap 'rm -f "$JAR" /tmp/choices-session.json' EXIT
CSRF_JSON=$(curl -sf -c "$JAR" "$BASE/api/auth/csrf")
CSRF_TOKEN=$(node -e "const j=JSON.parse(process.argv[1]);process.stdout.write(j.data?.csrfToken||'')" "$CSRF_JSON")
LOGIN_JSON=$(curl -sf -b "$JAR" -c "$JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" -H "x-csrf-token: $CSRF_TOKEN" \
  -d "{\"email\":\"${E2E_USER_EMAIL}\",\"password\":\"${E2E_USER_PASSWORD}\"}")
node -e "const j=JSON.parse(process.argv[1]); if(!(j.success||j.data?.session)) { console.error('login failed'); process.exit(1) }" "$LOGIN_JSON"
SESSION_CODE=$(curl -s -o /tmp/choices-session.json -w "%{http_code}" -b "$JAR" "$BASE/api/auth/session")
FEED_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$JAR" "$BASE/feed")
echo "session=$SESSION_CODE feed=$FEED_CODE"
[[ "$SESSION_CODE" == "200" && "$FEED_CODE" == "200" ]] || exit 1
echo "OK: local auth flow"
