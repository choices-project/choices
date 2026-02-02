#!/usr/bin/env sh
#
# Scheduled OpenStates API sync: committees → activity → events.
# Run from services/civics-backend/. Uses --resume so each run continues from
# checkpoint; safe to run repeatedly (cron, GitHub Actions).
#
# Env: LOGFILE (optional) — append logs to this file.
# Usage: sh NEW_civics_ingest/scripts/run-openstates-scheduled-sync.sh

set -e

# All state/local jurisdictions for events (exclude us = federal)
OPENSTATES_EVENT_STATES="ak,al,ar,az,ca,co,ct,dc,de,fl,ga,hi,ia,id,il,in,ks,ky,la,ma,md,me,mi,mn,mo,ms,mt,nc,nd,ne,nh,nj,nm,nv,ny,oh,ok,or,pa,pr,ri,sc,sd,tn,tx,ut,va,vt,wa,wi,wv,wy"

log() {
  if [ -n "${LOGFILE:-}" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOGFILE"
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

log "OpenStates scheduled sync starting (committees → activity → events)."

log "Step 1/3: Committees (--resume)..."
npm run openstates:sync:committees -- --resume || true

log "Step 2/3: Activity (--resume)..."
npm run openstates:sync:activity -- --resume || true

log "Step 3/3: Events (--states=...)..."
npm run openstates:sync:events -- --states="$OPENSTATES_EVENT_STATES" || true

log "OpenStates scheduled sync finished."
