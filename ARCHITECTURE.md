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
- `app/lib/leads.ts` owns the lead model, validation, and allowed stage values.
- `app/lib/lead-storage.ts` owns serialization and the versioned storage key.

UI code must not call `localStorage` directly. Stored JSON is treated as
untrusted input and filtered through `isLead` before it reaches the UI. The
guard rejects empty required values and invalid timestamps so a malformed
record cannot break card rendering.

## Persistence

Leads are stored as a JSON array under `form-crm:leads:v1`. This is intentionally
device-local: clearing browser data removes the leads, and different browsers
do not share them.

## Quality gates

Formatting, linting, and strict typechecking enforce consistency. A structural
test keeps browser storage behind its adapter. Server-rendered tests ensure the
product shell and form remain present. Browser tests verify validation,
creation, failure handling, reload persistence, safe recovery from damaged
storage, responsive overflow, and stage updates.
