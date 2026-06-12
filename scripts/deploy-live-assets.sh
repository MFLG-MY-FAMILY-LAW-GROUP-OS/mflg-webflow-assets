#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_VERSION="${EXPECTED_VERSION:-3.6.0-worldclass-routing}"
LIVE_ASSET_URL="${LIVE_ASSET_URL:-https://assets.myfamilylawgroup.com/js/mflg-intake.js}"
PAGES_PROJECT="${CLOUDFLARE_PAGES_PROJECT:-${PAGES_PROJECT:-mflg-webflow-assets}}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

cd "$ROOT_DIR"

need_cmd node
need_cmd curl
need_cmd npx
need_cmd rsync

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "CLOUDFLARE_API_TOKEN is required. Without it, changes stay local and the live site will not update."
[[ -n "$PAGES_PROJECT" ]] || fail "CLOUDFLARE_PAGES_PROJECT is required. Set it to the Cloudflare Pages project that serves assets.myfamilylawgroup.com."

./scripts/sync-route-entries.js >/dev/null
./scripts/check-intake-release.sh

node --check js/mflg-public-site.js >/dev/null
node --check js/mflg-intake.js >/dev/null

mkdir -p js/releases css/releases
cp js/mflg-intake.js "js/releases/mflg-intake-${EXPECTED_VERSION}.js"
cp css/mflg-intake.css "css/releases/mflg-intake-${EXPECTED_VERSION}.css"

echo "Deploying $ROOT_DIR to Cloudflare Pages project: $PAGES_PROJECT"
DEPLOY_DIR="$ROOT_DIR/.wrangler/deploy-staging/$PAGES_PROJECT"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
rsync -a --delete \
  --exclude ".git/" \
  --exclude ".wrangler/" \
  --exclude "internal/" \
  --exclude "scripts/" \
  --exclude "rollback-snapshots/" \
  --exclude "test-results/" \
  --exclude "docs/" \
  --exclude "js/releases/" \
  --exclude "css/releases/" \
  "$ROOT_DIR/" "$DEPLOY_DIR/"
npx wrangler pages deploy "$DEPLOY_DIR" --project-name "$PAGES_PROJECT" --branch main --commit-dirty=true

echo "Verifying live asset version at $LIVE_ASSET_URL"
for attempt in $(seq 1 20); do
  body="$(curl -fsSL "${LIVE_ASSET_URL}?verify=${EXPECTED_VERSION}-${attempt}-$(date +%s)" || true)"
  if [[ "$body" == *"version: \"${EXPECTED_VERSION}\""* ]] &&
     [[ "$body" == *"routeKey"* ]] &&
     [[ "$body" == *"presetAnswersJSON"* ]] &&
     [[ "$body" != *'return "GREEN"'* ]]; then
    echo "Live asset verified: ${EXPECTED_VERSION}"
    exit 0
  fi

  echo "Live asset not updated yet; retry ${attempt}/20..."
  sleep 6
done

fail "Deploy completed but live asset did not verify as ${EXPECTED_VERSION}. Check Cloudflare Pages project, custom domain, cache, and deployment logs."
