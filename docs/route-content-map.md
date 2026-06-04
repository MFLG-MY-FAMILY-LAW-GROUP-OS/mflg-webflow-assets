# MFLG Public Website Route and Content Map

Source repo: `mflg-webflow-assets`

## Routes

| Route | Status | Source |
| --- | --- | --- |
| `/` | Built | Static route in `js/mflg-public-site.js` |
| `/practice-areas` | Built | Static route |
| `/fees` | Built | Static route |
| `/guides` | Built | Static route with `data/diy-guides.json` |
| `/about` | Built with verification note | Local profile asset candidate |
| `/faq` | Built | Static route |
| `/contact` | Built | Static route |
| `/start` | Built | Existing `mflg-intake.js` embed |
| `/client` | Placeholder | Awaits approved client portal URL |
| `/staff` | Placeholder | Awaits protected Staff OS route decision |
| `/client-login` | Alias placeholder | Backward-compatible client route alias |
| `/staff-login` | Alias placeholder | Backward-compatible staff route alias |
| `/privacy` | Draft placeholder | Legal/user approval required |
| `/terms` | Draft placeholder | Legal/user approval required |
| `/accessibility` | Draft placeholder | Audit required |
| `/thank-you` | Built placeholder | Needs live form redirect decision |
| `/404` | Built | Static SPA fallback |

## Design Tokens

Tokens are defined in `css/mflg-public-site.css`: ink, muted, paper, surface, line, forest, teal, gold, clay, focus, shadow, radius, and max content width.

## DIY Guides

Guides are static JSON in `data/diy-guides.json`. Search and category filtering happen client-side and do not require Webstudio CMS.

## Intake

The `/start` route uses the existing production intake files:

- `js/mflg-intake.js`
- `css/mflg-intake.css`

The documented webhook remains `https://jeremyjamesjack.app.n8n.cloud/webhook/mflg-intake`. Local Docker inspection did not show n8n running.
