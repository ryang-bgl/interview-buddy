#!/usr/bin/env bash
set -euo pipefail

STAGE=${1:-dev}
PARAM_FILE="../configs/${STAGE}.env"
[[ -f "$PARAM_FILE" ]] || { echo "Missing $PARAM_FILE"; exit 1; }

PARAMS=()
while IFS='=' read -r key value || [[ -n "${key:-}" ]]; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  export "$key"="$value"
  if [[ "$key" =~ ^[A-Za-z][A-Za-z0-9]+$ ]]; then
    PARAMS+=( "--parameters" "${key}=${value}" )
  fi
done < "$PARAM_FILE"

if ((${#PARAMS[@]})); then
  npm run "deploy:${STAGE}" -- "${PARAMS[@]}" --profile rui-us
else
  npm run "deploy:${STAGE}" -- --profile rui-us
fi
