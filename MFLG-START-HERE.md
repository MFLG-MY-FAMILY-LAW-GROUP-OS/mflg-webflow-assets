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

- Live key: `mflg-live-20260626-085600-choose-eyebrow-align`
- Tag: `mflg-live-20260626-085600-choose-eyebrow-align`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `abf3f2eace306ee05921e2822a8f2561f61f4ef408d8b88163bae949dbaf7305`
- Public CSS SHA-256: `968c0034ad8a582729b2abff2f7ad616fc6bd0a952afced93759d546a72a2fc8`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `bc4fc4bc-bfdc-4cd5-a96a-fd0c38b59061`
- Current `mflg-webflow-assets` deployment: `205522aa-f13a-4fb8-9280-ed1069101eb4`
- Rollback `mflg-public-website` deployment: `f3bc558d-98d4-4c80-890b-f3fd6c7bff88`
- Rollback `mflg-webflow-assets` deployment: `7f969e73-c91d-4ce5-9050-5655f94fcd88`
- Prior rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Prior rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label status: the prior live deployment was reported as `main / 778f63e` while the verified prior release tag peeled to `95ac303ffa561636c76ce1e549934cd18ec86552`. The current Cloudflare production deployments show `main / 49bf900`, created from the clean durable checkout above before this release metadata commit was created. The custom-domain bytes and hashes above are verified.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: not present as of June 26, 2026; branch and tag are pushed, and `gh` is not installed in the local shell.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
