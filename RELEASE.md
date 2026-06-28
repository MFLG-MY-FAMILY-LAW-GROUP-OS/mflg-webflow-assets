# MFLG Intake Release Control

## Public Website Release: mflg-live-20260627-163258-result-pruning

- Source branch: `mflg-live-20260625-final-yolo-stabilization`
- Asset key: `mflg-live-20260627-163258-result-pruning`
- Source commit: `ebe0f96c2a40fa9227861297f531c5f1131fda7a`
- Public JS SHA-256: `5b258f58dc8a3996a8f9db4f0587253f3fed8e01a9d39d90ae39bbb06be0ec18`
- Public CSS SHA-256: `5798b12b682d3bf5255b7e5844046773918d34fa601a9bb8c2933038acd3c602`
- Cloudflare `mflg-public-website`: `5a4e640f-d314-4154-ab2f-644e6a64b84c`
- Cloudflare `mflg-webflow-assets`: `5c248d22-95bf-476d-8310-948d96b12e5a`
- Rollback deployments: `95336229-04b8-49a5-96da-3ff8d5f7267d` and `ffed2fce-f852-4f7e-a5ae-151a6d90217c`
- Cloudflare source label: `main / ebe0f96`
- Evidence contact sheet: `reports/final-public-text-layout-qa/screenshot-contact-sheet.html`
- Public text/layout QA: pass across widths 320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, and 1920.
- Scope: Forms result pruning. The matched form result now reads before alternate packet controls; alternate form groups are collapsed behind `Browse other form groups`; old `Unified result summary`, `Recommended result`, `Other official resources`, and `Open matched forms` labels were replaced with user-facing copy; and matched packets no longer auto-open or check a form before the user clicks `View form`.

In accordance with MP v2, this repository treats the intake as production software, not a one-off Webflow embed.

## Current Production Intake

- Production JS source: `js/mflg-intake.js`
- Production CSS source: `css/mflg-intake.css`
- Current intake version: `3.6.0-worldclass-routing`
- Current known-good commit: pending merge
- Current n8n webhook: `https://jeremyjamesjack.app.n8n.cloud/webhook/mflg-intake`

## Immutable Release Copies

Each meaningful production intake release should also be copied into:

- `js/releases/mflg-intake-[version].js`
- `css/releases/mflg-intake-[version].css`

Current release copies:

- `js/releases/mflg-intake-3.6.0-worldclass-routing.js`
- `css/releases/mflg-intake-3.6.0-worldclass-routing.css`

These copies make rollback review simple even if `main` keeps moving.

## Preferred Webflow Embed

For the cleanest future release process, Webflow should eventually load the stable production URL:

```html
<div id="mflg-intake-root">
  <div style="padding: 32px; text-align: center; font-family: Arial, sans-serif;">
    Loading intake form...
  </div>
</div>

<link rel="stylesheet" href="https://assets.myfamilylawgroup.com/css/mflg-intake.css">

<script defer src="https://assets.myfamilylawgroup.com/js/mflg-intake.js"></script>
<script defer src="https://assets.myfamilylawgroup.com/js/mflg-site-reveal-pathways-v2.2.js?v=2.2.1"></script>
```

With this pattern, routine intake changes happen in GitHub/Cloudflare and Webflow does not need a version-string edit for every release.

## Current Cache-Bust Embed

If Webflow is still using query-string cache busting, use:

```html
<script defer src="https://assets.myfamilylawgroup.com/js/mflg-intake.js?v=3.6.0-worldclass-routing"></script>
```

Do not change the n8n webhook, root element, CSS URL, payload fields, or reveal-pathways script unless a separate release specifically requires it.

## CRM OS Transition Note

Version `3.6.0-worldclass-routing` preserves the existing n8n webhook and legacy intake payload fields so the current Sheets landing can continue temporarily. It also adds CRM-ready routing metadata (`routeKey`, `issueDetail`, `presetAnswersJSON`, and enriched `routingContextJSON`) so n8n can later forward the same submissions into CRM OS without another public intake redesign.

## Pre-Release Checklist

1. Confirm the worktree is clean or only contains intended release files.
2. Run:

   ```bash
   ./scripts/check-intake-release.sh
   ```

3. Confirm `js/mflg-intake.js` is JavaScript only, not an HTML helper wrapper.
4. Confirm the n8n webhook URL is unchanged.
5. Confirm normal text fields do not trigger full re-render while typing.
6. Confirm `childCurrentCityState` still does not trigger `render()` on input.
7. Confirm `node --check js/mflg-intake.js` passes.
8. Create/update immutable release copies under `js/releases/` and `css/releases/`.
9. Merge through a PR unless this is an emergency production fix.
10. Test in a fresh private/incognito browser window.

## Required Live Deployment

Local release checks are not enough. The live asset host must be updated through Cloudflare Pages and then verified from the public CDN.

Use:

```bash
CLOUDFLARE_API_TOKEN="$(security find-generic-password -s CLOUDFLARE_API_TOKEN -w)" \
./scripts/deploy-all-live-assets.sh
```

This deploys and verifies both live hosts:

- `mflg-webflow-assets` for `assets.myfamilylawgroup.com`
- `mflg-public-website` for `myfamilylawgroup.com`

Use the single-project `deploy-live-assets.sh` only for emergency targeted deploys. Intake routing changes must go through `deploy-all-live-assets.sh`, otherwise one host can remain stale.

The deploy script:

- syncs static route entries
- runs the intake release checks
- creates immutable release copies
- deploys the asset directory with Wrangler
- verifies `https://assets.myfamilylawgroup.com/js/mflg-intake.js` serves the expected version
- fails if credentials are missing or the live CDN remains stale

Do not mark an intake/site asset change complete unless this script verifies the live asset version.

## Manual UI Test Checklist

Before any submission tests:

1. Clean intake path shows no consistency warnings.
2. No case filed + case number shows a clarification.
3. Hearing date tomorrow shows urgent call language.
4. Hearing/deadline within five days shows preparation-time warning.
5. Future child DOB is blocked.
6. Minor children = No + child details shows clarification.
7. Child Current City/State typing does not lose focus.
8. Safety concern shows emergency disclaimer.
9. Scope/referral issue shows scope review language.
10. Back/Next navigation still preserves answers.

After UI passes:

1. Submit one normal test.
2. Confirm Google Sheet row appears.
3. Confirm internal email arrives.
4. Confirm client confirmation email arrives.
5. Submit one urgent test.
6. Confirm priority/recommended path/flags still populate.

## Rollback

Fastest rollback if Webflow is using query strings:

```html
<script defer src="https://assets.myfamilylawgroup.com/js/mflg-intake.js?v=3.5.0-consult-prep"></script>
```

Git rollback reference for the pre-consistency release:

- `32827f2` - consult-prep release

Emergency restore command for repo maintainers:

```bash
git revert 4983ef0
```

Only use rollback after confirming the issue is in the intake asset release, not n8n, Webflow caching, or a browser cache.
