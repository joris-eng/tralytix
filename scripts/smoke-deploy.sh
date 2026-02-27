#!/usr/bin/env bash
set -euo pipefail

WEB_URL="${1:-}"
API_URL="${2:-}"

if [[ -z "${WEB_URL}" || -z "${API_URL}" ]]; then
  echo "Usage: $0 <WEB_URL> <API_URL>"
  echo "Example: $0 https://tralytix-web.onrender.com https://tralytix-api.onrender.com"
  exit 1
fi

strip_trailing_slash() {
  local value="$1"
  echo "${value%/}"
}

WEB_URL="$(strip_trailing_slash "${WEB_URL}")"
API_URL="$(strip_trailing_slash "${API_URL}")"

retry_curl() {
  local url="$1"
  local label="$2"
  local attempts=20
  local sleep_sec=3

  echo "Checking ${label}: ${url}"
  for ((i=1; i<=attempts; i++)); do
    if curl --silent --show-error --fail --max-time 10 "${url}" >/tmp/tralytix-smoke-response.txt; then
      echo "OK - ${label}"
      return 0
    fi
    echo "Attempt ${i}/${attempts} failed for ${label}, retrying in ${sleep_sec}s..."
    sleep "${sleep_sec}"
  done

  echo "FAILED - ${label}"
  return 1
}

retry_curl "${API_URL}/health" "API /health"
retry_curl "${API_URL}/version" "API /version"
retry_curl "${WEB_URL}/api/backend/health" "Web proxy /api/backend/health"
retry_curl "${WEB_URL}/api/backend/version" "Web proxy /api/backend/version"
retry_curl "${WEB_URL}/login" "Web /login"

echo "Smoke checks passed."
