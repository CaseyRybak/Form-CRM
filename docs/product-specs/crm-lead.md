# CRM lead form specification

## User outcome

A user can add a lead, see it immediately, reload the page without losing it,
and choose any declared stage for the deal.

## Fields

- Client name — required text.
- Phone number — required telephone text.
- Source — `Холодный` or `Тёплый`.
- Owner — `Лидоруб` or `МОП`.
- Stage — `Новый лид`, `Квалифицирован`, `Назначена консультация`, or `Отказ`.
- `Запрошено ТЗ` — boolean.

## Acceptance criteria

1. Submitting an empty form shows errors for name and phone and saves nothing.
2. A valid submission appears as a card with every entered value.
3. Saved leads survive a normal page reload.
4. The stage action opens a menu with all declared stages and applies the selected stage.
5. A changed stage also survives a page reload.
6. Corrupt or unexpected stored JSON does not crash the page.
7. The page remains usable at desktop and mobile widths.
8. The card explicitly shows whether the specification was requested.
9. The user can change a saved lead to any of the four declared stages, including moving away from `Отказ`.

## Out of scope

Authentication, server infrastructure, remote databases, real CRM or telephony,
WhatsApp, Telegram, and API integrations.
