# CRM lead form specification

## User outcome

A user can add a lead, see it immediately, reload the page without losing it,
and move the deal to the next stage.

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
4. The stage action moves a lead to the next declared stage.
5. A changed stage also survives a page reload.
6. Corrupt or unexpected stored JSON does not crash the page.
7. The page remains usable at desktop and mobile widths.

## Out of scope

Authentication, server infrastructure, remote databases, real CRM or telephony,
WhatsApp, Telegram, and API integrations.
