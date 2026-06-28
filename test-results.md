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
- Live custom-domain form-flow simplify verification: pass. `myfamilylawgroup.com` serves `mflg-live-20260627-094728-form-flow-simplify`; the previous `mflg-live-20260627-090622-label-polish` key is absent; all target routes return 200; no public external PDF anchors are visible; live guide handoff and guided Forms flow regressions pass.
- `npm run test:matter-form-matrix`: pass
- `npm run test:county-form-coverage`: pass
- `npm run test:unique-route-coverage`: pass
- `npm run test:three-path-parity`: pass
- `npm run test:source-specificity`: pass
- `npm run test:all-county-user-outcomes`: pass
- `npm run test:all-county-production-stability`: pass, 27 runs / 0 failures / 0 timeout mentions / 0 console or network mentions

## Result Pruning Release: mflg-live-20260627-163258-result-pruning

Base URL for local regression: `http://127.0.0.1:4197`

- `EXPECTED_ASSET_KEY=mflg-live-20260627-163258-result-pruning ./scripts/check-intake-release.sh`: pass.
- `node scripts/validate-matter-form-matrix.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4197 node scripts/playwright-forms-tools-guided-flow.js`: pass. The matched form result uses `View matched forms`, the alternate form-group browser renders but stays closed by default, the form-group dropdown is not visible above matched forms, and no packet form auto-opens or checks itself before the user clicks `View form`.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4197 node scripts/playwright-guide-county-gate.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4197 node scripts/playwright-diy-guide-matrix.js`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4197 node scripts/playwright-public-text-layout-qa.js`: pass, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-forms-tools-guided-flow.js`: pass after final direct deploy.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-guide-county-gate.js`: pass after final direct deploy.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-public-text-layout-qa.js`: pass, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- Deploy script uploaded successfully but its built-in marker retry timed out twice during propagation. Direct custom-domain checks passed and final direct deploys corrected source labels without regenerating artifacts.
- Final Cloudflare `mflg-public-website`: `5a4e640f-d314-4154-ab2f-644e6a64b84c`, source `main / ebe0f96`.
- Final Cloudflare `mflg-webflow-assets`: `5c248d22-95bf-476d-8310-948d96b12e5a`, source `main / ebe0f96`.

Final live public JS SHA-256: `5b258f58dc8a3996a8f9db4f0587253f3fed8e01a9d39d90ae39bbb06be0ec18`

Final live public CSS SHA-256: `5798b12b682d3bf5255b7e5844046773918d34fa601a9bb8c2933038acd3c602`

## Form Escape Hatch Release: mflg-live-20260628-002232-form-escape-hatch

Base URL for local regression: `http://127.0.0.1:4198`

- `EXPECTED_ASSET_KEY=mflg-live-20260628-002232-form-escape-hatch ./scripts/check-intake-release.sh`: pass.
- `node scripts/validate-matter-form-matrix.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4198 node scripts/playwright-forms-tools-guided-flow.js`: pass. The matched forms landing uses `Recommended forms`, exposes one visible `Browse form groups` secondary control, and keeps the alternate form-group browser closed until selected.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4198 node scripts/playwright-guide-county-gate.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4198 node scripts/playwright-diy-guide-matrix.js`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4198 node scripts/playwright-public-text-layout-qa.js`: pass after shortening the clipped mobile button label, 50,287 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-forms-tools-guided-flow.js`: pass after final direct deploy.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-guide-county-gate.js`: pass after final direct deploy.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-public-text-layout-qa.js`: pass, 50,287 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- Deploy script uploaded successfully but its built-in marker retry timed out during propagation. Direct custom-domain checks passed and final direct deploys corrected source labels without regenerating artifacts.
- Final Cloudflare `mflg-public-website`: `c735e695-d70c-47ec-8aa4-f2c0c1e9f162`, source `main / 25912d7`.
- Final Cloudflare `mflg-webflow-assets`: `a6053e5b-fe4e-46a8-93b7-7e9e13cc715d`, source `main / 25912d7`.

Final live public JS SHA-256: `7d7250ec28681345268a2c10377b219aa3193e3810a7c161d5cf8709f8180561`

Final live public CSS SHA-256: `d52d269e0529ed04c6d9a6504a5f0bd08664223f523866bae188f08eacc41c45`

## Form Scan Polish Release: mflg-live-20260628-011530-form-scan-polish

Base URL for local regression: `http://127.0.0.1:4199`

- `EXPECTED_ASSET_KEY=mflg-live-20260628-011530-form-scan-polish ./scripts/check-intake-release.sh`: pass.
- `node scripts/validate-matter-form-matrix.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4199 node scripts/playwright-forms-tools-guided-flow.js`: pass. The matched forms view uses `See other form groups`, keeps one visible secondary browse control, keeps the alternate form-group browser closed, and preserves same-site PDF viewer behavior.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4199 node scripts/playwright-guide-county-gate.js`: pass.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4199 node scripts/playwright-diy-guide-matrix.js`: pass, 50 expected / 50 discovered / 50 opened / 50 asserted / 0 skipped.
- `MFLG_TEST_BASE_URL=http://127.0.0.1:4199 node scripts/playwright-public-text-layout-qa.js`: pass after mobile button fit adjustment, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-forms-tools-guided-flow.js`: pass after final direct deploy.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-guide-county-gate.js`: pass after final direct deploy.
- `MFLG_TEST_BASE_URL=https://myfamilylawgroup.com node scripts/playwright-public-text-layout-qa.js`: pass, 50,281 text inventory rows / 50 practice cards / 50 DIY guide cards / widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920.
- Deploy script uploaded successfully but its built-in marker retry timed out during propagation. Direct custom-domain checks passed and final direct deploys corrected source labels without regenerating artifacts.
- Final Cloudflare `mflg-public-website`: `022c036e-f1f4-4892-8754-63d61c812e91`, source `main / 3a4741d`.
- Final Cloudflare `mflg-webflow-assets`: `536f7a50-4d99-465d-b933-e1f64e3d4582`, source `main / 3a4741d`.

Final live public JS SHA-256: `4240720a3a429dfc7e6663aac7c6c8b7fe11904f3ac2da707c1806f028803624`

Final live public CSS SHA-256: `9dafcfea9b69c7bbb4ae3bd94f7102f0dfc35c17030cd23f6e4704885ba19cd1`

Final local screenshot contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`
