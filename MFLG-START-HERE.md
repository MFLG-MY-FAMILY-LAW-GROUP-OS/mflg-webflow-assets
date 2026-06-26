# MFLG Current Production Source

Preferred future Codex session command:

```bash
cd /Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production && codex
```

If a session opens somewhere else, switch project commands to the current-production pointer above before inspecting or modifying the site.
Do not use the historical dirty worktree.
Do not run `/review`.
Do not treat old previews, owner packages, evidence branches, or stale reports as source of truth.

## Current Release

- Live key: `mflg-live-20260626-141751-decision-flow-clarity`
- Tag: `mflg-live-20260626-141751-decision-flow-clarity`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `80a1b506481f3c5c05b5055ae2b5cdce10dc0bf8d246a5d15557176c50d21daf`
- Public CSS SHA-256: `ce69918eb056e8a3b89d70c14c4d6267b6659e17b60d055f1bec103691b33a28`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `3ad0e7da-8e90-4afd-8aab-0b8bcaf73327`
- Current `mflg-webflow-assets` deployment: `f74ea1d1-5493-4ef0-85ee-c839785e4d40`
- Rollback `mflg-public-website` deployment: `2abd05d9-6068-40ba-9b98-403216edcff9`
- Rollback `mflg-webflow-assets` deployment: `d39e9365-d186-4904-b066-e9233edd10d6`
- Prior rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Prior rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label status: current public bytes are verified. Final clean redeploy after the release commit should show the release commit short SHA for both Cloudflare production deployments.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: expected at `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets/releases/tag/mflg-live-20260626-141751-decision-flow-clarity` after tag push.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
