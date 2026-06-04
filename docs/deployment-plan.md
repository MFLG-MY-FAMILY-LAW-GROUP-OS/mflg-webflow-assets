# MFLG Deployment Plan

## Webstudio Cloud

Use Webstudio Cloud as the visual builder/publish tool after the project is backed up or duplicated. Do not publish until final copy, routes, intake behavior, and domain plan are approved.

## Cloudflare Custom Domain

Webstudio documentation describes adding a custom domain from the Publish dialog and configuring CNAME/TXT records. Cloudflare can standardize root or `www` routing. Verify plan/account limits inside the active project before live use.

## Cloudflare Pages / Export

This repo can be deployed as a static site to Cloudflare Pages. The current site uses static HTML/CSS/JS plus JSON. Required public routes also have static route folders with `index.html` entries, so direct loads work on plain static hosts. `_redirects` remains included as Cloudflare Pages support.

When `index.html` changes, regenerate the route entries:

```bash
node scripts/sync-route-entries.js
```

For local route validation, run:

```bash
node scripts/preview-static.js
```

This preview server serves route folders directly and returns `404.html` with a real `404` status for invalid routes.

## AWS / Hybrid

Static hosting on S3/CloudFront is viable for the public website. Staff and client routes should remain separate protected origins.

## Route Protection

- `/staff-login` must lead to Cloudflare Access or equivalent protection.
- `/client-login` must lead only to an approved client portal, not staff CRM/Vault/Research.
- Staff OS, Twenty CRM, Vault, and legal research must remain separate from the public site.

## Current Webstudio Free Plan Findings

Webstudio pricing/docs reviewed on 2026-06-04 indicate Hobby/Free includes one custom domain, 10,000 page views/month, 300 form submissions/month, unlimited projects/pages, sharing, project export, and forms. Pro adds unlimited custom-domain sites, 100,000 page views with overages, unlimited form submissions, Content Mode, staging publish, backups, animations, advanced sharing, and CMS connections. Verify against the live account before production decisions.

Reference URLs:

- https://webstudio.is/pricing
- https://docs.webstudio.is/university/foundations/publishing-and-custom-domains
- https://docs.webstudio.is/university/self-hosting/download
- https://docs.webstudio.is/university/core-components/webhook-form
- https://docs.webstudio.is/university/foundations/cms
