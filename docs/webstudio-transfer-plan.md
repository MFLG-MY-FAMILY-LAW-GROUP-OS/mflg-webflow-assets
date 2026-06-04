# Webstudio Transfer Plan

## Current Project Assumption

The screenshot addendum reports Webstudio project `MFLG (Website)` is not published and appears blank or near-blank, showing only `Global root` and `<body>` in Builder Navigator. This repo treats the Webstudio project as a destination shell unless direct inspection proves otherwise.

## Safety Rules

- Do not publish without explicit approval.
- Do not delete or overwrite the Webstudio project without duplicate/export/backup planning.
- Do not edit upstream `webstudio-is/webstudio` as the MFLG website.
- Keep source of truth in this MFLG-owned repo.

## Manual Transfer

1. Open the Webstudio project and confirm Pages, Assets, Components, Tokens, Resources, Forms, and Publish settings.
2. Duplicate or export before destructive edits if Webstudio offers that option.
3. Recreate global tokens from `css/mflg-public-site.css`.
4. Build header and footer first.
5. Add pages following `docs/route-content-map.md`.
6. Add DIY guides as static data or copied static guide cards, not Webstudio CMS.
7. Add intake via HTML/script embed using the existing `mflg-intake` assets.
8. Keep login routes as protected external links/placeholders until route protection is approved.

## Automation Status

No Webstudio API/MCP/CLI access was available in this Codex environment during this pass. Webstudio documentation indicates Builder download/export and Webstudio CLI export exist, but direct cloud project automation was not proven available here.
