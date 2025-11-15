#!/usr/bin/env bash
set -euo pipefail

STAGE=${1:-dev}
PARAM_FILE="./secret-config/${STAGE}.env"
[[ -f "$PARAM_FILE" ]] || { echo "Missing $PARAM_FILE"; exit 1; }

PARAMS=()
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  PARAMS+=( "--parameters" "${key}=${value}" )
done < "$PARAM_FILE"
npm run "deploy:${STAGE}" -- "${PARAMS[@]}" --profile rui
