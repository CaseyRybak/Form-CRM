# Repository guide

This file is a map. Deeper decisions live in the linked documents.

## Product

- Product requirements: `docs/product-specs/crm-lead.md`
- Architecture and boundaries: `ARCHITECTURE.md`
- Execution plans: `docs/exec-plans/`
- User-facing setup and demo: `README.md`

## Code map

- `app/components/lead-crm.tsx`: UI, form events, rendering
- `app/lib/leads.ts`: lead types, validation, stage transitions
- `app/lib/lead-storage.ts`: the only localStorage boundary
- `app/globals.css`: site-wide visual system
- `tests/e2e/`: browser acceptance tests
- `tests/rendered-html.test.mjs`: server-rendered structure checks

## Required checks

Run these before declaring work complete:

1. `npm run format:check`
2. `npm run lint`
3. `npm test`
4. `npm run test:e2e`

`npm run check` runs the complete sequence.

## Invariants

- Keep the product a single-page CRM unless the product spec changes.
- Persist leads only through `app/lib/lead-storage.ts`.
- Validate external or stored data at the boundary before rendering it.
- Keep required-field errors visible and associated with their inputs.
- Every behavior change must update an executable test or acceptance criterion.
- Do not add authentication, backend storage, or external integrations without
  an explicit product decision.
- Prefer small, reviewable changes and update repository documentation when a
  decision changes.
