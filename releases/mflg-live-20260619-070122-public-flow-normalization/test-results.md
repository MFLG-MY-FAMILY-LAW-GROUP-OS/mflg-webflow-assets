# Test Results

Release: `mflg-live-20260619-070122-public-flow-normalization`

Local staging results:
- `node --check js/mflg-public-site.js`: pass
- `npm run test:public-surface`: `PUBLIC_SURFACE_VALIDATION_PASS`
- `npm run test:practice-area-matrix`: `PRACTICE_AREA_MATRIX_PASS`
- Practice Area matrix: expected=50, discovered=50, opened=50, asserted=50, skipped=0
- `npm run test:diy-guide-matrix`: `DIY_GUIDE_MATRIX_PASS`
- DIY Guide matrix: expected=50, discovered=50, opened=50, asserted=50, skipped=0
- `npm run test:public-answer-persistence`: `PUBLIC_ANSWER_PERSISTENCE_PASS`
- `npm run test:packet-route-action`: `PACKET_ROUTE_ACTION_PASS`
- `npm run test:forms-tools`: `PLAYWRIGHT_FORMS_TOOLS_GUIDED_FLOW_PASS`
- `npm run test:guide-county-gate`: `PLAYWRIGHT_GUIDE_COUNTY_GATE_PASS`
- `npm run test:public-completion`: `PUBLIC_COMPLETION_AUDIT_PASS`

Production results:
- `npm run test:practice-area-matrix`: `PRACTICE_AREA_MATRIX_PASS`
- Practice Area matrix: expected=50, discovered=50, opened=50, asserted=50, skipped=0
- `npm run test:diy-guide-matrix`: `DIY_GUIDE_MATRIX_PASS`
- DIY Guide matrix: expected=50, discovered=50, opened=50, asserted=50, skipped=0
- `npm run test:public-answer-persistence`: `PUBLIC_ANSWER_PERSISTENCE_PASS`
- `npm run test:packet-route-action`: `PACKET_ROUTE_ACTION_PASS`
- `npm run test:forms-tools`: `PLAYWRIGHT_FORMS_TOOLS_GUIDED_FLOW_PASS`
- `npm run test:guide-county-gate`: `PLAYWRIGHT_GUIDE_COUNTY_GATE_PASS`
- `npm run test:public-completion`: `PUBLIC_COMPLETION_AUDIT_PASS`

Rendered production spot checks:
- Professional fee-title verification: pass
- Same-site PDF verification: pass, 85 `/api/official-pdf/...` actions visible, zero external public PDF anchors
- Mobile no-overflow verification: pass on `/`, `/fees/`, `/practice-areas/`, `/guides/`, `/tools/`, `/forms/`, `/calculators/`
- All 15 Arizona counties plus Not sure visible where county is asked: pass
- Packet-source county remains separate from user county: pass
