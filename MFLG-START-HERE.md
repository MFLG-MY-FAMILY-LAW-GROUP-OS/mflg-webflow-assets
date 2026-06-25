# MFLG Current Production Source

Production reference:
`/Users/jeremyjamesjack/Documents/Codex/MFLG-Current-Production`

Release tag:
`mflg-live-20260623-185532-form-reveal-priority`

Release commit:
`72cce7c12ceec8e0dc69868f40b52b0637e95c2b`

Deployed source commit:
`429c19a`

Production asset key:
`mflg-live-20260623-185532-form-reveal-priority`

Public JavaScript SHA-256:
`ee0f2b77ea2579add8aa41205cf0043fb2d45362362b8cac084c70c529ad0009`

Public CSS SHA-256:
`cb2bbb9026c3a9f59e7af3e65dd6b87bd0c2de0527ada5f08b59bc88191044f0`

Cloudflare production deployments:

- `mflg-public-website`: `76f0902c-4433-49db-8f69-056778b46bda`
- `mflg-webflow-assets`: `6266d8b0-6860-43fb-b355-aba1ebd3c01a`

Rollback deployments:

- `mflg-public-website`: `e16b0ae2-2d6a-4491-939a-c8c2d4716d31`
- `mflg-webflow-assets`: `ecbfe130-3433-47c4-a997-fa31c0d54373`

## Critical Rule

The production reference is read-only.

Do not:

- edit there;
- commit there;
- run feature-development Codex sessions there;
- deploy directly from there;
- switch it to main.

## Starting Future Work

Future work must start from MFLG-Current-Production, not historical dirty worktrees, stale previews, or evidence branches.

Historical dirty worktree - never use, edit, review, or deploy:
`/Users/jeremyjamesjack/Documents/Codex/2026-05-25/spreadsheets-plugin-spreadsheets-openai-primary-runtime/mflg-webflow-assets`
