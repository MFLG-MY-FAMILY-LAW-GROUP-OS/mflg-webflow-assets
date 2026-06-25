# mflg-live-20260620-211200-current-release-action-integrity

Release name: mflg-live-20260620-211200-current-release-action-integrity
Deployment date/time: 2026-06-20 21:12 America/Phoenix
Asset key: mflg-live-20260620-211200-current-release-action-integrity
Release commit: 63e9168e8d70a7f2d6b9ad3164e6915f1291ab8c
Feature commit: eec00ea58293e7913e5660a83348d0e2b8e4fcc3

## Summary

This release narrows the visible Practice Area and DIY Guide action hierarchy so repeated lower-panel shortcuts say `Review form path` as secondary actions while the actual Forms & Calculators bridge remains the dominant `Open matched forms` action.

It also regenerates the owner-acceptance package from the current live asset key and verifies the package has no stale captures, duplicate active CTA labels, or missing primary actions for result states.

## Cloudflare Deployments

- mflg-webflow-assets: 0a01b7dc-bc0d-429e-af4e-762a7880af24
- mflg-public-website: dc9ba6f5-f4d3-4224-a55f-5ccc670aea0f

Rollback deployments:

- mflg-webflow-assets: 732b0a0d-026a-4b4e-9b6b-b45f76828302
- mflg-public-website: 1423fab1-93c3-4688-aa57-998c932911e7

## Live Verification

- Live routes verified with asset key `mflg-live-20260620-211200-current-release-action-integrity`.
- Live public JavaScript SHA-256: `20a8013ce8afed938831b12ed9e9a38b0262d1bb4557d4be915451d011c77d91`.
- Same-site PDF actions remained on `/api/official-pdf/...`.
- No visible external public PDF anchors were detected by the browser checks.

## Owner Acceptance

Owner package:

- `reports/world-class-owner-acceptance.md`
- `data/world-class-owner-acceptance.json`
- `reports/world-class-owner-acceptance-assets/`

Owner status: pending.

## Dirty Worktree Confirmation

The historical dirty worktree was not used, modified, merged, or deployed.

