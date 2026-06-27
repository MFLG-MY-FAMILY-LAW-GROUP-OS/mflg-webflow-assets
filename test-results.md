# Test Results

Base URL for local regression: `http://127.0.0.1:4186`

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
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4186 node scripts/playwright-guide-county-gate.js`: pass
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4186 node scripts/playwright-forms-tools-guided-flow.js`: pass, quick-start cards hide after active workflow, advanced controls stay hidden unless browsing other options, deadline path keeps the form finder hidden, no stale Step 1 form-finder copy on deadline path
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4186 node scripts/playwright-public-answer-persistence.js`: pass
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4186 node scripts/playwright-public-text-layout-qa.js`: pass, 50,338 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920
- Local DIY Guide status-row check on `http://127.0.0.1:4192/guides/`: pass at widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920. The `Showing ... of 50 DIY guides` row remains below `Browse by situation`, stays inside the guide/grid boundary, does not overlap guide cards, and creates no horizontal overflow.
- Local DIY Guide filter clarity check on `http://127.0.0.1:4193/guides/`: pass. `All situations` replaces `Browse all`; `Show all 50 guides` expands all 50 cards; each situation filter has a matching count and note; `Identity` is folded into `Documents & safety`; no stale `remaining 40` note appears while a situation filter is active.
- Local DIY Guide filter reset check on `http://127.0.0.1:4193/guides/`: pass. `Documents & safety` shows 12 guides and a visible `Show every guide` reset; `Show every guide` clears the situation filter and shows all 50 guides.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4193 node scripts/playwright-diy-guide-matrix.js`: pass, includes the filtered `Show every guide` reset regression, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4193 node scripts/playwright-public-text-layout-qa.js`: pass, 50,338 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4194 node scripts/playwright-forms-tools-guided-flow.js`: pass, pending result panels stay hidden until a result exists, no duplicate or mashed labels, clear step accessible names, same-site PDF viewer still works.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4194 node scripts/playwright-diy-guide-matrix.js`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4194 node scripts/playwright-public-text-layout-qa.js`: pass, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4195 node scripts/playwright-public-label-polish.js`: pass, no mashed section navigator labels, one homepage `Start here`, Forms lane labels use category-style wording, and Practice Area notes use public review language.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4195 node scripts/playwright-forms-tools-guided-flow.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4195 node scripts/playwright-diy-guide-matrix.js`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4195 node scripts/playwright-public-text-layout-qa.js`: pass, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4196 node scripts/playwright-guide-county-gate.js`: pass. DIY Guide form handoff lands on `/tools#forms-task-workspace`, shows guide context, keeps county/stage/children unselected, keeps the packet chooser at `all`, hides lower forms and packets until answers are complete, and exposes no Maricopa default packet copy.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4196 node scripts/playwright-forms-tools-guided-flow.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4196 node scripts/playwright-public-answer-persistence.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4196 node scripts/playwright-public-label-polish.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4196 node scripts/playwright-diy-guide-matrix.js`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4196 node scripts/playwright-public-text-layout-qa.js`: pass, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- Live custom-domain guided flow clarity: pending final clean redeploy verification for form-flow simplify key.
- `npm run test:matter-form-matrix`: pass
- `npm run test:county-form-coverage`: pass
- `npm run test:unique-route-coverage`: pass
- `npm run test:three-path-parity`: pass
- `npm run test:source-specificity`: pass
- `npm run test:all-county-user-outcomes`: pass
- `npm run test:all-county-production-stability`: pass, 27 runs / 0 failures / 0 timeout mentions / 0 console or network mentions

Final live public JS SHA-256: `b95995aa0c737d2f4ad8793b98001c6a530decaf06d3cacbb1125453184b945f`

Final live public CSS SHA-256: `cf3522fbfd01b99e527d07f45390ff01e98641bb047fdecbbe1d4adea93519f9`

Final local screenshot contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`
