#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JS_FILE="$ROOT_DIR/js/mflg-intake.js"
CSS_FILE="$ROOT_DIR/css/mflg-intake.css"
EXPECTED_VERSION="3.5.2-worldclass-ops"
EXPECTED_ENDPOINT_HOST='["https://jeremyjamesjack.app.", "n8", "n.cloud/", "web", "hook/mflg-intake"].join("")'

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

[[ -f "$JS_FILE" ]] || fail "Missing js/mflg-intake.js"
[[ -f "$CSS_FILE" ]] || fail "Missing css/mflg-intake.css"

if grep -Eiq '<!doctype|<html|<body|open-copy|copy helper' "$JS_FILE"; then
  fail "Production intake JS appears to contain HTML/helper wrapper content"
fi
pass "Production JS is not an HTML wrapper"

grep -q "version: \"$EXPECTED_VERSION\"" "$JS_FILE" || fail "Expected intake version $EXPECTED_VERSION not found"
pass "Expected intake version found"

grep -Fq "$EXPECTED_ENDPOINT_HOST" "$JS_FILE" || fail "Expected intake endpoint changed or missing"
pass "Intake endpoint preserved"

if grep -q 'child\\d+CurrentCityState.*render' "$JS_FILE"; then
  fail "child Current City/State appears to be tied to render again"
fi

if grep -q 'CurrentCityState.*/\\.test(key).*render' "$JS_FILE"; then
  fail "child Current City/State render-trigger pattern found"
fi
pass "Child Current City/State focus-loss guard preserved"

node --check "$JS_FILE" >/dev/null
pass "JavaScript syntax check passed"

echo "Release check complete."
