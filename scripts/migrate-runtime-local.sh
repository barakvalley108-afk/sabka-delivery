#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "$script_dir/.." && pwd)"

cd "$project_dir"

bash scripts/sites-env.sh -- wrangler d1 migrations apply \
  sabka-delivery-runtime-check \
  --config wrangler.runtime.jsonc \
  --local
