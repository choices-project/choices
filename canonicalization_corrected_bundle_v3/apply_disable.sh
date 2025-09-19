#!/usr/bin/env bash
set -euo pipefail
LIST="${1:-files_to_disable.txt}"
ROOT="."

echo "Applying .disabled to files listed in ${LIST} (relative to repo root: ${ROOT})"
while IFS= read -r p; do
  [[ -z "$p" || "$p" =~ ^# ]] && continue
  if [[ -f "${ROOT}/${p}" ]]; then
    mv "${ROOT}/${p}" "${ROOT}/${p}.disabled"
    echo "disabled: ${p}"
  else
    echo "skip (missing): ${p}"
  fi
done < "${LIST}"
