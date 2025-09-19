#!/usr/bin/env bash
set -euo pipefail
ROOT="."
echo "Reverting *.disabled files"
while IFS= read -r file; do
  orig="${file%.disabled}"
  if [[ -f "$file" ]]; then
    mv "$file" "$orig"
    echo "restored: $orig"
  fi
done < <(git ls-files -z | tr '\0' '\n' | grep '\.disabled$' || true)
