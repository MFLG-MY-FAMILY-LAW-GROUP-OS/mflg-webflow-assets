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

- Live key: `mflg-live-20260626-145858-form-path-unification`
- Tag: `mflg-live-20260626-145858-form-path-unification`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `70855ada93fa97cfb451eae4e762e2f332eac44cbdf4acbd32b65fb0b16b98e1`
- Public CSS SHA-256: `982d768a98834f27cbb6b7c4240dd9ad34a91ded8d068274c98745443cbc1c26`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `b28ef171-d919-4186-9ed1-3f3e193f2aff`
- Current `mflg-webflow-assets` deployment: `6dc8f87d-6541-4493-9e86-69bb270d3d3b`
- Rollback `mflg-public-website` deployment: `3ad0e7da-8e90-4afd-8aab-0b8bcaf73327`
- Rollback `mflg-webflow-assets` deployment: `f74ea1d1-5493-4ef0-85ee-c839785e4d40`
- Prior rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Prior rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label status: current public bytes are verified. Final clean redeploy after the release commit should show the release commit short SHA for both Cloudflare production deployments.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: expected at `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets/releases/tag/mflg-live-20260626-145858-form-path-unification` after tag push.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
