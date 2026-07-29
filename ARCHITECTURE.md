# Architecture

## Goal

The application is a single-page lead tracker with device-local persistence.
The architecture stays deliberately small while keeping business rules,
browser storage, and rendering separately legible.

## Boundaries

```text
Page → LeadCrm UI → lead domain rules → localStorage adapter
```

- `app/page.tsx` mounts the product.
- `app/components/lead-crm.tsx` owns React state and user events.
- `app/lib/leads.ts` owns the lead model, validation, and stage order.
- `app/lib/lead-storage.ts` owns serialization and the versioned storage key.

UI code must not call `localStorage` directly. Stored JSON is treated as
untrusted input and filtered through `isLead` before it reaches the UI.

## Persistence

Leads are stored as a JSON array under `form-crm:leads:v1`. This is intentionally
device-local: clearing browser data removes the leads, and different browsers
do not share them.

## Quality gates

Formatting and linting enforce consistency. Server-rendered tests ensure the
product shell and form remain present. Browser tests verify validation,
creation, reload persistence, and stage updates.
