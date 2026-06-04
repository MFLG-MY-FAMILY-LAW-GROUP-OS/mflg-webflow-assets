# Intake, n8n, and CRM Contract

## Discovered Intake Endpoint

The existing intake release docs and JavaScript identify:

`https://jeremyjamesjack.app.n8n.cloud/webhook/mflg-intake`

This URL is documented, not validated as successfully receiving submissions in this pass.

## Local n8n Verification

- Docker running containers showed only `buildx_buildkit_default`.
- `law-crm-stack/docker-compose.yml` includes Twenty CRM, document-vault, legal-research, ClamAV, MinIO, and supporting services.
- No local n8n service was found in that compose file.

## CRM Endpoint Status

The Staff OS repo references Twenty at `https://staging-crm.myfamilylawgroup.com` and plans CRM objects for contacts, intakes, consults, matter stubs, tasks, referral sources, and vault statuses. A direct public website-to-CRM intake endpoint/schema was not found in this pass.

## Payload Contract

The existing `js/mflg-intake.js` builds the canonical intake payload and submits it to n8n. A future CRM bridge should preserve:

- intake id
- contact information
- issue pathway
- urgency and safety flags
- court date/deadline fields
- child/support/order fields where applicable
- referral/scope flags
- recommended path and next action
- explicit consent/disclaimer acknowledgments

## Do Not Fake

Do not report successful n8n or CRM integration until a test submission is sent through the approved endpoint and verified in the intended destination. Google Sheets may remain a legacy/reference destination, not the final CRM intake system of record.
