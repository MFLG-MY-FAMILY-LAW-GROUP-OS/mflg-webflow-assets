# MFLG New User Path Simplicity Release

Release name: `mflg-live-20260620-095749-county-form-evidence-closure`
Deployment date/time: 2026-06-20 09:13 America/Phoenix
Deployed asset key: `mflg-live-20260620-095749-county-form-evidence-closure`
Feature commit: `b07b3fcb6f2e29b1908c80e45e3a2b73ee66c1ca`
Live public JavaScript SHA-256: `9c7ccd6370dca996f87df67dd39f8e4327c8daead8d0e5290bf282e25cd49986`

Cloudflare current deployment IDs:
- mflg-webflow-assets: `86932b32-ea07-4bf6-9a3c-9b5020bda59d`
- mflg-public-website: `4daee475-12b4-4c8a-80c6-ad3b43843353`

Rollback deployment IDs:
- mflg-webflow-assets: `f4ac103f-1a85-4d05-a3e6-682d8ce28214`
- mflg-public-website: `6473428a-6869-4ca8-8527-a98d9b38d3f6`

Production routes verified: `/`, `/fees/`, `/practice-areas/`, `/guides/`, `/tools/`, `/forms/`, `/calculators/`, `/start/`.

Verified behavior:
- Task-first self-help entry points.
- Practice Area matrix 50/50/50/0.
- DIY Guide matrix 50/50/50/0.
- Public answer persistence.
- Packet source county remains separate from user county.
- Same-site PDF delivery through `/api/official-pdf/...`.
- Mobile no-overflow checks.

Known limitations:
- Exact county packet coverage is limited by verified source availability.
- Packet route-action host remains conditionally mounted; local same-origin fixture protects handler behavior.
- Two image references may retain older image cache keys.
- Matrix count is fixed at 50 as a release contract.

The historical dirty worktree was not deployed.
