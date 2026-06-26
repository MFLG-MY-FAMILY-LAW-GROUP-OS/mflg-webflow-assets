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

- Live key: `mflg-live-20260626-061608-plain-public-text`
- Tag: `mflg-live-20260626-061608-plain-public-text`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `828f086cea4c65acf443016088fc9f96db26910fda7ac153d99bcfcbf3887a1a`
- Public CSS SHA-256: `2101dda7b726d62890b47d224982f477998fc4186cc0a195ebd9c23e1bf89f18`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `43fe3038-0a8e-4db2-89cc-0052c51880b7`
- Current `mflg-webflow-assets` deployment: `ff0f4041-c8a7-472a-9174-81e15c1e5fe1`
- Rollback `mflg-public-website` deployment: `70af2631-1edb-4e6b-962b-4d59afd9cdc7`
- Rollback `mflg-webflow-assets` deployment: `50803fd3-bbf3-4e82-91c3-7095d4a651d9`
- Prior rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Prior rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label status: the prior live deployment was reported as `main / 778f63e` while the verified prior release tag peeled to `95ac303ffa561636c76ce1e549934cd18ec86552`. The current Cloudflare production deployments show `main / 7c4e2ad`, created from the clean durable checkout above before this release metadata commit was created. The custom-domain bytes and hashes above are verified.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: not present as of June 26, 2026; branch and tag are pushed, and `gh` is not installed in the local shell.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
