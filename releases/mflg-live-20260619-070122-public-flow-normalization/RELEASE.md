# MFLG Live Release: Public Flow Normalization

Release name: `mflg-live-20260619-070122-public-flow-normalization`

Deployment date/time: June 19, 2026, approximately 07:01-07:16 America/Phoenix

Deployed asset key: `mflg-live-20260619-070122-public-flow-normalization`

Reviewed branch: `mflg-flow-normalization-final`

Reviewed commits:
- `989ea664c44e9b7940c2eae2007f8ab9a5cc121f` - Normalize MFLG public forms and guide state flow
- `6411065b649d4326db6059e32cc284dc88d9dfe7` - Prevent packet metadata from restoring case county

Release commit: the release branch commit containing this file. The exact release commit hash is recorded in the annotated tag and final release report.

Cloudflare projects:
- `mflg-webflow-assets`
- `mflg-public-website`

Previous deployment IDs:
- `mflg-webflow-assets`: `42cc19b1-0d34-46b6-b2fb-91093086da76`
- `mflg-public-website`: `68127c50-9898-42fc-ba16-70728e785217`

Current deployment IDs:
- `mflg-webflow-assets`: `f4ac103f-1a85-4d05-a3e6-682d8ce28214`
- `mflg-public-website`: `6473428a-6869-4ca8-8527-a98d9b38d3f6`

Live public JS SHA-256:

`0e33462148ce84842750f6c7a6971430dfec367429b25bb4f37f17fa4c7f3df9`

Production routes verified:
- `/`
- `/fees/`
- `/practice-areas/`
- `/guides/`
- `/tools/`
- `/forms/`
- `/calculators/`
- `/start/`

User flows verified:
- Practice Area card matrix: 50/50/50/0
- DIY Guide matrix: 50/50/50/0
- Cross-route public answer persistence
- Packet-source county separate from user case county
- Stale legacy packet metadata cannot restore case county
- Legitimate user-confirmed Maricopa migration remains valid
- Forms & Calculators direct flow
- Guide county gate
- Public completion audit
- Professional fee labels
- Same-site official PDF actions
- Mobile no-overflow spot checks

Known limitations:
- Two image references inside reviewed JavaScript retain the previous image cache key. They are image cache references only; route HTML and public JS/CSS use the deployed release key.
- Packet route-action production verification is partly fixture-based because the live route-action host is conditionally mounted.
- `/staff/` is protected by Cloudflare Access, so public parity is verified through deployment behavior rather than direct static HTML equivalence.
- Matrix expected count remains fixed at 50 as a release contract.

Rollback procedure:
1. Use the Cloudflare Pages rollback mechanism for each project.
2. Restore `mflg-webflow-assets` to deployment `42cc19b1-0d34-46b6-b2fb-91093086da76`.
3. Restore `mflg-public-website` to deployment `68127c50-9898-42fc-ba16-70728e785217`.
4. Verify live HTML no longer references this release asset key.
5. Verify the restored site renders and public JS/CSS load from the prior deployment.

Dirty-main confirmation:

The original dirty `main` worktree was not deployed. The live deployment was performed from isolated staging directory `/private/tmp/mflg-production-deploy-staging-20260619-070122`, assembled from reviewed commits plus production-equivalent deployed assets.
