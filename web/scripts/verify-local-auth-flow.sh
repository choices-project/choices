#!/usr/bin/env bash
# Auth security smoke: CSRF, login (no tokens in JSON), POST session, logout CSRF guard.
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

echo "== GET /api/auth/clear-session should be 405 =="
CLEAR_GET=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/clear-session")
[[ "$CLEAR_GET" == "405" ]] || { echo "FAIL clear-session GET=$CLEAR_GET"; exit 1; }

echo "== GET /api/auth/session should be 405 =="
SESSION_GET=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/session")
[[ "$SESSION_GET" == "405" ]] || { echo "FAIL session GET=$SESSION_GET"; exit 1; }

echo "== CSRF + login (no tokens in body) =="
CSRF_JSON=$(curl -sf -c "$JAR" "$BASE/api/auth/csrf")
CSRF_TOKEN=$(node -e "const j=JSON.parse(process.argv[1]);process.stdout.write(j.data?.csrfToken||'')" "$CSRF_JSON")
LOGIN_JSON=$(curl -sf -b "$JAR" -c "$JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" -H "x-csrf-token: $CSRF_TOKEN" \
  -d "{\"email\":\"${E2E_USER_EMAIL}\",\"password\":\"${E2E_USER_PASSWORD}\"}")
node -e "
const j=JSON.parse(process.argv[1]);
if(!(j.success||j.data?.user?.id)) { console.error('login failed', j); process.exit(1); }
const body=JSON.stringify(j);
if(body.includes('access_token')||body.includes('refresh_token')) {
  console.error('FAIL login response contains tokens');
  process.exit(1);
}
console.log('login ok user', j.data?.user?.id?.slice(0,8));
" "$LOGIN_JSON"

echo "== POST /api/auth/session with CSRF =="
SESSION_CODE=$(curl -s -o /tmp/choices-session.json -w "%{http_code}" -b "$JAR" -c "$JAR" \
  -X POST "$BASE/api/auth/session" \
  -H "Content-Type: application/json" -H "x-csrf-token: $CSRF_TOKEN")
[[ "$SESSION_CODE" == "200" ]] || { echo "FAIL session POST=$SESSION_CODE"; cat /tmp/choices-session.json; exit 1; }

echo "== POST /api/auth/logout with CSRF =="
LOGOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$JAR" -c "$JAR" \
  -X POST "$BASE/api/auth/logout" \
  -H "Content-Type: application/json" -H "x-csrf-token: $CSRF_TOKEN")
[[ "$LOGOUT_CODE" == "200" ]] || { echo "FAIL logout POST=$LOGOUT_CODE"; exit 1; }

POLLS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$JAR" "$BASE/polls")
echo "polls after logout=$POLLS_CODE (200 ok for public list)"
echo "OK: auth security smoke passed"
