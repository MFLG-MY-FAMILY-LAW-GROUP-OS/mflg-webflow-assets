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

- Live key: `mflg-live-20260626-133242-guided-flow-clarity`
- Tag: `mflg-live-20260626-133242-guided-flow-clarity`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `2c7395c18e76ce0ed556dc53eaed54e61784bc1c6459e4fdb1b5841eca12ec5b`
- Public CSS SHA-256: `b4e788f7993c4a67ed98d1666497127831bd3470593ae04ea6606f6e3ec2bec4`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `1fec866b-b076-4d29-b657-5d42d86d57bf`
- Current `mflg-webflow-assets` deployment: `013ab080-e487-4379-a437-49f50a0736cb`
- Rollback `mflg-public-website` deployment: `6e64384e-e306-49be-a933-a1977ceabf81`
- Rollback `mflg-webflow-assets` deployment: `f891ad66-ddb0-4fe4-b9cc-51075294d323`
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
