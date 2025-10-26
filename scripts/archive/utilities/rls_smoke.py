#!/usr/bin/env python3
# RLS smoke test for Supabase REST. Exits non-zero on suspected misconfig.
# Env:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   RLS_TABLE (default: polls)
#   RLS_SELECT (default: id,privacy_level)

import os, sys, json, urllib.request
from urllib.error import HTTPError

URL = os.getenv("SUPABASE_URL")
ANON = os.getenv("SUPABASE_ANON_KEY")
SR = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TABLE = os.getenv("RLS_TABLE", "polls")
SELECT = os.getenv("RLS_SELECT", "id,privacy_level")

def fetch(url, key):
    req = urllib.request.Request(url, headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json"
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def try_fetch(url, key):
    try:
        return fetch(url, key), None
    except HTTPError as e:
        return None, e

def main():
    if not (URL and ANON and SR):
        print("Missing SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY", file=sys.stderr)
        return 2

    endpoint = f"{URL}/rest/v1/{TABLE}?select={SELECT}"
    anon_data, anon_err = try_fetch(endpoint, ANON)
    sr_data, sr_err = try_fetch(endpoint, SR)

    if sr_err:
        print(f"[FAIL] service_role request failed: {sr_err}", file=sys.stderr)
        return 1

    if anon_err:
        # 401/403 for anon is acceptable (locked down)
        if anon_err.code in (401, 403):
            print("[OK] anon blocked by RLS; service_role succeeded.")
            return 0
        print(f"[WARN] anon request unexpected error: {anon_err}", file=sys.stderr)
        # not fatal if service_role worked
        return 0

    # Both succeeded; ensure anon <= service_role
    anon_count = len(anon_data) if isinstance(anon_data, list) else 0
    sr_count = len(sr_data) if isinstance(sr_data, list) else 0

    if anon_count > sr_count:
        print(f"[FAIL] anon sees more rows ({anon_count}) than service_role ({sr_count})", file=sys.stderr)
        return 1

    # Optional heuristic: if privacy_level exists, ensure anon doesn't see 'private'
    if anon_count and isinstance(anon_data[0], dict) and "privacy_level" in anon_data[0]:
        privates = [r for r in anon_data if r.get("privacy_level") == "private"]
        if privates:
            print(f"[FAIL] anon sees private rows: {len(privates)}", file=sys.stderr)
            return 1

    print(f"[OK] RLS smoke: anon_count={anon_count}, service_role_count={sr_count}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
