#!/usr/bin/env bash
set -euo pipefail

STAGE=${1:-dev}
PARAM_FILE="../configs/${STAGE}.env"
[[ -f "$PARAM_FILE" ]] || { echo "Missing $PARAM_FILE"; exit 1; }

PARAMS=()
has_supabase_auth_param=0
has_supabase_jwks_param=0
has_supabase_issuer_param=0

while IFS='=' read -r key value || [[ -n "${key:-}" ]]; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  export "$key"="$value"
  if [[ "$key" == "SupabaseAuthUrl" ]]; then
    has_supabase_auth_param=1
  elif [[ "$key" == "SupabaseJwksUrl" ]]; then
    has_supabase_jwks_param=1
  elif [[ "$key" == "SupabaseJwtIssuer" ]]; then
    has_supabase_issuer_param=1
  fi
  if [[ "$key" =~ ^[A-Za-z][A-Za-z0-9]+$ ]]; then
    PARAMS+=( "--parameters" "${key}=${value}" )
  fi
done < "$PARAM_FILE"

if [[ $has_supabase_auth_param -eq 0 && -n "${AUTH_HOST:-}" ]]; then
  PARAMS+=( "--parameters" "SupabaseAuthUrl=${AUTH_HOST}" )
fi

if [[ $has_supabase_jwks_param -eq 0 && -n "${AUTH_JWKS_URL:-}" ]]; then
  PARAMS+=( "--parameters" "SupabaseJwksUrl=${AUTH_JWKS_URL}" )
fi

if [[ $has_supabase_issuer_param -eq 0 && -n "${JWT_ISSUER:-}" ]]; then
  PARAMS+=( "--parameters" "SupabaseJwtIssuer=${JWT_ISSUER}" )
fi

if ((${#PARAMS[@]})); then
  npm run "deploy:${STAGE}" -- "${PARAMS[@]}" --profile rui-us
else
  npm run "deploy:${STAGE}" -- --profile rui-us
fi
