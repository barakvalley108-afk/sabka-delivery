#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec bash "${script_dir}/sites-env.sh" -- bash "$0" "$@"
fi

command -v timeout >/dev/null || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Removing runtime DB migrations..."
node "${script_dir}/patch-runtime-db-init.mjs"

echo "Reducing Worker polling load..."
node "${script_dir}/patch-worker-load.mjs"

echo "Reducing Super Admin payload and fixing Retry..."
node "${script_dir}/patch-admin-load.mjs"

echo "Adding monthly sales metric..."
node "${script_dir}/patch-monthly-sales.mjs"

echo "Showing order item variants in panels..."
node "${script_dir}/patch-order-variant-display.mjs"

echo "Applying safe mixed-cart patch..."
node "${script_dir}/patch-mixed-cart.mjs"

echo "Applying multi-store checkout patch..."
node "${script_dir}/patch-multistore-checkout.mjs"

echo "Applying fresh loading patch..."
node "${script_dir}/patch-loading-flow.mjs"

echo "Applying SEO schema patch..."
node "${script_dir}/patch-seo-schema.mjs"

echo "Applying panel order alerts..."
node "${script_dir}/patch-panel-order-alerts.mjs"

echo "Running bounded vinext build..."
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

bash "${script_dir}/validate-artifact.sh"
