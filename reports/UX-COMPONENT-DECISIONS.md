# UX Component Decisions

## Official Patterns Applied

Research sources:

- Google Support Help Center: topic-first help center structure. https://support.google.com/business/
- Apple Support: product/topic-first support and repair flows. https://support.apple.com/
- Microsoft Support: "What do you need help with today?" product/task chooser. https://support.microsoft.com/en-us
- Webstudio Collections: design once, repeat data-driven items. https://docs.webstudio.is/university/core-components/collection
- Webstudio Radix Tabs: panels shown one at a time. https://docs.webstudio.is/university/radix/tabs
- Webstudio Dialog/Sheet: modal or slide-out content with page beneath inert. https://docs.webstudio.is/university/radix/dialog and https://docs.webstudio.is/university/radix/sheet
- W3C ARIA APG patterns for tabs, disclosure, dialog, button, and link. https://www.w3.org/WAI/ARIA/apg/patterns/
- GOV.UK question pages and check answers patterns. https://design-system.service.gov.uk/patterns/question-pages/ and https://design-system.service.gov.uk/patterns/check-answers/
- USWDS Card and Accordion guidance. https://designsystem.digital.gov/components/card/ and https://designsystem.digital.gov/components/accordion/

## MFLG Decisions

Homepage:
- Pattern: task chooser followed by issue finder.
- Why: matches public support workflows: search or choose topic, choose task, answer necessary questions, see one result.
- Keyboard/focus: links are real anchors; hero static labels are non-interactive.
- Mobile: task choices stack; hero labels remain one horizontal row.
- Rejected: duplicated adjacent task panels and process-proof-first ordering.

Practice Area catalog:
- Pattern: data-driven card collection with search and six real filter buttons.
- Why: 50 items remain accessible without duplicating 50 layouts or requiring tabs.
- Keyboard/focus: each filter is a button with `aria-pressed`; each card has one button.
- Mobile: same card anatomy, one CTA.
- Rejected: card-level fake buttons, tabs inside cards, decorative interactive pills.

DIY Guide catalog:
- Pattern: data-driven card collection derived from the same structured issue source.
- Why: preserves 50 guide cards while keeping maintenance centralized.
- Keyboard/focus: one "Open guide" button per card; filters match Practice Areas.
- Mobile: one-column cards with summary visible.
- Rejected: per-card Intake buttons and form/calculator mini dashboards.

Shared task workspace:
- Pattern: progressive disclosure states: Choose, Answer, Confirm, Result.
- Why: follows GOV.UK question-page/check-answer principles and prevents all future options from being active at once.
- Keyboard/focus: inactive states are hidden and inert; same-page actions call `revealAndFocus`.
- Mobile: one active state, one task section at a time.
- Rejected: card -> pills -> tabs -> panels -> fallback action chain.

Filters:
- Pattern: real button filters, not tabs.
- Why: filters change result sets and counts; tabs would imply peer panels.
- Keyboard/focus: button activation; `aria-pressed` state.
- Mobile: wrapping filter group with clear action.
- Rejected: select-only guide filtering and tab-like chips.

Tabs:
- Pattern: no public catalog/card tabs retained.
- Why: no current public catalog control is a true peer panel tab interface.
- Keyboard/focus: if future tabs are added, they must implement one tablist, one selected tab, one visible panel, and arrow/Home/End behavior.
- Rejected: Webflow-looking `w-tab-*` classes as behavior.

Disclosures:
- Pattern: optional details only.
- Why: USWDS warns accordions add decision cost; required qualification must remain visible in the active workspace state.
- Keyboard/focus: native disclosure buttons/summaries where used.
- Mobile: collapsed optional details reduce scan burden.
- Rejected: hiding required questions inside accordions.

PDF viewer:
- Pattern: one same-site viewer model plus secondary download.
- Why: Webstudio Dialog/Sheet guidance and ARIA dialog guidance support one focused viewer with inert background; current implementation uses the existing same-site viewer panel until a full dialog migration.
- Keyboard/focus: viewer reveal uses `revealAndFocus`; same-site `/api/official-pdf/...` links only.
- Mobile: same model, full-width viewer panel.
- Rejected: competing "preview", "standalone viewer", and external PDF choices.
