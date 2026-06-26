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
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4175 node scripts/playwright-forms-tools-guided-flow.js`: pass
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4175 node scripts/playwright-public-text-layout-qa.js`: pass, 50,259 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920
- Live custom-domain DIY Guide form check: pass, `Start form check` lands on `/tools#forms-task-workspace`, shows `Guide context added`, does not show `ANSWERS CONFIRMED`, carries no calculator or packet state, shows no optional packet chooser, shows no Maricopa default, keeps Step 2 hidden, no horizontal overflow.
- Live custom-domain guided flow clarity: pass, `Understand the steps` lands on a `Steps` panel with forms/calculator/office-review next actions; clean helper shows `Step 1 of 5: Choose what you need` and `Continue to county`; after selecting forms it shows `Step 2 of 5: Choose county` and `Continue to case stage`; first-pass advanced controls are hidden.
- `npm run test:matter-form-matrix`: pass
- `npm run test:county-form-coverage`: pass
- `npm run test:unique-route-coverage`: pass
- `npm run test:three-path-parity`: pass
- `npm run test:source-specificity`: pass
- `npm run test:all-county-user-outcomes`: pass
- `npm run test:all-county-production-stability`: pass, 27 runs / 0 failures / 0 timeout mentions / 0 console or network mentions

Final live public JS SHA-256: `2c7395c18e76ce0ed556dc53eaed54e61784bc1c6459e4fdb1b5841eca12ec5b`

Final live public CSS SHA-256: `b4e788f7993c4a67ed98d1666497127831bd3470593ae04ea6606f6e3ec2bec4`

Final local screenshot contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`
