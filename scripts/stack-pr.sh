#!/usr/bin/env bash
set -euo pipefail
BASE=${1:-main}   # or epic/branch
NAME=${2:?usage: stack-pr.sh <base> <new-branch>}
git fetch origin
git checkout -b "$NAME" "origin/$BASE"
git push -u origin "$NAME"
gh pr create --fill --base "$BASE" --title "chore(stack): ${NAME} [agent-0]" --body "**Date:** $(date -u +%F)"
