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

- Live key: `mflg-live-20260626-122120-diy-guide-flow-reset`
- Tag: `mflg-live-20260626-122120-diy-guide-flow-reset`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `f4e4288aee63029320005715aa44a8cbe4d38638a76f6c1574618e22ced1bf31`
- Public CSS SHA-256: `620b26a7ae379fb55194cb82a1242f377a0c1e95bebef9fb8f6767e2fb96b144`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `58cab3e0-333b-4a22-a26a-6a2bb1e6738d`
- Current `mflg-webflow-assets` deployment: `6cd34db0-7d6d-4114-beec-e3e9a3445d60`
- Rollback `mflg-public-website` deployment: `2c4c5935-4b75-4e4e-a3ac-cae441e83781`
- Rollback `mflg-webflow-assets` deployment: `af183df3-560a-4cf4-81f6-4518df416a76`
- Prior rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Prior rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label status: the prior live deployment was reported as `main / 778f63e` while the verified prior release tag peeled to `95ac303ffa561636c76ce1e549934cd18ec86552`. The current Cloudflare production deployments initially showed `main / 9643443` because the deploy ran before this release commit was created; a clean redeploy from the final tag should update the source label. The custom-domain bytes and hashes above are verified.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: not present as of June 26, 2026; branch and tag are pushed, and `gh` is not installed in the local shell.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
