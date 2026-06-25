# MFLG Current Production Source

Start future Codex sessions from:

```bash
cd /Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production && codex
```

Do not start from `~`.
Do not use the historical dirty worktree.
Do not run `/review`.
Do not treat old previews, owner packages, evidence branches, or stale reports as source of truth.

## Current Release

- Live key: `mflg-live-20260625-101441-final-yolo-stabilization`
- Tag: `mflg-live-20260625-101441-final-yolo-stabilization`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `f6066bedf397127016dd4339ad6135ce1d392abaadf699dec00d2fc8329f48cf`
- Public CSS SHA-256: `264befff1b2d6db260d8e96346640a11c1be5b9360d164983bd11a3f327e18c8`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Previous verified `mflg-public-website` deployment: `3f56de2f-d233-47a9-a9fd-21e231335769`
- Previous verified `mflg-webflow-assets` deployment: `cc1b036f-afee-4a30-9ac8-a6016709f268`
- Rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label caveat: the prior live deployment was reported as `main / 778f63e` while the verified prior release tag peeled to `95ac303ffa561636c76ce1e549934cd18ec86552`. This release uses the clean durable checkout above; verify the final Cloudflare deployment IDs in `deployment-manifest.json` after deploy.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: create or verify after branch and tag push if safe authenticated tooling is available.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
