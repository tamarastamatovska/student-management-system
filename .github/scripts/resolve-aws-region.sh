#!/usr/bin/env bash
# Resolve AWS region from GitHub secret (plain or base64-encoded).
#
# Store AWS_REGION as base64 to keep it a Secret without *** in job summaries:
#   echo -n 'eu-north-1' | base64   →   ZXUtbm9ydGgtMQ==
#
# Env: AWS_REGION_SECRET

set -euo pipefail

secret="${AWS_REGION_SECRET:?AWS_REGION_SECRET required}"

if decoded=$(printf '%s' "$secret" | base64 -d 2>/dev/null) && \
   printf '%s' "$decoded" | grep -qE '^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$'; then
  printf '%s' "$decoded"
else
  printf '%s' "$secret"
fi
