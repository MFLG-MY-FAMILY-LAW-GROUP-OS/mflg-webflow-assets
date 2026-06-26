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

- Live key: `mflg-live-20260625-113245-hero-loop-smooth`
- Tag: `mflg-live-20260626-050859-original-hero-video`
- Release commit: the commit pointed to by the tag in the durable checkout. Verify with `git rev-parse HEAD` and `git describe --exact-match --tags HEAD`.
- Public JS SHA-256: `ad93e915d77f2c9700aec95b480d10367cb6294571c196aef1ab34e934a79e34`
- Public CSS SHA-256: `17d80bf4e6faa24e2cd0dc34f54a9037f1d1da0eb5933a673ee286832ffbb376`
- Current-production pointer: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`
- Durable release checkout: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260625-final-yolo-stabilization-git`
- Preserved prior release evidence: `/Users/jeremyjamesjack/Documents/Codex/MFLG-Releases/mflg-live-20260624-233508-hero-reveal-intelligence`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`

## Cloudflare

- Current `mflg-public-website` deployment: `92894115-e94d-4d23-9beb-a4a86ec93dd9`
- Current `mflg-webflow-assets` deployment: `e76acb76-0eee-4000-84d4-21804c5f44b3`
- Rollback `mflg-public-website` deployment: `ec14564a-4f20-4ac9-ab80-2ced1a42e787`
- Rollback `mflg-webflow-assets` deployment: `2c9a9491-9c66-4927-a85c-df314632de2e`
- Prior rollback `mflg-public-website` deployment: `76f0902c-4433-49db-8f69-056778b46bda`
- Prior rollback `mflg-webflow-assets` deployment: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`
- Source-label status: the prior live deployment was reported as `main / 778f63e` while the verified prior release tag peeled to `95ac303ffa561636c76ce1e549934cd18ec86552`. The new Cloudflare production deployments show `main / d6fa947`, created from the clean durable checkout above.

## GitHub

- Repository: `https://github.com/MFLG-MY-FAMILY-LAW-GROUP-OS/mflg-webflow-assets.git`
- Branch: `mflg-live-20260625-final-yolo-stabilization`
- GitHub Release object: not present as of June 26, 2026; branch and tag are pushed, and `gh` is not installed in the local shell.

## Never Use

Historical dirty worktree:

`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
