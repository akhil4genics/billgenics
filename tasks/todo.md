# Recurring Bills POC

## The user's problem (summarized from request)

A family with many bills landing at unpredictable dates from different providers
across different channels (email/SMS/app). Manual tracking apps collapse when life
gets busy. Unexpected renewals/bills cause monthly cash-flow stress. They want a
*real, practical, low-maintenance system* — something automated.

## Why BillGenics is the right place to solve this

The app already tracks one-off bills (scan/manual), categorises them, indexes them
for search, and has an in-app notifications model. What's missing is the
*forward-looking* layer — a schedule of expected recurring bills + reminders +
forecast. That's the gap this POC closes.

## Solution shape

A new "Recurring Bills" module:

1. **`RecurringBill` model** — provider/name, amount (estimated), category, cadence
   (weekly | fortnightly | monthly | quarterly | yearly | custom-N-days),
   `nextDueDate`, `lastPaidDate`, `reminderDaysBefore`, channel (email/sms/app/
   direct-debit/manual), status (active/paused/cancelled).
2. **CRUD API** — `/api/recurring` routes (list, create, update, delete).
3. **Forecast endpoint** — `/api/recurring/forecast?days=N` returns the next
   instances projected into a flat timeline with running total. The dashboard
   widget reads this.
4. **Mark-paid endpoint** — `POST /api/recurring/:id/mark-paid` rolls
   `nextDueDate` forward by the cadence and stamps `lastPaidDate`. Optionally
   links to a `Bill._id` (so a scanned receipt closes the loop).
5. **Auto-detect suggestions** — `/api/recurring/suggestions` looks at the user's
   past `Bill`s, groups by `storeName`, and proposes recurring schedules where
   it sees ≥2 same-store bills with a roughly regular interval (the user's
   "I scan electricity every quarter, suggest tracking it" win).
6. **Run-reminders endpoint** — `/api/recurring/run-reminders` (scheduled hourly
   in production via EventBridge; for the POC it's just an authed endpoint and
   can be triggered manually). For each user, finds active recurrences whose
   `nextDueDate - reminderDaysBefore <= today` and creates one
   `RECURRING_BILL_DUE` notification (idempotent: skip if already created for
   the current cycle).
7. **Frontend `/bills/recurring`** — list of recurrences + add/edit form +
   forecast timeline. Suggestions section to one-click accept auto-detected
   recurrences.
8. **Dashboard widget** — "Upcoming bills (next 14 days)" card on `/account`
   showing the timeline with running total — directly answers the user's
   "will next month feel tight?" worry.

## Out of scope for the POC

- Email/SMS ingestion (parsing inbound provider emails into bills) — useful long
  term but its own project.
- Bank-statement direct-debit detection — depends on Open Banking / Basiq.
- Push notifications to phone — reuses existing in-app notification surface for
  the POC.
- The cron/EventBridge wiring of `run-reminders` (endpoint exists; deployment
  schedule is a separate operational task).

## Checklist

- [ ] Add `RecurringBill` model + enums (cadence, status, channel)
- [ ] Extend `ENotificationType` with `RECURRING_BILL_DUE`
- [ ] Build `recurring.controller.ts` (CRUD + forecast + mark-paid + suggestions
      + run-reminders)
- [ ] Wire `/api/recurring` routes
- [ ] Build `/bills/recurring` page (list, add, suggestions, timeline)
- [ ] Add upcoming-bills widget to `/account` dashboard
- [ ] Add "Recurring" link to `AppHeader` nav
- [ ] Type-check both packages
