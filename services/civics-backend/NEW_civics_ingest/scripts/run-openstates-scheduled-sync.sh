#!/usr/bin/env sh
#
# Scheduled OpenStates API sync. Run from services/civics-backend/.
#
# PREFERRED: Use rate-limit-aware re-ingest (budget checks, maxReps, resume):
#   npm run reingest:scheduled
#
# LEGACY: This script runs committees → activity → events without budget awareness.
# For initial intake or when you want to run until rate limited.
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

# Use rate-limit-aware scheduler when available (checks budget, uses maxReps)
if [ -f "build/scripts/run-rate-limit-aware-reingest.js" ]; then
  log "Using rate-limit-aware re-ingest (recommended for daily cron)..."
  npm run reingest:scheduled || true
  log "Re-ingest finished."
  exit 0
fi

log "OpenStates scheduled sync (legacy) starting (committees → activity → events)."

log "Step 1/3: Committees (--resume)..."
npm run openstates:sync:committees -- --resume || true

log "Step 2/3: Activity (--resume)..."
npm run openstates:sync:activity -- --resume || true

log "Step 3/3: Events (--states=...)..."
npm run openstates:sync:events -- --states="$OPENSTATES_EVENT_STATES" || true

log "OpenStates scheduled sync finished."
