# Test Results

Base URL for local regression: `http://127.0.0.1:4175`

- `npm run test:public-surface`: pass
- `npm run test:practice-area-matrix`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped
- `npm run test:diy-guide-matrix`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped
- `npm run test:public-answer-persistence`: pass
- `npm run test:packet-route-action`: pass
- `npm run test:forms-tools`: pass
- `npm run test:guide-county-gate`: pass
- `npm run test:public-completion`: pass
- `npm run test:new-user-scenarios`: pass
- `npm run test:result-semantics`: pass
- `npm run test:all-county-scenarios`: pass, 10 scenarios / 16 counties / 160 assertions
- `npm run test:fallback-action-contract`: pass
- `npm run test:fallback-rendered-outcomes`: pass, 18 rendered outcomes / 0 visible external PDF anchors
- `npm run test:hero-reveal-intelligence`: pass, practice=50 / guides=50 / highRisk=10 / responsive=12
- `npm run test:public-text-layout-qa`: pass locally and on the live custom domain, 50,870 live text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4175 node scripts/playwright-guide-county-gate.js`: pass
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4175 node scripts/playwright-forms-tools-guided-flow.js`: pass, no default answer chips, no skip-through CTA before answering, visible step rail, primary result tier, and answer-based result explanation
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4175 node scripts/playwright-public-text-layout-qa.js`: pass, 50,292 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920
- Live custom-domain DIY Guide form check: pass, `Start form check` lands on `/tools#forms-task-workspace`, shows `Guide context added`, does not show `ANSWERS CONFIRMED`, carries no calculator or packet state, shows no optional packet chooser, shows no Maricopa default, keeps Step 2 hidden, no horizontal overflow.
- Live custom-domain guided flow clarity: pending final clean redeploy verification for decision-flow clarity key.
- `npm run test:matter-form-matrix`: pass
- `npm run test:county-form-coverage`: pass
- `npm run test:unique-route-coverage`: pass
- `npm run test:three-path-parity`: pass
- `npm run test:source-specificity`: pass
- `npm run test:all-county-user-outcomes`: pass
- `npm run test:all-county-production-stability`: pass, 27 runs / 0 failures / 0 timeout mentions / 0 console or network mentions

Final live public JS SHA-256: `5862269e0361c79a3aa32b32bf9499374dd88c3d7cc4a9b63b6210656da846e2`

Final live public CSS SHA-256: `b56752240c42ba016c29c393a5e234f55f92b3622d4bd0d51abd7f6fb924f291`

Final local screenshot contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`
