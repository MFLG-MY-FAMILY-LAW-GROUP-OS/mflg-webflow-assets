#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_ASSET_KEY="${EXPECTED_ASSET_KEY:-mflg-live-20260612-guidedflow3}"
EXPECTED_FAVICON_KEY="${EXPECTED_FAVICON_KEY:-mflg-brand-favicon-5}"
VERIFY_ATTEMPTS="${VERIFY_ATTEMPTS:-40}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

missing_live_marker() {
  echo "  - $1" >&2
}

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "CLOUDFLARE_API_TOKEN is required. Use: CLOUDFLARE_API_TOKEN=\"$(security find-generic-password -s CLOUDFLARE_API_TOKEN -w)\" $0"

cd "$ROOT_DIR"

node scripts/build-form-pdf-public-actions.js
node scripts/build-form-pdf-route-index.js
node scripts/build-form-download-readiness.js
node scripts/build-forms-tools-coverage.js
node scripts/build-form-route-actions.js
node scripts/build-jurisdiction-readiness.js
node scripts/build-calculator-readiness.js
node scripts/build-calculator-source-snapshot.js
node scripts/build-calculator-formula-workbench.js
node scripts/build-calculator-formula-map.js
node scripts/build-calculator-regression-harness.js
node scripts/build-calculator-engine-scaffold.js
node scripts/build-calculator-fixture-template.js
node scripts/build-calculator-official-fixtures.js
node scripts/build-calculator-approved-fixtures-workflow.js
node scripts/build-calculator-fixture-qa-status.js
node scripts/build-calculator-regression-comparison-status.js
node scripts/build-calculator-final-approval-status.js
node scripts/build-calculator-maintenance-fixtures.js
node scripts/build-calculator-runtime-engine.js
node scripts/build-calculator-public-unlock-status.js
node scripts/build-calculator-operations-status.js
node scripts/build-calculator-operations-alerts.js
node scripts/build-calculator-release-readiness.js
node scripts/build-calculator-release-evidence-status.js
node scripts/build-calculator-launch-guardrails.js
node scripts/build-calculator-launch-monitoring.js
node scripts/build-calculator-promotion-control.js
node scripts/build-calculator-promotion-audit.js
node scripts/build-calculator-unlock-phase-workflow.js
node scripts/build-calculator-fixture-evidence-entry.js
node scripts/build-calculator-fixture-evidence-validation.js
node scripts/build-calculator-approved-fixture-promotion.js
node scripts/build-calculator-regression-evidence-entry.js
node scripts/build-calculator-maintenance-fixtures.js
node scripts/build-calculator-runtime-engine.js
node scripts/build-calculator-engine-runtime-status.js
node scripts/build-calculator-internal-status.js
node scripts/build-calculator-formula-readiness.js
node scripts/build-forms-tools-action-plan.js
node scripts/build-forms-tools-review-roadmap.js
node scripts/build-forms-tools-maintenance-status.js
node scripts/build-forms-tools-intake-readiness.js
node scripts/build-forms-tools-route-intake-map.js
node scripts/build-forms-tools-matter-coverage.js
node scripts/build-forms-tools-completion-status.js

echo "Deploying Webflow asset host..."
CLOUDFLARE_PAGES_PROJECT=mflg-webflow-assets \
LIVE_ASSET_URL=https://assets.myfamilylawgroup.com/js/mflg-intake.js \
./scripts/deploy-live-assets.sh

echo "Deploying public website host..."
CLOUDFLARE_PAGES_PROJECT=mflg-public-website \
LIVE_ASSET_URL=https://myfamilylawgroup.com/js/mflg-intake.js \
./scripts/deploy-live-assets.sh

echo "Verifying public website route mapper..."
route_verified=0
for attempt in $(seq 1 "$VERIFY_ATTEMPTS"); do
  public_site_js="$(curl -fsSL "https://myfamilylawgroup.com/js/mflg-public-site.js?verify-route=${attempt}-$(date +%s)" || true)"
  if [[ "$public_site_js" == *"function intakeRouteForService"* ]] &&
     [[ "$public_site_js" == *"data-intake-route"* ]] &&
     [[ "$public_site_js" == *"case \"Divorce / Dissolution\""* ]] &&
     [[ "$public_site_js" == *"serviceMethodFallbackRoute"* ]] &&
     [[ "$public_site_js" == *"Service track match"* ]] &&
     [[ "$public_site_js" == *"service-methods-primary"* ]] &&
     [[ "$public_site_js" == *"wireServiceMethodCarousel"* ]] &&
     [[ "$public_site_js" == *"data-service-method-next"* ]] &&
     [[ "$public_site_js" == *"service-category-panel"* ]] &&
     [[ "$public_site_js" == *"data-service-category-filter"* ]] &&
	     [[ "$public_site_js" == *"publicCategoryGroups"* ]] &&
	     [[ "$public_site_js" == *"urgencyRouter"* ]] &&
	     [[ "$public_site_js" == *"decisionBridge"* ]] &&
	     [[ "$public_site_js" == *"What happens after Intake"* ]] &&
	     [[ "$public_site_js" == *"Client portal access is coordinated through the office"* ]] &&
	     [[ "$public_site_js" != *'{ path: "/client", label: "Client Portal" }'* ]] &&
	     [[ "$public_site_js" == *"Existing clients should contact the office for case status"* ]] &&
	     [[ "$public_site_js" == *"Official social channels"* ]] &&
	     [[ "$public_site_js" != *"placeholder access paths"* ]] &&
	     [[ "$public_site_js" != *"client-portal access is live"* ]] &&
	     [[ "$public_site_js" != *"Client portal access is not live yet"* ]] &&
	     [[ "$public_site_js" == *"Secure access plan"* ]] &&
	     [[ "$public_site_js" == *"sectionNavigator"* ]] &&
	     [[ "$public_site_js" == *"sectionJourney"* ]] &&
	     [[ "$public_site_js" == *"intake-landing-section"* ]] &&
	     [[ "$public_site_js" == *"intake-shell-start"* ]] &&
	     [[ "$public_site_js" == *"guideFallbackRoute"* ]] &&
	     [[ "$public_site_js" == *"guideFromServiceItem"* ]] &&
	     [[ "$public_site_js" == *"guide-issue-grid"* ]] &&
	     [[ "$public_site_js" == *"data-guide-reveal"* ]] &&
	     [[ "$public_site_js" == *"View Forms & Calculator"* ]] &&
	     [[ "$public_site_js" == *"data-guide-pdf-panel"* ]] &&
	     [[ "$public_site_js" == *"data-guide-calculator-choice"* ]] &&
	     [[ "$public_site_js" == *"Choose calculator or planner"* ]] &&
	     [[ "$public_site_js" == *"Open deadline-readiness planner"* ]] &&
	     [[ "$public_site_js" == *"guidePacketChoicesFor"* ]] &&
	     [[ "$public_site_js" == *"Form path"* ]] &&
	     [[ "$public_site_js" == *"Divorce or separation, no minor children"* ]] &&
	     [[ "$public_site_js" == *"Register an out-of-state custody order"* ]] &&
	     [[ "$public_site_js" == *"Register an out-of-state support order"* ]] &&
	     [[ "$public_site_js" == *"Use Guided Intake instead of guessing"* ]] &&
	     [[ "$public_site_js" == *"site_pdf_view_url"* ]] &&
	     [[ "$public_site_js" == *"Calculators & Planning Tools"* ]] &&
	     [[ "$public_site_js" == *"Court Forms Finder"* ]] &&
	     [[ "$public_site_js" == *"Use safe planning tools and official Arizona calculator sources"* ]] &&
	     [[ "$public_site_js" == *"Find the right reviewed forms, court-source backup, or Intake path"* ]] &&
	     [[ "$public_site_js" == *"forms-command-center"* ]] &&
	     [[ "$public_site_js" == *"Continue to recommended forms"* ]] &&
	     [[ "$public_site_js" == *"What are you trying to do?"* ]] &&
	     [[ "$public_site_js" == *"Privacy note"* ]] &&
	     [[ "$public_site_js" == *"Do not type private details on this page"* ]] &&
	     [[ "$public_site_js" == *"forms-smart-path"* ]] &&
	     [[ "$public_site_js" == *"Start here"* ]] &&
	     [[ "$public_site_js" == *"forms-flow-hidden"* ]] &&
	     [[ "$public_site_js" == *"data-smart-show-all"* ]] &&
	     [[ "$public_site_js" == *"Show more issues"* ]] &&
	     [[ "$public_site_js" == *"formRouterChildren"* ]] &&
	     [[ "$public_site_js" == *"wireJurisdictionReadiness"* ]] &&
	     [[ "$public_site_js" == *"jurisdiction-readiness.json"* ]] &&
	     [[ "$public_site_js" == *"data-jurisdiction-card-intake"* ]] &&
	     [[ "$public_site_js" == *"wireCalculatorReadiness"* ]] &&
	     [[ "$public_site_js" == *"calculator-readiness.json"* ]] &&
	     [[ "$public_site_js" == *"Use the right calculator without guessing"* ]] &&
	     [[ "$public_site_js" == *"calculator-pathways"* ]] &&
	     [[ "$public_site_js" == *"data-calculator-jump"* ]] &&
	     [[ "$public_site_js" == *"wireCalculatorPrecheck"* ]] &&
	     [[ "$public_site_js" == *"data-calculator-precheck"* ]] &&
	     [[ "$public_site_js" == *"Answer three quick questions"* ]] &&
	     [[ "$public_site_js" == *"data-calculator-precheck-checklist"* ]] &&
	     [[ "$public_site_js" == *"Gather the child-support inputs first"* ]] &&
	     [[ "$public_site_js" == *"wireCalculatorChooser"* ]] &&
	     [[ "$public_site_js" == *"data-calculator-chooser"* ]] &&
	     [[ "$public_site_js" == *"What are you trying to figure out?"* ]] &&
	     [[ "$public_site_js" == *"mflg-spousal-maintenance-calculator"* ]] &&
	     [[ "$public_site_js" == *"Use the spousal-maintenance calculator"* ]] &&
	     [[ "$public_site_js" == *"carried forward only the selected tool type"* ]] &&
	     [[ "$public_site_js" == *"data-official-calculator-workspace"* ]] &&
	     [[ "$public_site_js" == *"Open calculators"* ]] &&
	     [[ "$public_site_js" == *"Official fallback workspace"* ]] &&
	     [[ "$public_site_js" == *"data-official-calculator-frame"* ]] &&
	     [[ "$public_site_js" == *"Open calculator"* ]] &&
	     [[ "$public_site_js" == *"After the calculator"* ]] &&
	     [[ "$public_site_js" == *"data-official-calculator-next-intake"* ]] &&
	     [[ "$public_site_js" == *"Find matching forms"* ]] &&
	     [[ "$public_site_js" == *"data-official-calculator-source"* ]] &&
	     [[ "$public_site_js" == *"wireParentingTimeCounter"* ]] &&
	     [[ "$public_site_js" == *"data-parenting-time-counter"* ]] &&
	     [[ "$public_site_js" == *"Estimated annual overnights"* ]] &&
	     [[ "$public_site_js" == *"does not calculate child support"* ]] &&
	     [[ "$public_site_js" == *"data-parenting-time-next-intake"* ]] &&
	     [[ "$public_site_js" == *"Planning number only"* ]] &&
	     [[ "$public_site_js" == *"Review before relying"* ]] &&
	     [[ "$public_site_js" == *"Find parenting forms"* ]] &&
	     [[ "$public_site_js" == *"wireDeadlineReadinessPlanner"* ]] &&
	     [[ "$public_site_js" == *"data-deadline-readiness"* ]] &&
	     [[ "$public_site_js" == *"This planner does not calculate or extend legal deadlines"* ]] &&
	     [[ "$public_site_js" == *"No documents, case numbers, names, allegations"* ]] &&
	     [[ "$public_site_js" == *"data-deadline-next-title"* ]] &&
	     [[ "$public_site_js" == *"Do not wait for ordinary website review"* ]] &&
	     [[ "$public_site_js" == *"Confirm first"* ]] &&
	     [[ "$public_site_js" == *"This planner does not calculate deadlines"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsActionPlan"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-action-plan.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-action-plan-intake"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsReviewRoadmap"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-review-roadmap.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-tools-review-roadmap"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsMaintenanceStatus"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-maintenance-status.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-tools-maintenance-status"* ]] &&
	     [[ "$public_site_js" == *"data-forms-maintenance-intake"* ]] &&
	     [[ "$public_site_js" == *"wireFormDownloadReadiness"* ]] &&
	     [[ "$public_site_js" == *"form-download-readiness.json"* ]] &&
	     [[ "$public_site_js" == *"data-form-download-readiness"* ]] &&
	     [[ "$public_site_js" == *"Open reviewed court forms here"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-builder"* ]] &&
	     [[ "$public_site_js" == *"Build your form checklist"* ]] &&
	     [[ "$public_site_js" == *"mflg:official-pdf-open"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-view"* ]] &&
	     [[ "$public_site_js" == *"#forms-packet-builder"* ]] &&
	     [[ "$public_site_js" == *"focusPacketBuilder"* ]] &&
	     [[ "$public_site_js" == *"packetFilePurpose"* ]] &&
	     [[ "$public_site_js" == *"Why this matters"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-current"* ]] &&
	     [[ "$public_site_js" == *"Continue to next form"* ]] &&
	     [[ "$public_site_js" == *"data-current-form"* ]] &&
	     [[ "$public_site_js" == *"data-child-only"* ]] &&
	     [[ "$public_site_js" == *"child-related form"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-change-note"* ]] &&
	     [[ "$public_site_js" == *"Checks from other form groups stay saved"* ]] &&
	     [[ "$public_site_js" == *"forms-packet-builder-path"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-check"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-progress"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-remaining"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-remaining-open"* ]] &&
	     [[ "$public_site_js" == *"Forms left to review will appear here"* ]] &&
	     [[ "$public_site_js" == *"updateRemainingPacketForms"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-fit-title"* ]] &&
	     [[ "$public_site_js" == *"Confirm children, county, and filing stage"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-next"* ]] &&
	     [[ "$public_site_js" == *"Open next unchecked"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-resume"* ]] &&
	     [[ "$public_site_js" == *"Resume where you left off"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-next-status"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-state"* ]] &&
	     [[ "$public_site_js" == *"Ready to start"* ]] &&
	     [[ "$public_site_js" == *"In progress"* ]] &&
	     [[ "$public_site_js" == *"Preview PDF only"* ]] &&
	     [[ "$public_site_js" == *"Reviewed court PDF"* ]] &&
	     [[ "$public_site_js" == *"Official court PDF source"* ]] &&
	     [[ "$public_site_js" == *"forms-packet-primary-actions"* ]] &&
	     [[ "$public_site_js" == *"Form checklist utilities"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-complete"* ]] &&
	     [[ "$public_site_js" == *"All visible forms in this form group are checked"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-complete-intake"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-copy"* ]] &&
	     [[ "$public_site_js" == *"packetChecklistText"* ]] &&
	     [[ "$public_site_js" == *"Copy checklist"* ]] &&
	     [[ "$public_site_js" == *"data-forms-packet-clear-note"* ]] &&
	     [[ "$public_site_js" == *"Visible checks cleared"* ]] &&
	     [[ "$public_site_js" == *"showPacketClearNote"* ]] &&
	     [[ "$public_site_js" == *"Print checklist"* ]] &&
	     [[ "$public_site_js" == *"forms-packet-print-title"* ]] &&
	     [[ "$public_site_js" == *"mflgFormsPacketChecklist"* ]] &&
	     [[ "$public_site_js" == *"sessionStorage.setItem(checklistStorageKey"* ]] &&
	     [[ "$public_site_js" == *"not sent to the office"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsIntakeReadiness"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-intake-readiness.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-tools-intake-readiness"* ]] &&
	     [[ "$public_site_js" == *"data-forms-intake-option"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsRouteIntakeMap"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-route-intake-map.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-tools-route-intake-map"* ]] &&
	     [[ "$public_site_js" == *"data-route-map-card-intake"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsMatterCoverage"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-matter-coverage.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-tools-matter-coverage"* ]] &&
	     [[ "$public_site_js" == *"data-forms-matter-card-intake"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsCompletionStatus"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-completion-status.json"* ]] &&
	     [[ "$public_site_js" == *"data-forms-tools-completion-status"* ]] &&
	     [[ "$public_site_js" == *"pdfPacketForFormsRoute"* ]] &&
	     [[ "$public_site_js" == *"MFLGLatestFormsRoute"* ]] &&
	     [[ "$public_site_js" == *"formsToolRouteFor"* ]] &&
	     [[ "$public_site_js" == *"approvedPdfOfficialUrl"* ]] &&
	     [[ "$public_site_js" == *"pdfPromotionSnapshot"* ]] &&
	     [[ "$public_site_js" == *"74 public official PDF actions enabled"* ]] &&
	     [[ "$public_site_js" == *"pdfReviewWorkbenchSnapshot"* ]] &&
	     [[ "$public_site_js" == *"9 packet review batches completed"* ]] &&
	     [[ "$public_site_js" == *"pdfDecisionTemplateSnapshot"* ]] &&
	     [[ "$public_site_js" == *"74 reviewer decision records completed"* ]] &&
	     [[ "$public_site_js" == *"pdfPromotionAuditSnapshot"* ]] &&
	     [[ "$public_site_js" == *"74 promotion-ready PDF decisions"* ]] &&
	     [[ "$public_site_js" == *"wireOfficialPacketActions"* ]] &&
	     [[ "$public_site_js" == *"form-packet-page-actions.json"* ]] &&
	     [[ "$public_site_js" == *"data-official-packet-actions"* ]] &&
	     [[ "$public_site_js" == *"approvedPacketPageUrl"* ]] &&
	     [[ "$public_site_js" == *"wireOfficialPdfActions"* ]] &&
	     [[ "$public_site_js" == *"wireSourceHealthPanel"* ]] &&
	     [[ "$public_site_js" == *"source-health-public"* ]] &&
	     [[ "$public_site_js" == *"source-health-public.json"* ]] &&
	     [[ "$public_site_js" == *"wireFormsToolsCoverage"* ]] &&
	     [[ "$public_site_js" == *"forms-tools-coverage.json"* ]] &&
	     [[ "$public_site_js" == *"official-resource-summary"* ]] &&
	     [[ "$public_site_js" == *"formsRouteDecisionFor"* ]] &&
	     [[ "$public_site_js" == *"data-form-route-decision"* ]] &&
	     [[ "$public_site_js" == *"data-form-route-save"* ]] &&
	     [[ "$public_site_js" == *"data-form-route-decision-meta"* ]] &&
	     [[ "$public_site_js" == *"formRouteDecisionPacket"* ]] &&
	     [[ "$public_site_js" == *"pdfPacketDecisionMeta"* ]] &&
	     [[ "$public_site_js" == *"expandPdfGroup"* ]] &&
	     [[ "$public_site_js" == *"hasExplicitPacket"* ]] &&
	     [[ "$public_site_js" == *"wireFormRouteActions"* ]] &&
	     [[ "$public_site_js" == *"form-route-actions.json"* ]] &&
	     [[ "$public_site_js" == *"data-route-action-card-intake"* ]] &&
	     [[ "$public_site_js" == *"data-route-action-pdf-focus"* ]] &&
	     [[ "$public_site_js" == *"route-action-card-head"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-actions"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-spotlight"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-spotlight-kicker"* ]] &&
	     [[ "$public_site_js" == *"Browsing other form groups"* ]] &&
	     [[ "$public_site_js" == *"Browse other form groups"* ]] &&
	     [[ "$public_site_js" == *"forms-safe-next"* ]] &&
	     [[ "$public_site_js" == *"forms-advanced-details"* ]] &&
	     [[ "$public_site_js" == *"data-guided-path-line"* ]] &&
	     [[ "$public_site_js" == *"You are not filing anything by opening these forms"* ]] &&
	     [[ "$public_site_js" == *"Open child support calculator"* ]] &&
	     [[ "$public_site_js" == *"Open parenting time counter"* ]] &&
	     [[ "$public_site_js" == *"Open maintenance calculator"* ]] &&
	     [[ "$public_site_js" == *"clearOfficialPdfFilters"* ]] &&
	     [[ "$public_site_js" == *"expandPdfGroup"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-search"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-language"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-intake"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-item-intake"* ]] &&
	     [[ "$public_site_js" == *"data-official-pdf-viewer"* ]] &&
	     [[ "$public_site_js" == *"Open court form PDF"* ]] &&
	     [[ "$public_site_js" == *"Open court source"* ]] &&
	     [[ "$public_site_js" == *"Download PDF"* ]] &&
	     [[ "$public_site_js" == *"display_label"* ]] &&
	     [[ "$public_site_js" == *"public_name"* ]] &&
	     [[ "$public_site_js" == *"public_description"* ]] &&
	     [[ "$public_site_js" == *"public_stage"* ]] &&
	     [[ "$public_site_js" == *"source_label"* ]] &&
	     [[ "$public_site_js" == *"form-pdf-route-index.json"* ]] &&
	     [[ "$public_site_js" == *"packetRoute?.route"* ]] &&
	     [[ "$public_site_js" == *'packet) packet.value = "all"'* ]] &&
	     [[ "$public_site_js" == *"Open the forms in order"* ]] &&
	     [[ "$public_site_js" == *"Adoption / Family Formation Review"* ]] &&
	     [[ "$public_site_js" == *"Special Scope / Referral Review"* ]] &&
	     [[ "$public_site_js" == *"Court-readiness check"* ]] &&
	     [[ "$public_site_js" == *"Forms & Tools"* ]] &&
	     [[ "$public_site_js" == *"about-profile"* ]] &&
	     [[ "$public_site_js" == *"policy-grid"* ]] &&
	     [[ "$public_site_js" == *"Arizona Supreme Court Legal Paraprofessional Program"* ]] &&
	     [[ "$public_site_js" == *"faqGroups"* ]] &&
	     [[ "$public_site_js" == *"wireFaqTools"* ]] &&
	     [[ "$public_site_js" == *"data-faq-filter"* ]] &&
	     [[ "$public_site_js" == *"A.R.S. § 25-403 best-interests factors"* ]] &&
	     [[ "$public_site_js" == *"State Bar of Arizona Legal Paraprofessionals"* ]] &&
	     [[ "$public_site_js" == *"ABA Family Advocate client manuals"* ]] &&
	     [[ "$public_site_js" == *"feeRoute"* ]] &&
	     [[ "$public_site_js" == *"Initial Strategy Session"* ]] &&
	     [[ "$public_site_js" == *"Uncontested Divorce with Kids"* ]] &&
	     [[ "$public_site_js" == *"Court Hearing Modules"* ]] &&
	     [[ "$public_site_js" == *"Complex asset exclusion"* ]] &&
	     [[ "$public_site_js" == *"Contested conversion"* ]] &&
	     [[ "$public_site_js" == *"data-year"* ]]; then
    route_verified=1
    break
  fi

  echo "Public route mapper not updated yet; retry ${attempt}/${VERIFY_ATTEMPTS}..."
  sleep 6
done

[[ "$route_verified" == "1" ]] || fail "Public website route mapper did not verify."
if grep -A260 "const faqGroups" <<<"$public_site_js" | grep -Eq "CRM OS|n8n|automation"; then
  fail "Live FAQ content contains internal CRM OS, n8n, or automation language."
fi
if [[ "$public_site_js" == *"handoff"* ]]; then
  fail "Live public JS contains internal handoff terminology."
fi
profile_count="$(grep -o "jeremy-profile" <<<"$public_site_js" | wc -l | tr -d ' ')"
[[ "$profile_count" == "1" ]] || fail "Live public JS must only reference Jeremy bio photo on About; found $profile_count references."
if [[ "$public_site_js" == *"bioProofPanel"* ]]; then
  fail "Live public JS still contains shared bio proof panel."
fi
if [[ "$public_site_js" == *'return "GREEN"'* ]]; then
  fail "Live intake/public mapper contains off-brand GREEN fallback."
fi

echo "Verifying public website HTML, CSS, and favicon cache keys..."
html_verified=0
for attempt in $(seq 1 "$VERIFY_ATTEMPTS"); do
	  public_html="$(curl -fsSL "https://myfamilylawgroup.com/practice-areas?verify-html=${attempt}-$(date +%s)" || true)"
	  public_css="$(curl -fsSL "https://myfamilylawgroup.com/css/mflg-public-site.css?verify-css=${attempt}-$(date +%s)" || true)"
	  public_site_js="$(curl -fsSL "https://myfamilylawgroup.com/js/mflg-public-site.js?verify-public-js=${attempt}-$(date +%s)" || true)"
	  public_intake_css="$(curl -fsSL "https://myfamilylawgroup.com/css/mflg-intake.css?verify-intake-css=${attempt}-$(date +%s)" || true)"
	  public_intake_js="$(curl -fsSL "https://myfamilylawgroup.com/js/mflg-intake.js?verify-intake=${attempt}-$(date +%s)" || true)"

  if [[ "$public_html" == *"$EXPECTED_ASSET_KEY"* ]] &&
     [[ "$public_html" == *"$EXPECTED_FAVICON_KEY"* ]] &&
     [[ "$public_html" == *"favicon-light-32x32.png"* ]] &&
     [[ "$public_html" == *"favicon-dark-32x32.png"* ]] &&
	     [[ "$public_html" == *"DIY Guides"* ]] &&
	     [[ "$public_html" == *"Forms &amp; Calculators"* ]] &&
	     [[ "$public_html" != *"Forms &amp; Tools"* ]] &&
	     [[ "$public_html" != *'href="/guides" data-link>Guides</a>'* ]] &&
	     [[ "$public_html" == *"nav-access"* ]] &&
	     [[ "$public_html" == *"<summary>Login</summary>"* ]] &&
	     [[ "$public_html" != *"<summary>Access</summary>"* ]] &&
	     [[ "$public_html" == *'href="/client" data-link>Client Portal</a>'* ]] &&
	     [[ "$public_html" == *'href="/staff" data-link>Staff Login</a>'* ]] &&
	     [[ "$public_html" != *"<span>Client portal access</span>"* ]] &&
	     [[ "$public_html" != *"Secure client portal pending"* ]] &&
	     [[ "$public_html" != *"CRM OS pending"* ]] &&
	     [[ "$public_html" != *"Client Portal / CRM OS"* ]] &&
	     [[ "$public_html" != *"Staff Access / CRM OS"* ]] &&
	     [[ "$public_html" == *"footer-office"* ]] &&
	     [[ "$public_html" == *"2325 E Camelback Rd, Suite 400"* ]] &&
	     [[ "$public_html" == *"Office visits by appointment only. No walk-ins."* ]] &&
	     [[ "$public_html" == *"footer-map-band"* ]] &&
	     [[ "$public_html" == *"maps.google.com/maps"* ]] &&
	     [[ "$public_html" == *"data-map-business-status"* ]] &&
	     [[ "$public_html" == *"footer-map-label"* ]] &&
	     [[ "$public_html" != *"New matters begin with Guided Intake"* ]] &&
	     [[ "$public_html" != *"footer-intake-card"* ]] &&
	     [[ "$public_html" != *"Guided intake handoff"* ]] &&
	     [[ "$public_html" == *"mflg-logo-footer-horizontal-tagline.png"* ]] &&
	     [[ "$public_html" == *"Copyright &copy;"* ]] &&
	     [[ "$public_html" == *"Jeremy James Jack JD, LP"* ]] &&
	     [[ "$public_html" != *"service-grid-3ddf54d"* ]] &&
	     [[ "$public_html" != *"Jeremy James Jack, JD, LP"* ]] &&
     [[ "$public_html" != *"favicon-adaptive.svg"* ]] &&
     [[ "$public_css" == *"service-methods-primary"* ]] &&
     [[ "$public_css" == *"service-method-grid"* ]] &&
     [[ "$public_css" == *"service-method-carousel"* ]] &&
     [[ "$public_css" == *"service-method-controls"* ]] &&
     [[ "$public_css" == *"service-category-panel"* ]] &&
	     [[ "$public_css" == *"urgency-router"* ]] &&
	     [[ "$public_css" == *"decision-bridge"* ]] &&
	     [[ "$public_css" == *"intake-process-strip"* ]] &&
	     [[ "$public_css" == *"nav-access-menu"* ]] &&
	     [[ "$public_css" == *"section-journey-link:last-child:nth-child(4n + 1)"* ]] &&
	     [[ "$public_css" == *"width: clamp(238px, 17.8vw, 320px)"* ]] &&
     [[ "$public_css" == *"access-roadmap"* ]] &&
     [[ "$public_css" == *"section-switcher"* ]] &&
     [[ "$public_css" == *"section-journey"* ]] &&
	     [[ "$public_css" == *"intake-landing-section"* ]] &&
	     [[ "$public_css" == *"intake-shell-start #mflg-intake-root .mflg-intro"* ]] &&
	     [[ "$public_css" == *"guide-command"* ]] &&
	     [[ "$public_css" == *"guide-lead"* ]] &&
	     [[ "$public_css" == *"guide-issue-grid"* ]] &&
	     [[ "$public_css" == *"guide-row-panel"* ]] &&
	     [[ "$public_css" == *"guide-reveal"* ]] &&
	     [[ "$public_css" == *"guide-forms-viewer"* ]] &&
	     [[ "$public_css" == *"guide-pdf-frame"* ]] &&
	     [[ "$public_css" == *"pdf-promotion-card"* ]] &&
	     [[ "$public_css" == *"pdf-workbench-card"* ]] &&
	     [[ "$public_css" == *"pdf-template-card"* ]] &&
	     [[ "$public_css" == *"pdf-audit-card"* ]] &&
	     [[ "$public_css" == *"source-health-public"* ]] &&
	     [[ "$public_css" == *"source-health-grid"* ]] &&
	     [[ "$public_css" == *"jurisdiction-readiness"* ]] &&
	     [[ "$public_css" == *"jurisdiction-readiness-grid"* ]] &&
	     [[ "$public_css" == *"calculator-readiness"* ]] &&
	     [[ "$public_css" == *"calculator-readiness-grid"* ]] &&
	     [[ "$public_css" == *"calculator-precheck"* ]] &&
	     [[ "$public_css" == *"calculator-precheck-checklist"* ]] &&
	     [[ "$public_css" == *"calculator-chooser"* ]] &&
	     [[ "$public_css" == *"calculator-chooser-result"* ]] &&
	     [[ "$public_css" == *"official-calculator-workspace"* ]] &&
	     [[ "$public_css" == *"official-calculator-steps"* ]] &&
	     [[ "$public_css" == *"calculator-formula-readiness"* ]] &&
	     [[ "$public_css" == *"parenting-time-tool"* ]] &&
	     [[ "$public_css" == *"parenting-time-result"* ]] &&
	     [[ "$public_css" == *"parenting-time-next"* ]] &&
	     [[ "$public_css" == *"deadline-readiness-tool"* ]] &&
	     [[ "$public_css" == *"deadline-readiness-result"* ]] &&
	     [[ "$public_css" == *"deadline-readiness-next"* ]] &&
	     [[ "$public_css" == *"forms-smart-path"* ]] &&
		     [[ "$public_css" == *"forms-command-center"* ]] &&
		     [[ "$public_css" == *"forms-entry-lanes"* ]] &&
		     [[ "$public_css" == *"forms-guided-start"* ]] &&
		     [[ "$public_css" == *"forms-guided-result"* ]] &&
		     [[ "$public_css" == *"forms-guided-summary"* ]] &&
		     [[ "$public_css" == *"forms-smart-path-mode"* ]] &&
		     [[ "$public_css" == *"forms-flow-hidden"* ]] &&
		     [[ "$public_css" == *"forms-coverage-drawer"* ]] &&
		     [[ "$public_css" == *"forms-advanced-source-checks"* ]] &&
	     [[ "$public_css" == *"forms-action-plan"* ]] &&
	     [[ "$public_css" == *"forms-action-plan-steps"* ]] &&
	     [[ "$public_css" == *"forms-review-roadmap"* ]] &&
	     [[ "$public_css" == *"forms-review-roadmap-grid"* ]] &&
		     [[ "$public_css" == *"forms-maintenance-status"* ]] &&
		     [[ "$public_css" == *"forms-maintenance-grid"* ]] &&
		     [[ "$public_css" == *"forms-download-readiness"* ]] &&
		     [[ "$public_css" == *"forms-packet-builder"* ]] &&
	     [[ "$public_css" == *"forms-packet-builder-list"* ]] &&
	     [[ "$public_css" == *"forms-packet-file-purpose"* ]] &&
	     [[ "$public_css" == *"forms-packet-current"* ]] &&
	     [[ "$public_css" == *"data-current-form"* ]] &&
	     [[ "$public_css" == *"scroll-margin-top: 108px"* ]] &&
	     [[ "$public_css" == *"forms-packet-builder-path"* ]] &&
	     [[ "$public_css" == *"forms-packet-change-note"* ]] &&
	     [[ "$public_css" == *"forms-packet-fit"* ]] &&
	     [[ "$public_css" == *"forms-packet-checklist-bar"* ]] &&
	     [[ "$public_css" == *"forms-packet-remaining"* ]] &&
	     [[ "$public_css" == *"forms-packet-remaining-more"* ]] &&
	     [[ "$public_css" == *"forms-packet-check"* ]] &&
	     [[ "$public_css" == *".forms-packet-checklist-bar small"* ]] &&
	     [[ "$public_css" == *".forms-packet-checklist-bar em"* ]] &&
	     [[ "$public_css" == *"forms-packet-state"* ]] &&
	     [[ "$public_css" == *"forms-packet-source-note"* ]] &&
	     [[ "$public_css" == *"forms-packet-primary-actions"* ]] &&
	     [[ "$public_css" == *"forms-packet-resume"* ]] &&
	     [[ "$public_css" == *".forms-packet-checklist-actions .button:disabled"* ]] &&
	     [[ "$public_css" == *"forms-packet-clear-note"* ]] &&
	     [[ "$public_css" == *"forms-packet-complete"* ]] &&
	     [[ "$public_css" == *"forms-packet-complete-actions"* ]] &&
	     [[ "$public_css" == *"@media print"* ]] &&
	     [[ "$public_css" == *"#forms-packet-builder"* ]] &&
	     [[ "$public_css" == *"forms-packet-print-title"* ]] &&
	     [[ "$public_css" == *"forms-intake-readiness"* ]] &&
	     [[ "$public_css" == *"forms-intake-grid"* ]] &&
	     [[ "$public_css" == *"forms-route-intake-map"* ]] &&
	     [[ "$public_css" == *"forms-route-intake-grid"* ]] &&
	     [[ "$public_css" == *"forms-matter-coverage"* ]] &&
	     [[ "$public_css" == *"forms-matter-grid"* ]] &&
	     [[ "$public_css" == *"official-resource-card[open]"* ]] &&
	     [[ "$public_css" == *"forms-route-decision"* ]] &&
	     [[ "$public_css" == *"forms-route-decision-meta"* ]] &&
	     [[ "$public_css" == *"forms-completion-status"* ]] &&
	     [[ "$public_css" == *"forms-completion-grid"* ]] &&
	     [[ "$public_css" == *"forms-coverage-public"* ]] &&
	     [[ "$public_css" == *"forms-coverage-routes"* ]] &&
	     [[ "$public_css" == *"route-action-workbench"* ]] &&
	     [[ "$public_css" == *"route-action-grid"* ]] &&
	     [[ "$public_css" == *"route-action-pdf-focus"* ]] &&
	     [[ "$public_css" == *"route-action-card[open]"* ]] &&
	     [[ "$public_css" == *"packet-action-head"* ]] &&
	     [[ "$public_css" == *"packet-intake-link"* ]] &&
	     [[ "$public_css" == *"official-pdf-actions"* ]] &&
	     [[ "$public_css" == *"official-pdf-spotlight"* ]] &&
	     [[ "$public_css" == *"official-pdf-group[open]"* ]] &&
	     [[ "$public_css" == *"official-pdf-controls"* ]] &&
	     [[ "$public_css" == *"official-pdf-intake-panel"* ]] &&
	     [[ "$public_css" != *"handoff"* ]] &&
	     [[ "$public_css" == *"official-pdf-intake-link"* ]] &&
	     [[ "$public_css" == *"official-pdf-viewer"* ]] &&
	     [[ "$public_css" == *"official-pdf-direct-download"* ]] &&
	     [[ "$public_css" == *"official-calculator-next"* ]] &&
		     [[ "$public_css" == *"official-pdf-source"* ]] &&
		     [[ "$public_css" == *"official-pdf-link-grid"* ]] &&
		     [[ "$public_site_js" == *"Reviewed forms"* ]] &&
		     [[ "$public_site_js" == *"Choose what you need"* ]] &&
		     [[ "$public_site_js" == *"forms-entry-lanes"* ]] &&
		     [[ "$public_site_js" == *"forms-guided-start"* ]] &&
		     [[ "$public_site_js" == *"data-guided-answer"* ]] &&
		     [[ "$public_site_js" == *"data-guided-result-action"* ]] &&
			     [[ "$public_site_js" == *"data-guided-summary"* ]] &&
			     [[ "$public_site_js" == *"syncFormsFinder"* ]] &&
			     [[ "$public_site_js" == *"Answer one question at a time"* ]] &&
			     [[ "$public_site_js" == *"Start with one simple choice"* ]] &&
			     [[ "$public_site_js" == *"I need court forms"* ]] &&
			     [[ "$public_site_js" == *"Fine tune the result"* ]] &&
			     [[ "$public_site_js" == *"Tell us what you need"* ]] &&
			     [[ "$public_site_js" == *"Choose the form group that sounds closest"* ]] &&
			     [[ "$public_site_js" == *"Open the next safe step"* ]] &&
			     [[ "$public_site_js" == *"Recommended path shown first"* ]] &&
			     [[ "$public_site_js" == *"Open calculator tools"* ]] &&
			     [[ "$public_site_js" == *"data-forms-unified-result"* ]] &&
			     [[ "$public_site_js" == *"Why this recommendation"* ]] &&
			     [[ "$public_site_js" == *"Advanced: search or switch form groups"* ]] &&
			     [[ "$public_site_js" == *"setUnifiedFormsResult"* ]] &&
			     [[ "$public_site_js" == *"Your recommended next action"* ]] &&
			     [[ "$public_site_js" != *"data-smart-title"* ]] &&
			     [[ "$public_site_js" != *'<p class="eyebrow">Step 3</p>'* ]] &&
			     [[ "$public_css" == *"forms-smart-path-controls-head"* ]] &&
			     [[ "$public_css" == *"forms-path-strip"* ]] &&
			     [[ "$public_css" == *"forms-unified-result"* ]] &&
			     [[ "$public_css" == *"forms-route-explain"* ]] &&
			     [[ "$public_css" == *"official-pdf-browse"* ]] &&
		     [[ "$public_site_js" == *"Not sure which court or county to choose"* ]] &&
		     [[ "$public_css" == *"about-profile"* ]] &&
	     [[ "$public_css" == *"policy-grid"* ]] &&
	     [[ "$public_css" == *"faq-command"* ]] &&
	     [[ "$public_css" == *"faq-category-chip"* ]] &&
	     [[ "$public_css" == *"faq-item"* ]] &&
	     [[ "$public_css" == *"overflow-wrap: anywhere"* ]] &&
	     [[ "$public_css" == *"fee-hero-panel"* ]] &&
	     [[ "$public_css" == *"fee-disclosure"* ]] &&
	     [[ "$public_css" == *"fee-section-head"* ]] &&
	     [[ "$public_css" == *"fee-card"* ]] &&
	     [[ "$public_css" == *"footer-office"* ]] &&
	     [[ "$public_css" == *"footer-map-band"* ]] &&
	     [[ "$public_css" == *".footer-map-band iframe"* ]] &&
	     [[ "$public_css" == *"footer-map-label"* ]] &&
	     [[ "$public_css" == *"map-business-verified"* ]] &&
	     [[ "$public_css" != *"footer-intake-card"* ]] &&
	     [[ "$public_css" == *"filter: saturate(0.82)"* ]] &&
	     [[ "$public_css" == *"footer-office::after"* ]] &&
	     [[ "$public_css" == *"width: min(260px, 100%)"* ]] &&
	     [[ "$public_css" == *"margin: 0 0 14px"* ]] &&
	     [[ "$public_css" != *"#102923"* ]] &&
	     [[ "$public_css" == *"footer-legal"* ]] &&
	     [[ "$public_intake_js" == *"Start Guided Intake"* ]] &&
	     [[ "$public_intake_js" == *"Your intake starting point"* ]] &&
	     [[ "$public_site_js" == *"keeps the next step tied to your selections"* ]] &&
	     [[ "$public_site_js" != *"safe route metadata"* ]] &&
	     [[ "$public_intake_js" == *"Your Forms & Tools selections were carried into Intake"* ]] &&
	     [[ "$public_intake_js" != *"safe route metadata"* ]] &&
	     [[ "$public_intake_js" == *"approvedPdfLabel"* ]] &&
	     [[ "$public_intake_js" == *"approvedPdfOfficialUrl"* ]] &&
	     [[ "$public_intake_js" == *"approvedPacketPageLabel"* ]] &&
	     [[ "$public_intake_js" == *"approvedPacketPageUrl"* ]] &&
	     [[ "$public_intake_css" == *"mflg-route-safe-note"* ]] &&
	     [[ "$public_intake_js" == *"Briefly describe what is happening."* ]]; then
    html_verified=1
    break
  fi

	  echo "Public HTML/CSS not updated yet; retry ${attempt}/${VERIFY_ATTEMPTS}..."
	  sleep 6
done

if [[ "$html_verified" != "1" ]]; then
  echo "Live marker diagnostic:" >&2
  [[ "$public_html" == *"$EXPECTED_ASSET_KEY"* ]] || missing_live_marker "practice-areas HTML missing asset key $EXPECTED_ASSET_KEY"
  [[ "$public_css" == *"forms-guided-summary"* ]] || missing_live_marker "public CSS missing Forms & Tools guided summary"
  [[ "$public_site_js" == *"data-guided-summary"* ]] || missing_live_marker "public JS missing Forms & Tools guided summary"
  [[ "$public_site_js" == *"keeps the next step tied to your selections"* ]] || missing_live_marker "public JS missing visitor-safe Forms & Tools selection copy"
  [[ "$public_intake_js" == *"Your Forms & Tools selections were carried into Intake"* ]] || missing_live_marker "intake JS missing visitor-safe carried-selection copy"
  [[ "$public_site_js" != *"safe route metadata"* ]] || missing_live_marker "public JS still contains internal safe-route metadata language"
  [[ "$public_intake_js" != *"safe route metadata"* ]] || missing_live_marker "intake JS still contains internal safe-route metadata language"
  fail "Public website HTML/CSS/JS did not verify expected live markers after ${VERIFY_ATTEMPTS} attempts."
fi

echo "Verifying public PDF promotion-control data..."
pdf_actions_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-pdf-public-actions.json?verify-pdf-actions=$(date +%s)" || true)"
pdf_decisions_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-pdf-review-decisions.json?verify-pdf-decisions=$(date +%s)" || true)"
pdf_workbench_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-pdf-review-workbench.json?verify-pdf-workbench=$(date +%s)" || true)"
pdf_template_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-pdf-decision-template.json?verify-pdf-template=$(date +%s)" || true)"
pdf_audit_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-pdf-promotion-audit.json?verify-pdf-audit=$(date +%s)" || true)"
pdf_route_index_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-pdf-route-index.json?verify-pdf-route-index=$(date +%s)" || true)"
source_health_json="$(curl -fsSL "https://myfamilylawgroup.com/data/source-health-public.json?verify-source-health=$(date +%s)" || true)"
packet_page_actions_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-packet-page-actions.json?verify-packet-page-actions=$(date +%s)" || true)"
forms_tools_coverage_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-coverage.json?verify-forms-tools-coverage=$(date +%s)" || true)"
form_route_actions_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-route-actions.json?verify-route-actions=$(date +%s)" || true)"
jurisdiction_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/jurisdiction-readiness.json?verify-jurisdiction-readiness=$(date +%s)" || true)"
calculator_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-readiness.json?verify-calculator-readiness=$(date +%s)" || true)"
calculator_source_snapshot_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-source-snapshot-status.json?verify-calculator-source-snapshot=$(date +%s)" || true)"
calculator_formula_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-formula-readiness.json?verify-calculator-formula-readiness=$(date +%s)" || true)"
calculator_formula_source_summary_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-formula-source-summary.json?verify-calculator-formula-summary=$(date +%s)" || true)"
calculator_formula_engine_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-formula-engine-readiness.json?verify-calculator-formula-engine=$(date +%s)" || true)"
calculator_regression_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-regression-readiness.json?verify-calculator-regression=$(date +%s)" || true)"
calculator_engine_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-engine-readiness.json?verify-calculator-engine=$(date +%s)" || true)"
calculator_fixture_template_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-fixture-template-readiness.json?verify-calculator-fixture-template=$(date +%s)" || true)"
calculator_approved_fixtures_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-approved-fixtures-status.json?verify-calculator-approved-fixtures=$(date +%s)" || true)"
calculator_fixture_qa_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-fixture-qa-status.json?verify-calculator-fixture-qa=$(date +%s)" || true)"
calculator_regression_comparison_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-regression-comparison-status.json?verify-calculator-regression-comparison=$(date +%s)" || true)"
calculator_public_unlock_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-public-unlock-status.json?verify-calculator-public-unlock=$(date +%s)" || true)"
calculator_operations_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-operations-status.json?verify-calculator-operations=$(date +%s)" || true)"
calculator_operations_alerts_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-operations-alerts.json?verify-calculator-operations-alerts=$(date +%s)" || true)"
calculator_release_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-release-readiness.json?verify-calculator-release-readiness=$(date +%s)" || true)"
calculator_release_evidence_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-release-evidence-status.json?verify-calculator-release-evidence-status=$(date +%s)" || true)"
calculator_launch_guardrails_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-launch-guardrails.json?verify-calculator-launch-guardrails=$(date +%s)" || true)"
calculator_launch_monitoring_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-launch-monitoring.json?verify-calculator-launch-monitoring=$(date +%s)" || true)"
calculator_promotion_control_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-promotion-control.json?verify-calculator-promotion-control=$(date +%s)" || true)"
calculator_promotion_audit_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-promotion-audit.json?verify-calculator-promotion-audit=$(date +%s)" || true)"
calculator_unlock_phase_workflow_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-unlock-phase-workflow.json?verify-calculator-unlock-phase-workflow=$(date +%s)" || true)"
calculator_fixture_evidence_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-fixture-evidence-status.json?verify-calculator-fixture-evidence=$(date +%s)" || true)"
calculator_fixture_evidence_validation_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-fixture-evidence-validation-status.json?verify-calculator-fixture-evidence-validation=$(date +%s)" || true)"
calculator_approved_fixture_promotion_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-approved-fixture-promotion-status.json?verify-calculator-approved-fixture-promotion=$(date +%s)" || true)"
calculator_regression_evidence_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-regression-evidence-status.json?verify-calculator-regression-evidence=$(date +%s)" || true)"
calculator_engine_runtime_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-engine-runtime-status.json?verify-calculator-engine-runtime=$(date +%s)" || true)"
calculator_internal_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/calculator-internal-status.json?verify-calculator-internal-status=$(date +%s)" || true)"
forms_tools_action_plan_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-action-plan.json?verify-action-plan=$(date +%s)" || true)"
forms_tools_review_roadmap_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-review-roadmap.json?verify-review-roadmap=$(date +%s)" || true)"
forms_tools_maintenance_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-maintenance-status.json?verify-maintenance-status=$(date +%s)" || true)"
form_download_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/form-download-readiness.json?verify-download-readiness=$(date +%s)" || true)"
forms_tools_intake_readiness_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-intake-readiness.json?verify-intake-readiness=$(date +%s)" || true)"
forms_tools_route_intake_map_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-route-intake-map.json?verify-route-intake-map=$(date +%s)" || true)"
forms_tools_matter_coverage_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-matter-coverage.json?verify-matter-coverage=$(date +%s)" || true)"
forms_tools_completion_status_json="$(curl -fsSL "https://myfamilylawgroup.com/data/forms-tools-completion-status.json?verify-completion-status=$(date +%s)" || true)"
if [[ "$pdf_actions_json" != *"0.8.0-pdf-promotion-control"* ]] ||
	   [[ "$pdf_actions_json" != *'"approved_official_pdf_actions": 74'* ]] ||
	   [[ "$pdf_actions_json" != *'"display_label"'* ]] ||
	   [[ "$pdf_actions_json" != *'"public_name"'* ]] ||
	   [[ "$pdf_actions_json" != *"Petition for Divorce or Legal Separation"* ]] ||
	   [[ "$pdf_actions_json" != *"Parenting Plan"* ]] ||
	   [[ "$pdf_actions_json" != *'"public_stage"'* ]] ||
	   [[ "$pdf_actions_json" != *'"source_label"'* ]] ||
   [[ "$pdf_actions_json" != *'"pending": 0'* ]] ||
   [[ "$pdf_actions_json" != *'"public_pdf_actions_enabled": true'* ]] ||
   [[ "$pdf_actions_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$pdf_decisions_json" != *"0.8.0-pdf-promotion-control"* ]] ||
   [[ "$pdf_decisions_json" != *'"approved_official_pdf_actions": 74'* ]] ||
   [[ "$pdf_decisions_json" != *'"pending": 0'* ]] ||
   [[ "$pdf_decisions_json" != *'"public_pdf_actions_enabled_after_validation": true'* ]] ||
   [[ "$pdf_decisions_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$pdf_workbench_json" != *"0.9.0-pdf-review-workbench"* ]] ||
   [[ "$pdf_workbench_json" != *'"packet_batches": 9'* ]] ||
   [[ "$pdf_workbench_json" != *'"total_review_items": 70'* ]] ||
   [[ "$pdf_workbench_json" != *'"pending": 0'* ]] ||
   [[ "$pdf_workbench_json" != *'"public_pdf_actions_enabled": true'* ]] ||
   [[ "$pdf_workbench_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$pdf_template_json" != *"1.0.0-pdf-decision-template"* ]] ||
   [[ "$pdf_template_json" != *'"suggested_decision_records": 70'* ]] ||
   [[ "$pdf_template_json" != *'"public_pdf_actions_enabled": false'* ]] ||
   [[ "$pdf_template_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$pdf_audit_json" != *"1.1.0-pdf-promotion-audit"* ]] ||
   [[ "$pdf_audit_json" != *'"promotion_ready": 70'* ]] ||
   [[ "$pdf_audit_json" != *'"blocked_promotions": 0'* ]] ||
   [[ "$pdf_audit_json" != *'"pending_by_default": 0'* ]] ||
   [[ "$pdf_audit_json" != *'"public_pdf_actions_enabled": true'* ]] ||
   [[ "$pdf_audit_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$pdf_route_index_json" != *"1.0.0-pdf-route-index"* ]] ||
   [[ "$pdf_route_index_json" != *'"route_packets": 13'* ]] ||
   [[ "$pdf_route_index_json" != *'"official_pdf_actions": 74'* ]] ||
   [[ "$pdf_route_index_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$pdf_route_index_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$source_health_json" != *"1.0.0-public-source-health"* ]] ||
   [[ "$source_health_json" != *'"raw_hashes_exposed": false'* ]] ||
   [[ "$source_health_json" != *'"total": 38'* ]] ||
   [[ "$source_health_json" != *'"broken": 0'* ]] ||
   [[ "$source_health_json" != *"Reference indexes"* ]] ||
   [[ "$source_health_json" != *'"public_downloads_enabled": false'* ]] ||
   [[ "$packet_page_actions_json" != *"1.0.0-public-packet-page-actions"* ]] ||
   [[ "$packet_page_actions_json" != *'"official_packet_page_actions": 16'* ]] ||
   [[ "$packet_page_actions_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$packet_page_actions_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$forms_tools_coverage_json" != *"1.0.0-forms-tools-coverage"* ]] ||
   [[ "$forms_tools_coverage_json" != *'"covered_packet_routes": 20'* ]] ||
   [[ "$forms_tools_coverage_json" != *'"approved_pdf_actions": 74'* ]] ||
   [[ "$forms_tools_coverage_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$forms_tools_coverage_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$form_route_actions_json" != *"1.0.0-route-actions"* ]] ||
   [[ "$form_route_actions_json" != *'"route_actions": 20'* ]] ||
   [[ "$form_route_actions_json" != *'"official_pdf_actions": 74'* ]] ||
   [[ "$form_route_actions_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$form_route_actions_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$jurisdiction_readiness_json" != *"1.0.0-jurisdiction-readiness"* ]] ||
   [[ "$jurisdiction_readiness_json" != *'"official_jurisdictions": 20'* ]] ||
   [[ "$jurisdiction_readiness_json" != *'"monitored_sources_total": 38'* ]] ||
   [[ "$jurisdiction_readiness_json" != *'"unique_arizona_counties": 15'* ]] ||
   [[ "$jurisdiction_readiness_json" != *'"jurisdictions_with_reviewed_packet_actions": 2'* ]] ||
   [[ "$jurisdiction_readiness_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$jurisdiction_readiness_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$calculator_readiness_json" != *"1.0.0-calculator-readiness"* ]] ||
   [[ "$calculator_readiness_json" != *'"official_formula_sources": 2'* ]] ||
   [[ "$calculator_readiness_json" != *'"official_formula_sources_ok": 2'* ]] ||
   [[ "$calculator_readiness_json" != *'"formula_logic_enabled_on_site": true'* ]] ||
   [[ "$calculator_readiness_json" != *'"mflg_calculators_enabled_on_site": true'* ]] ||
   [[ "$calculator_readiness_json" != *'"official_embeds_enabled": true'* ]] ||
   [[ "$calculator_readiness_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$calculator_source_snapshot_status_json" != *"1.0.0-calculator-source-snapshot-status"* ]] ||
   [[ "$calculator_source_snapshot_status_json" != *'"source_snapshot_ready": true'* ]] ||
   [[ "$calculator_source_snapshot_status_json" != *'"child_support_formula_count": 1577'* ]] ||
   [[ "$calculator_source_snapshot_status_json" != *'"maintenance_page_reachable": true'* ]] ||
   [[ "$calculator_source_snapshot_status_json" != *'"source_drift_review_required": true'* ]] ||
   [[ "$calculator_source_snapshot_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_formula_readiness_json" != *"1.0.0-calculator-formula-readiness"* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"local_formula_logic_enabled": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"local_formula_results_enabled": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"reviewer_approval_required": false'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"public_results_enabled": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"source_snapshot_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"child_support_formula_map_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"regression_harness_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"approved_regression_fixtures": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"engine_scaffold_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"engine_required_output_checks": 18'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"engine_unsupported_excel_functions": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"fixture_entry_template_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"fixture_templates_ready": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"approved_fixture_template_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"complete_approved_fixtures": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"fixture_qa_plan_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"pending_official_comparisons": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"regression_comparison_plan_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"complete_regression_comparisons": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"regression_material_mismatches": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"public_unlock_gate_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"public_unlock_blocked_gates": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"operations_status_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"operations_alerts_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"operations_blocking_alerts": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"release_readiness_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"release_packet_complete": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"release_blocked_gates": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"release_evidence_status_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"release_evidence_items": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"release_evidence_pending_items": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"launch_guardrails_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"launch_blocked_guardrails": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"official_fallback_available": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"launch_monitoring_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"launch_attention_signals": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"promotion_control_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"blocked_promotion_checks": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"promotion_allowed": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"promotion_audit_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"blocked_promotion_audit_items": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"unlock_phase_workflow_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"blocked_unlock_phases": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"fixture_evidence_entry_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"complete_fixture_evidence_packets": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"pending_fixture_evidence_packets": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"fixture_evidence_validation_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"validated_fixture_evidence_packets": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"pending_fixture_evidence_validation": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"approved_fixture_promotion_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"promoted_approved_fixtures": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"pending_approved_fixture_promotions": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"regression_evidence_entry_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"complete_regression_evidence_items": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"pending_regression_evidence_items": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"engine_runtime_status_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"blocked_engine_runtime_checks": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"engine_runtime_ready": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"child_support_runtime_enabled": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"spousal_maintenance_runtime_enabled": true'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"maintenance_fixture_comparisons": 3'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"maintenance_material_mismatches": 0'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"runtime_fixture_comparisons": 4'* ]] ||
   [[ "$calculator_formula_readiness_json" != *'"runtime_material_mismatches": 0'* ]] ||
   [[ "$calculator_formula_source_summary_json" != *"1.0.0-calculator-formula-source-summary"* ]] ||
   [[ "$calculator_formula_source_summary_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_formula_source_summary_json" != *'"local_formula_results_enabled": false'* ]] ||
   [[ "$calculator_formula_engine_readiness_json" != *"1.0.0-calculator-formula-engine-readiness"* ]] ||
   [[ "$calculator_formula_engine_readiness_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_formula_engine_readiness_json" != *'"child_support_formula_map_ready": true'* ]] ||
   [[ "$calculator_formula_engine_readiness_json" != *'"local_formula_engine_enabled": false'* ]] ||
   [[ "$calculator_regression_readiness_json" != *"1.0.0-calculator-regression-readiness"* ]] ||
   [[ "$calculator_regression_readiness_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_regression_readiness_json" != *'"sensitive_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_regression_readiness_json" != *'"regression_harness_ready": true'* ]] ||
   [[ "$calculator_regression_readiness_json" != *'"approved_regression_fixtures": 0'* ]] ||
   [[ "$calculator_regression_readiness_json" != *'"local_formula_engine_enabled": false'* ]] ||
   [[ "$calculator_engine_readiness_json" != *"1.0.0-calculator-engine-readiness"* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"sensitive_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"engine_scaffold_ready": true'* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"required_output_checks": 18'* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"unsupported_excel_functions": 0'* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"local_formula_engine_enabled": false'* ]] ||
   [[ "$calculator_engine_readiness_json" != *'"public_unlock_ready": false'* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *"1.0.0-calculator-fixture-template-readiness"* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *'"sensitive_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *'"fixture_entry_template_ready": true'* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *'"fixture_templates": 4'* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *'"approved_fixture_values": 0'* ]] ||
   [[ "$calculator_fixture_template_readiness_json" != *'"ready_for_public_results": false'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *"1.0.0-calculator-approved-fixtures-status"* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"approved_fixture_template_ready": true'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"approved_fixtures_file_present": true'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"fixture_templates": 4'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"approved_fixture_records_found": 4'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"complete_approved_fixtures": 4'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"pending_approved_fixtures": 0'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"approved_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_approved_fixtures_status_json" != *'"public_unlock_ready": false'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *"1.0.0-calculator-fixture-qa-status"* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"sensitive_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"fixture_qa_plan_ready": true'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"fixture_review_items": 4'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"approved_fixture_count": 4'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"pending_official_comparisons": 0'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"executable_regression_tests": 4'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"approved_fixture_template_ready": true'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"complete_approved_fixtures": 4'* ]] ||
   [[ "$calculator_fixture_qa_status_json" != *'"public_unlock_ready": false'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *"1.0.0-calculator-regression-comparison-status"* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"sensitive_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"internal_engine_outputs_exposed": false'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"comparison_deltas_exposed": false'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"comparison_plan_ready": true'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"comparison_results_file_present": true'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"fixture_comparison_items": 4'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"complete_comparisons": 4'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"pending_comparisons": 0'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"material_mismatches": 0'* ]] ||
   [[ "$calculator_regression_comparison_status_json" != *'"public_unlock_ready": false'* ]] ||
   [[ "$calculator_public_unlock_status_json" != *"1.0.0-calculator-public-unlock-status"* ]] ||
   [[ "$calculator_public_unlock_status_json" != *'"public_unlock_gate_ready": true'* ]] ||
   [[ "$calculator_public_unlock_status_json" != *'"gate_count": 9'* ]] ||
   [[ "$calculator_public_unlock_status_json" != *'"passed_gates": 9'* ]] ||
   [[ "$calculator_public_unlock_status_json" != *'"blocked_gates": 0'* ]] ||
   [[ "$calculator_public_unlock_status_json" != *'"public_results_enabled": true'* ]] ||
   [[ "$calculator_public_unlock_status_json" != *'"public_unlock_ready": true'* ]] ||
   [[ "$calculator_operations_status_json" != *"1.0.0-calculator-operations-status"* ]] ||
   [[ "$calculator_operations_status_json" != *'"operations_status_ready": true'* ]] ||
   [[ "$calculator_operations_status_json" != *'"monitored_status_files": 4'* ]] ||
   [[ "$calculator_operations_status_json" != *'"internal_runbook_exposed": false'* ]] ||
   [[ "$calculator_operations_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_operations_status_json" != *'"next_public_status": "official_tools_remain_available"'* ]] ||
   [[ "$calculator_operations_alerts_json" != *"1.0.0-calculator-operations-alerts"* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"operations_alerts_ready": true'* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"alert_count": 3'* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"blocking_alerts": 0'* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"internal_alert_rules_exposed": false'* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_operations_alerts_json" != *'"next_public_status": "official_tools_remain_available"'* ]] ||
   [[ "$calculator_release_readiness_json" != *"1.0.0-calculator-release-readiness"* ]] ||
   [[ "$calculator_release_readiness_json" != *'"release_readiness_ready": true'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"release_packet_complete": true'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"passed_gates": 9'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"blocked_gates": 0'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"blocking_alerts": 0'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"internal_approval_packet_exposed": false'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_release_readiness_json" != *'"next_public_status": "official_tools_remain_available"'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *"1.0.0-calculator-release-evidence-status"* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"release_evidence_status_ready": true'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"evidence_items": 4'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"complete_evidence_items": 4'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"pending_evidence_items": 0'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"internal_evidence_index_exposed": false'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_release_evidence_status_json" != *'"next_public_status": "official_tools_remain_available"'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *"1.0.0-calculator-launch-guardrails"* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"launch_guardrails_ready": true'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"guardrail_count": 5'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"passing_guardrails": 5'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"blocked_guardrails": 0'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"official_fallback_available": true'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"internal_launch_runbook_exposed": false'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_launch_guardrails_json" != *'"launch_ready": true'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *"1.0.0-calculator-launch-monitoring"* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"launch_monitoring_ready": true'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"monitored_signals": 5'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"healthy_signals": 5'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"attention_signals": 0'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"official_fallback_available": true'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"internal_monitoring_runbook_exposed": false'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_launch_monitoring_json" != *'"launch_ready": true'* ]] ||
   [[ "$calculator_promotion_control_json" != *"1.0.0-calculator-promotion-control"* ]] ||
   [[ "$calculator_promotion_control_json" != *'"promotion_control_ready": true'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"promotion_checks": 6'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"passed_promotion_checks": 6'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"blocked_promotion_checks": 0'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"promotion_allowed": true'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"internal_promotion_control_exposed": false'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_promotion_control_json" != *'"next_public_status": "official_tools_remain_available"'* ]] ||
   [[ "$calculator_promotion_audit_json" != *"1.0.0-calculator-promotion-audit"* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"promotion_audit_ready": true'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"audit_items": 8'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"passed_audit_items": 8'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"blocked_audit_items": 0'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"promotion_allowed": true'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"internal_promotion_audit_exposed": false'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_promotion_audit_json" != *'"next_public_status": "official_tools_remain_available"'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *"1.0.0-calculator-unlock-phase-workflow"* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"unlock_phase_workflow_ready": true'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"unlock_phases": 4'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"complete_unlock_phases": 4'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"blocked_unlock_phases": 0'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"internal_unlock_workflow_exposed": false'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_unlock_phase_workflow_json" != *'"public_unlock_ready": true'* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *"1.0.0-calculator-fixture-evidence-status"* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *'"fixture_evidence_entry_ready": true'* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *'"fixture_evidence_packets": 4'* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *'"complete_evidence_packets": 4'* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *'"pending_evidence_packets": 0'* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *'"internal_evidence_template_exposed": false'* ]] ||
   [[ "$calculator_fixture_evidence_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *"1.0.0-calculator-fixture-evidence-validation-status"* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *'"fixture_evidence_validation_ready": true'* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *'"validation_items": 4'* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *'"validated_evidence_packets": 4'* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *'"pending_evidence_validation": 0'* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *'"internal_validation_detail_exposed": false'* ]] ||
   [[ "$calculator_fixture_evidence_validation_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *"1.0.0-calculator-approved-fixture-promotion-status"* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"approved_fixture_promotion_ready": true'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"promotion_items": 4'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"promotion_ready_items": 4'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"promoted_approved_fixtures": 4'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"pending_promotions": 0'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"internal_promotion_manifest_exposed": false'* ]] ||
   [[ "$calculator_approved_fixture_promotion_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *"1.0.0-calculator-regression-evidence-status"* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *'"regression_evidence_entry_ready": true'* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *'"regression_evidence_items": 4'* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *'"complete_regression_evidence": 4'* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *'"pending_regression_evidence": 0'* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *'"internal_comparison_evidence_exposed": false'* ]] ||
   [[ "$calculator_regression_evidence_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *"1.0.0-calculator-engine-runtime-status"* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"engine_runtime_status_ready": true'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"runtime_checks": 7'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"passed_runtime_checks": 7'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"blocked_runtime_checks": 0'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"runtime_ready": true'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"local_formula_engine_enabled": true'* ]] ||
   [[ "$calculator_engine_runtime_status_json" != *'"public_results_enabled": true'* ]] ||
   [[ "$calculator_internal_status_json" != *"1.0.0-calculator-internal-status"* ]] ||
   [[ "$calculator_internal_status_json" != *'"public_status_manifest_enabled": true'* ]] ||
   [[ "$calculator_internal_status_json" != *'"internal_artifacts_publicly_exposed": false'* ]] ||
   [[ "$calculator_internal_status_json" != *'"raw_formula_text_exposed": false'* ]] ||
   [[ "$calculator_internal_status_json" != *'"sensitive_fixture_values_exposed": false'* ]] ||
   [[ "$calculator_internal_status_json" != *'"internal_artifacts_ready": true'* ]] ||
   [[ "$calculator_internal_status_json" != *'"internal_artifact_count": 26'* ]] ||
   [[ "$calculator_internal_status_json" != *'"internal_artifacts_version_ok": 26'* ]] ||
   [[ "$calculator_internal_status_json" != *'"public_url_status": "blocked_404"'* ]] ||
   [[ "$calculator_internal_status_json" != *'"public_results_enabled": false'* ]] ||
   [[ "$forms_tools_action_plan_json" != *"1.0.0-forms-tools-action-plan"* ]] ||
   [[ "$forms_tools_action_plan_json" != *'"reviewed_routes": 20'* ]] ||
   [[ "$forms_tools_action_plan_json" != *'"approved_pdf_actions": 74'* ]] ||
   [[ "$forms_tools_action_plan_json" != *'"formula_logic_enabled_on_site": true'* ]] ||
   [[ "$forms_tools_action_plan_json" != *'"mflg_calculators_enabled_on_site": true'* ]] ||
   [[ "$forms_tools_action_plan_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$forms_tools_review_roadmap_json" != *"1.0.0-forms-tools-review-roadmap"* ]] ||
   [[ "$forms_tools_review_roadmap_json" != *'"public_packet_page_actions": 16'* ]] ||
   [[ "$forms_tools_review_roadmap_json" != *'"packet_candidates_review_only": 12'* ]] ||
   [[ "$forms_tools_review_roadmap_json" != *'"formula_logic_enabled_on_site": true'* ]] ||
   [[ "$forms_tools_review_roadmap_json" != *'"mflg_calculators_enabled_on_site": true'* ]] ||
   [[ "$forms_tools_review_roadmap_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$forms_tools_maintenance_status_json" != *"1.0.0-forms-tools-maintenance-status"* ]] ||
   [[ "$forms_tools_maintenance_status_json" != *'"official_sources_ok": 38'* ]] ||
   [[ "$forms_tools_maintenance_status_json" != *'"mflg_calculators_enabled_on_site": true'* ]] ||
   [[ "$forms_tools_maintenance_status_json" != *'"raw_hashes_exposed": false'* ]] ||
   [[ "$forms_tools_maintenance_status_json" != *'"direct_cached_downloads_enabled": false'* ]] ||
   [[ "$form_download_readiness_json" != *"1.0.0-form-download-readiness"* ]] ||
   [[ "$form_download_readiness_json" != *'"official_pdf_actions": 74'* ]] ||
   [[ "$form_download_readiness_json" != *'"hosted_downloads_enabled": true'* ]] ||
   [[ "$form_download_readiness_json" != *'"same_origin_pdf_delivery_enabled": true'* ]] ||
   [[ "$form_download_readiness_json" != *'"human_review_required_before_hosting": false'* ]] ||
   [[ "$form_download_readiness_json" != *'"public_runner_exposed": false'* ]] ||
   [[ "$forms_tools_intake_readiness_json" != *"1.0.0-forms-tools-intake-readiness"* ]] ||
   [[ "$forms_tools_intake_readiness_json" != *'"safe_start_options": 6'* ]] ||
   [[ "$forms_tools_intake_readiness_json" != *'"reviewed_routes": 20'* ]] ||
   [[ "$forms_tools_intake_readiness_json" != *'"approved_pdf_actions": 74'* ]] ||
   [[ "$forms_tools_intake_readiness_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$forms_tools_intake_readiness_json" != *'"sensitive_public_collection_enabled": false'* ]] ||
   [[ "$forms_tools_route_intake_map_json" != *"1.0.0-forms-tools-route-intake-map"* ]] ||
   [[ "$forms_tools_route_intake_map_json" != *'"reviewed_route_starts": 20'* ]] ||
   [[ "$forms_tools_route_intake_map_json" != *'"routes_with_approved_pdfs": 13'* ]] ||
   [[ "$forms_tools_route_intake_map_json" != *'"approved_pdf_actions": 74'* ]] ||
   [[ "$forms_tools_route_intake_map_json" != *'"exact_route_intake_enabled": true'* ]] ||
   [[ "$forms_tools_route_intake_map_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$forms_tools_matter_coverage_json" != *"1.0.0-forms-tools-matter-coverage"* ]] ||
   [[ "$forms_tools_matter_coverage_json" != *'"public_matters": 50'* ]] ||
   [[ "$forms_tools_matter_coverage_json" != *'"matters_with_guided_intake_start": 50'* ]] ||
   [[ "$forms_tools_matter_coverage_json" != *'"all_public_matters_accounted_for": true'* ]] ||
   [[ "$forms_tools_matter_coverage_json" != *'"safe_route_metadata_only": true'* ]] ||
   [[ "$forms_tools_completion_status_json" != *"1.0.0-forms-tools-completion-status"* ]] ||
   [[ "$forms_tools_completion_status_json" != *'"forms_tools_public_surface_complete": true'* ]] ||
   [[ "$forms_tools_completion_status_json" != *'"completion_checks_passing": 6'* ]] ||
   [[ "$forms_tools_completion_status_json" != *'"public_matters": 50'* ]] ||
   [[ "$forms_tools_completion_status_json" != *'"safe_route_metadata_only": true'* ]]; then
  fail "Public PDF promotion-control data did not verify."
fi

internal_formula_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-formula-workbench.json?verify-internal-block=$(date +%s)" || true)"
internal_source_snapshot_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-source-snapshot.json?verify-internal-source-snapshot-block=$(date +%s)" || true)"
if [[ "$internal_source_snapshot_status" != "404" ]]; then
  fail "Internal calculator source snapshot is publicly reachable with status ${internal_source_snapshot_status}."
fi
if [[ "$internal_formula_status" != "404" ]]; then
  fail "Internal calculator formula workbench is publicly reachable with status ${internal_formula_status}."
fi
internal_formula_map_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-formula-map.json?verify-internal-map-block=$(date +%s)" || true)"
if [[ "$internal_formula_map_status" != "404" ]]; then
  fail "Internal calculator formula map is publicly reachable with status ${internal_formula_map_status}."
fi
internal_regression_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-regression-harness.json?verify-internal-regression-block=$(date +%s)" || true)"
if [[ "$internal_regression_status" != "404" ]]; then
  fail "Internal calculator regression harness is publicly reachable with status ${internal_regression_status}."
fi
internal_engine_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-engine-scaffold.json?verify-internal-engine-block=$(date +%s)" || true)"
if [[ "$internal_engine_status" != "404" ]]; then
  fail "Internal calculator engine scaffold is publicly reachable with status ${internal_engine_status}."
fi
internal_fixture_template_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-fixture-entry-template.json?verify-internal-fixture-template-block=$(date +%s)" || true)"
if [[ "$internal_fixture_template_status" != "404" ]]; then
  fail "Internal calculator fixture template is publicly reachable with status ${internal_fixture_template_status}."
fi
internal_approved_fixtures_template_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-approved-fixtures-template.json?verify-internal-approved-fixtures-template-block=$(date +%s)" || true)"
if [[ "$internal_approved_fixtures_template_status" != "404" ]]; then
  fail "Internal calculator approved fixtures template is publicly reachable with status ${internal_approved_fixtures_template_status}."
fi
internal_fixture_qa_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-fixture-qa-plan.json?verify-internal-fixture-qa-block=$(date +%s)" || true)"
if [[ "$internal_fixture_qa_status" != "404" ]]; then
  fail "Internal calculator fixture QA plan is publicly reachable with status ${internal_fixture_qa_status}."
fi
internal_regression_comparison_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-regression-comparison-plan.json?verify-internal-regression-comparison-block=$(date +%s)" || true)"
if [[ "$internal_regression_comparison_status" != "404" ]]; then
  fail "Internal calculator regression comparison plan is publicly reachable with status ${internal_regression_comparison_status}."
fi
internal_public_unlock_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-public-unlock-decision.json?verify-internal-public-unlock-block=$(date +%s)" || true)"
if [[ "$internal_public_unlock_status" != "404" ]]; then
  fail "Internal calculator public unlock decision is publicly reachable with status ${internal_public_unlock_status}."
fi
internal_operations_runbook_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-operations-runbook.json?verify-internal-operations-runbook-block=$(date +%s)" || true)"
if [[ "$internal_operations_runbook_status" != "404" ]]; then
  fail "Internal calculator operations runbook is publicly reachable with status ${internal_operations_runbook_status}."
fi
internal_operations_alert_rules_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-operations-alert-rules.json?verify-internal-operations-alert-rules-block=$(date +%s)" || true)"
if [[ "$internal_operations_alert_rules_status" != "404" ]]; then
  fail "Internal calculator operations alert rules are publicly reachable with status ${internal_operations_alert_rules_status}."
fi
internal_release_approval_packet_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-release-approval-packet.json?verify-internal-release-approval-packet-block=$(date +%s)" || true)"
if [[ "$internal_release_approval_packet_status" != "404" ]]; then
  fail "Internal calculator release approval packet is publicly reachable with status ${internal_release_approval_packet_status}."
fi
internal_release_evidence_index_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-release-evidence-index.json?verify-internal-release-evidence-index-block=$(date +%s)" || true)"
if [[ "$internal_release_evidence_index_status" != "404" ]]; then
  fail "Internal calculator release evidence index is publicly reachable with status ${internal_release_evidence_index_status}."
fi
internal_launch_guardrails_runbook_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-launch-guardrails-runbook.json?verify-internal-launch-guardrails-runbook-block=$(date +%s)" || true)"
if [[ "$internal_launch_guardrails_runbook_status" != "404" ]]; then
  fail "Internal calculator launch guardrails runbook is publicly reachable with status ${internal_launch_guardrails_runbook_status}."
fi
internal_launch_monitoring_runbook_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-launch-monitoring-runbook.json?verify-internal-launch-monitoring-runbook-block=$(date +%s)" || true)"
if [[ "$internal_launch_monitoring_runbook_status" != "404" ]]; then
  fail "Internal calculator launch monitoring runbook is publicly reachable with status ${internal_launch_monitoring_runbook_status}."
fi
internal_promotion_control_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-promotion-control.json?verify-internal-promotion-control-block=$(date +%s)" || true)"
if [[ "$internal_promotion_control_status" != "404" ]]; then
  fail "Internal calculator promotion control is publicly reachable with status ${internal_promotion_control_status}."
fi
internal_promotion_audit_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-promotion-audit.json?verify-internal-promotion-audit-block=$(date +%s)" || true)"
if [[ "$internal_promotion_audit_status" != "404" ]]; then
  fail "Internal calculator promotion audit is publicly reachable with status ${internal_promotion_audit_status}."
fi
internal_unlock_phase_workflow_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-unlock-phase-workflow-runbook.json?verify-internal-unlock-phase-workflow-block=$(date +%s)" || true)"
if [[ "$internal_unlock_phase_workflow_status" != "404" ]]; then
  fail "Internal calculator unlock phase workflow is publicly reachable with status ${internal_unlock_phase_workflow_status}."
fi
internal_fixture_evidence_entry_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-fixture-evidence-entry.json?verify-internal-fixture-evidence-entry-block=$(date +%s)" || true)"
if [[ "$internal_fixture_evidence_entry_status" != "404" ]]; then
  fail "Internal calculator fixture evidence entry is publicly reachable with status ${internal_fixture_evidence_entry_status}."
fi
internal_fixture_evidence_validation_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-fixture-evidence-validation.json?verify-internal-fixture-evidence-validation-block=$(date +%s)" || true)"
if [[ "$internal_fixture_evidence_validation_status" != "404" ]]; then
  fail "Internal calculator fixture evidence validation is publicly reachable with status ${internal_fixture_evidence_validation_status}."
fi
internal_approved_fixture_promotion_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-approved-fixture-promotion.json?verify-internal-approved-fixture-promotion-block=$(date +%s)" || true)"
if [[ "$internal_approved_fixture_promotion_status" != "404" ]]; then
  fail "Internal calculator approved fixture promotion is publicly reachable with status ${internal_approved_fixture_promotion_status}."
fi
internal_regression_evidence_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-regression-evidence-entry.json?verify-internal-regression-evidence-block=$(date +%s)" || true)"
if [[ "$internal_regression_evidence_status" != "404" ]]; then
  fail "Internal calculator regression evidence entry is publicly reachable with status ${internal_regression_evidence_status}."
fi
internal_engine_runtime_status="$(curl -sS -o /dev/null -w "%{http_code}" "https://myfamilylawgroup.com/internal/calculator-engine-runtime-plan.json?verify-internal-engine-runtime-block=$(date +%s)" || true)"
if [[ "$internal_engine_runtime_status" != "404" ]]; then
  fail "Internal calculator engine runtime plan is publicly reachable with status ${internal_engine_runtime_status}."
fi

echo "All live MFLG hosts verified."
