# BillGenics

Smart expense tracking, receipt scanning, and bill splitting web application.

## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Architecture

Split into two independently deployable parts:

- **Frontend** (`/`) — Next.js 15 (App Router) deployed to **AWS Amplify**
- **Backend** (`/backend`) — Express.js wrapped with Serverless Framework, deployed to **AWS Lambda + API Gateway**

Each has its own `package.json`, `tsconfig.json`, and dependencies.

## Tech Stack

### Frontend
- Next.js 15 with App Router
- React 19, TypeScript, Tailwind CSS 4
- NextAuth v5 (beta) for session/cookie management
- SWR for data fetching
- `react-hot-toast` for notifications
- `next-pwa` for PWA support

### Backend
- Express.js (wrapped with `serverless-http` for Lambda)
- Serverless Framework v3 (`serverless.yml`)
- MongoDB via Mongoose
- AWS S3 (presigned URLs for receipt image storage)
- OpenAI GPT-4o Vision for receipt scanning/parsing
- Nodemailer (Gmail SMTP) for transactional emails
- Zod for input validation
- bcryptjs for password hashing (12 rounds)
- jsonwebtoken for JWT verification

## Authentication Flow

NextAuth (frontend) ↔ Express (backend) via JWT bridge:

1. User submits credentials to NextAuth
2. NextAuth's `authorize` calls `POST /api/auth/login` on the backend
3. Backend validates credentials against MongoDB, returns user data
4. NextAuth signs a custom `accessToken` (HS256 JWT) using `NEXTAUTH_SECRET`
5. Frontend includes `Authorization: Bearer <accessToken>` on all API calls
6. Backend middleware verifies the JWT using `AUTH_SECRET` (same value as `NEXTAUTH_SECRET`)

**Important:** `AUTH_SECRET` (backend) and `NEXTAUTH_SECRET` (frontend) must be identical.

## Project Structure

```
/                           # Next.js frontend (root)
├── app/
│   ├── (auth)/             # Auth pages: signin, signup, forgot-password, reset-password, complete-account
│   ├── account/            # Dashboard page (spending summary, category breakdown, recent bills)
│   ├── bills/              # Bill pages
│   │   ├── page.tsx        # Bills list (filter by month, category)
│   │   ├── scan/           # Receipt scanning (camera/upload → AI parse → review → save)
│   │   ├── new/            # Manual bill entry
│   │   ├── recurring/      # Recurring bills hub (list, add, suggestions, 60-day forecast)
│   │   └── [billId]/       # Bill detail/edit
│   ├── events/             # Expense splitting events
│   │   ├── page.tsx        # Events list
│   │   ├── new/            # Create event
│   │   └── [eventId]/      # Event detail (expenses, balances, members, settle)
│   ├── api/auth/           # NextAuth route handler only
│   ├── components/         # Shared React components (Header, ThemeProvider)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing/home page
├── lib/
│   └── api.ts              # apiUrl(), authHeaders() helpers
├── auth.ts                 # NextAuth config (credentials provider + JWT bridge)
├── types/next-auth.d.ts    # Session type augmentation (adds accessToken)
├── .env.local              # Frontend env vars
│
├── backend/                # Express backend (separate deployable)
│   ├── serverless.yml      # Serverless Framework config
│   ├── src/
│   │   ├── handler.ts      # Lambda entry point (DB connection + serverless-http wrapper)
│   │   ├── app.ts          # Express app setup (cors, json, routes)
│   │   ├── routes/
│   │   │   ├── index.ts    # Route registration (auth + bills + events + notifications)
│   │   │   ├── auth.ts     # Auth routes (all public)
│   │   │   ├── bills.ts    # Bill routes (JWT required)
│   │   │   ├── events.ts   # Event routes (JWT required)
│   │   │   ├── recurring.ts      # Recurring bills routes (JWT required)
│   │   │   └── notifications.ts  # Notification routes (JWT required)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts          # Auth business logic
│   │   │   ├── bills.controller.ts         # Bill CRUD + scan + stats
│   │   │   ├── events.controller.ts        # Event CRUD + expenses + balances + settle
│   │   │   ├── recurring.controller.ts     # Recurring bills: CRUD, forecast, mark-paid, suggestions, run-reminders
│   │   │   └── notifications.controller.ts # Notification list + mark read
│   │   ├── middleware/
│   │   │   ├── auth.ts     # JWT verification middleware + ObjectId validator
│   │   │   └── rateLimiter.ts  # Rate limiting for auth endpoints
│   │   ├── models/
│   │   │   ├── User.ts     # User model
│   │   │   ├── Bill.ts     # Bill/receipt model (items, category, totals, tags, warranty, attachments)
│   │   │   ├── Event.ts    # Shared expense event model (members)
│   │   │   ├── Expense.ts  # Expense within event (splits, settled status)
│   │   │   ├── RecurringBill.ts # Recurring bill schedule (cadence, nextDueDate, channel, status)
│   │   │   └── Notification.ts  # In-app notification model
│   │   ├── lib/
│   │   │   ├── db.ts       # MongoDB connection
│   │   │   ├── s3.ts       # S3 client + presigned URL generation (upload + download)
│   │   │   ├── email.ts    # Nodemailer transporter + email templates
│   │   │   └── openai.ts   # OpenAI GPT-4o receipt parsing
│   │   └── shared/
│   │       └── types.ts    # Shared TypeScript types
│   └── .env                # Backend env vars
```

## API Routes

### Auth (public — no JWT required)
- `POST /api/auth/login` — Validate credentials, return user data
- `POST /api/auth/check-credentials` — Credential validation only
- `POST /api/auth/register` — Create account + send verification email
- `GET /api/auth/verify` — Email verification (redirects to frontend)
- `POST /api/auth/complete-account` — Invited user account setup
- `POST /api/auth/forgot-password` — Send password reset email
- `POST /api/auth/reset-password` — Reset password with code

### Bills (protected — JWT required)
- `GET /api/bills` — List user's bills (filter by month, year, category; paginated; `?q=` for full-text search)
- `POST /api/bills` — Create bill (supports tags, warranty, attachments)
- `POST /api/bills/scan` — Scan receipt image via OpenAI, returns parsed data (only used from scan page)
- `GET /api/bills/stats` — Monthly summary (total spent, bill count, category breakdown)
- `GET /api/bills/:billId` — Get bill details (includes presigned URLs for receipt image + attachments)
- `PUT /api/bills/:billId` — Update bill (tags, warranty, etc.)
- `DELETE /api/bills/:billId` — Soft delete bill
- `POST /api/bills/:billId/upload-url` — Get S3 presigned upload URL for any file attachment
- `POST /api/bills/:billId/attachments` — Register attachment after S3 upload (key, filename, contentType, size)
- `DELETE /api/bills/:billId/attachments` — Remove attachment by key
- `POST /api/bills/:billId/upload-receipt` — Get S3 presigned upload URL for receipt image
- `POST /api/bills/:billId/upload-complete` — Confirm receipt image upload

### Events (protected — JWT required)
- `GET /api/events` — List user's events
- `POST /api/events` — Create event
- `GET /api/events/:eventId` — Get event with expenses
- `POST /api/events/:eventId/expenses` — Add expense to event
- `PUT /api/events/:eventId/expenses/:expenseId` — Update expense
- `DELETE /api/events/:eventId/expenses/:expenseId` — Delete expense
- `POST /api/events/:eventId/invite` — Invite user by email
- `GET /api/events/:eventId/balances` — Calculate who owes whom
- `POST /api/events/:eventId/settle` — Mark settlement between users

### Notifications (protected — JWT required)
- `GET /api/notifications` — List notifications (with unread count)
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all as read

### Recurring Bills (protected — JWT required)
- `GET /api/recurring` — List user's recurring bills
- `POST /api/recurring` — Create a recurring bill schedule. Body accepts `endDate` (optional ISO date — schedule auto-completes on/after that date; omit for "until I stop")
- `GET /api/recurring/forecast?days=N` — Project upcoming occurrences over the next N days (default 30, max 365). Stops projecting at each schedule's `endDate` if set. Returns flat timeline + `totalUpcoming` running total
- `GET /api/recurring/suggestions` — Auto-detect recurring patterns from the last 12 months of `Bill`s. Groups by `storeName` (case-insensitive), computes avg gap, maps to nearest cadence, scores confidence (high/medium/low based on occurrence count and gap variance). Skips names already tracked
- `POST /api/recurring/sync` — Idempotent combined cron job. For each active schedule: (1) auto-creates a `Bill` (with `entryMethod: 'recurring'`, `recurringBillId` linked) for every cycle whose `nextDueDate <= today`, rolling the schedule forward each time and marking it `completed` if `endDate` is reached; (2) creates a `RECURRING_BILL_DUE` notification for any cycle inside its reminder window. De-duped via `lastGeneratedCycleDate` and `lastReminderCycleDate`, so re-running is safe. Called automatically on dashboard mount; designed to also run via EventBridge daily in production
- `PUT /api/recurring/:id` — Update fields (incl. `status` to pause/resume, `endDate: null` to clear). Pass any field including `endDate` to extend or curtail the schedule
- `DELETE /api/recurring/:id` — Hard delete
- `POST /api/recurring/:id/mark-paid` — "Skip to next cycle" — advances `nextDueDate` and stamps `lastPaidDate`. Does NOT create a `Bill` (sync owns that). Use when the user has paid this cycle outside the app and wants to skip ahead. Marks the schedule `completed` if the rolled date passes `endDate`

## Receipt Scanning Flow

1. User uploads/captures receipt image on `/bills/scan` page (scanning ONLY happens here)
2. Frontend sends base64 image to `POST /api/bills/scan`
3. Backend sends image to OpenAI GPT-4o Vision API
4. OpenAI returns structured data: store name, ABN, items, totals, date, category
5. Frontend displays parsed data for user to review/edit
6. User confirms → `POST /api/bills` saves to database → receipt image uploaded to S3

## Attachments Flow

1. User views a bill on `/bills/[billId]` page
2. Clicks "Attach File" → selects file (images, PDFs, docs, etc.)
3. Frontend gets presigned upload URL via `POST /api/bills/:billId/upload-url`
4. File uploaded directly to S3 via presigned URL
5. Frontend registers attachment via `POST /api/bills/:billId/attachments`
6. Attachments displayed inline (images shown as previews, other files as download links)
7. No AI scanning triggered — attachments are stored as-is

## Recurring Bills Flow

Users have many recurring household bills (rent, utilities, daycare, subscriptions,
work tools) landing on different cycles, from different channels (email/SMS/app).
Manual tracking apps collapse when life gets busy — unexpected renewals cause
cash-flow stress. The Recurring Bills feature converts that chaos into a
forward-looking, low-maintenance schedule that **auto-creates `Bill` rows on the
due date** so monthly stats reflect the spend without any manual entry.

1. User opens `/bills/recurring`. The page fetches three things in parallel:
   - `GET /api/recurring` — current schedules
   - `GET /api/recurring/forecast?days=60` — projected occurrences + running total
   - `GET /api/recurring/suggestions` — auto-detected patterns from past `Bill`s
2. User accepts a suggestion (one click → `POST /api/recurring`) or fills the
   inline form to add a schedule manually
3. Each schedule defines: `name`, `category`, `amount` (estimate), `cadence`
   (weekly | fortnightly | monthly | quarterly | yearly | custom-N-days),
   `nextDueDate`, optional `endDate` (omit for "until I stop"),
   `reminderDaysBefore`, `channel`
4. Dashboard `/account` calls `POST /api/recurring/sync` on mount before reading
   stats — that materialises any newly-due cycles as `Bill` rows so monthly totals
   include them. Then the "next 14 days" widget reads
   `GET /api/recurring/forecast?days=14` to answer "will next month feel tight?"
5. `POST /api/recurring/sync` is the single cron entry point. It does two things
   atomically per schedule, both deduplicated per cycle:
   - **Auto-generate `Bill`** for every cycle whose `nextDueDate <= today`
     (`entryMethod: 'recurring'`, `recurringBillId` linked, `total = schedule.amount`).
     Multiple back-fills happen in a loop so a long-paused schedule catches up.
     Schedule rolls forward each iteration; flips to `completed` if `endDate`
     is reached.
   - **Create reminder notification** if `nextDueDate - today <= reminderDaysBefore`
     and we haven't already reminded for this cycle.
   Designed for EventBridge (daily) in production; also called from the dashboard
   on mount as a belt-and-braces trigger
6. The user can edit any auto-generated bill from `/bills/[billId]` if the actual
   amount differs from the estimate
7. `POST /api/recurring/:id/mark-paid` is the "I paid this elsewhere — skip to
   the next cycle" affordance. It does NOT create a `Bill` (sync owns that); it
   only advances the schedule. Available only while the schedule is active
8. Schedules can be paused (status: `paused`) without losing history; the
   forecast and sync skip non-active schedules. Once `endDate` is reached the
   schedule is marked `completed` (greyed out, no further sync work)

### Auto-detection algorithm (`GET /api/recurring/suggestions`)

- Loads the user's last 12 months of active `Bill`s
- Groups by `storeName.trim().toLowerCase()`
- Skips groups with <2 bills, or names already on a recurring schedule
- Computes mean gap between consecutive bills + standard deviation
- Maps mean gap to the nearest fixed cadence (weekly/fortnightly/monthly/
  quarterly/yearly) with tolerance windows; falls back to `custom` with the
  rounded gap in days
- Confidence: `high` (≥3 bills + CV<0.2), `medium` (≥2 bills + CV<0.4), else `low`
- Returns suggestions sorted by confidence so high-confidence items surface first

### Why this shape

- **Forecast over reactive reminders alone**: the "will next month feel tight?"
  question is the user's actual pain, so the forecast endpoint and the dashboard
  widget are first-class — not a side-effect of reminders
- **Idempotent reminders**: `lastReminderCycleDate` (= the `nextDueDate` it last
  reminded for) makes `run-reminders` safe to re-run, so the cron schedule can
  be coarse without duplicate notifications
- **Suggestions, not auto-creation**: we never auto-create schedules from
  detected patterns — the user must accept. Auto-creating would silently shape
  their forecast based on noisy data
- **Reuses existing notifications surface**: `RECURRING_BILL_DUE` is just another
  `ENotificationType`; no new delivery channel needed for the POC. Push/SMS
  delivery can be layered later without changing the schedule model

### Out of scope for the current implementation

- Email/SMS provider-bill ingestion (parsing inbound bill emails into `Bill`s
  and auto-marking schedules paid) — useful long term but its own project
- Open Banking / Basiq direct-debit detection from bank statements
- Push notifications to phone (the in-app notification surface is what fires today)
- The actual EventBridge schedule wiring for `run-reminders` (the endpoint exists
  and is auth-gated; adding the schedule is a serverless.yml change)

## Expense Splitting Flow

1. User creates an event → `POST /api/events`
2. Invites members by email → `POST /api/events/:id/invite`
3. Members add expenses → `POST /api/events/:id/expenses`
4. View balances (who owes whom) → `GET /api/events/:id/balances`
5. Mark settlement → `POST /api/events/:id/settle` (notifies other party)

## Bill Categories

grocery, electronics, telephone, dining, transport, health, utilities, entertainment, clothing, other

## Environment Variables

### Frontend (`.env.local`)
- `NEXTAUTH_SECRET` — JWT signing secret (must match backend `AUTH_SECRET`)
- `NEXTAUTH_URL` — Frontend URL (e.g., `http://localhost:3000`)
- `BACKEND_URL` — Backend URL for server-side calls (e.g., `http://localhost:3001`)
- `NEXT_PUBLIC_API_URL` — Backend URL for client-side calls (e.g., `http://localhost:3001`)

### Backend (`.env`)
- `AUTH_SECRET` — JWT verification secret (must match frontend `NEXTAUTH_SECRET`)
- `MONGODB_URI` — MongoDB connection string
- `S3_BUCKET_NAME`, `ACCESS_KEY_AWS`, `SECRET_KEY_AWS`, `REGION` — AWS S3
- `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME` — Email (Gmail SMTP)
- `FRONTEND_URL` — For email links and CORS origin
- `BACKEND_URL` — For verification email links
- `OPENAI_API_KEY` — OpenAI API key for receipt scanning

## Development

```bash
# Frontend (root directory)
npm install
npm run dev          # Next.js on port 3000

# Backend (backend directory)
cd backend
npm install
npm run dev          # serverless offline on port 3001
```

## Deployment

```bash
# Frontend — deployed via AWS Amplify (connects to git repo)

# Backend
cd backend
npm run deploy              # deploys to dev stage
npm run deploy:prod         # deploys to prod stage
```

## Bill Search

- Full-text search via MongoDB text index on `storeName`, `items.name`, `tags`, `notes`, `warranty.details`
- Weighted: storeName (10), tags (8), items.name (5), notes (2), warranty.details (2)
- Search via `?q=` param on `GET /api/bills` — when searching, date filters are skipped (searches all time)
- Results sorted by text relevance score, then date
- Frontend has debounced search bar (400ms); clicking a tag auto-searches for it

## Bill Model Fields

Core: storeName, storeABN, storeAddress, date, category, items[], subtotal, tax, total, paymentMethod, notes, entryMethod, status
Search/Metadata: tags (string[]), warranty ({ expiryDate, details }), attachments ({ key, filename, contentType, size }[]), receiptImageKey
DB Indexes: userId+date, userId+category, userId+tags, userId+warranty.expiryDate, text index (weighted)

## Key Design Decisions

- **Presigned URLs for receipt images and attachments** — avoids Lambda's 6MB payload limit; getBill returns pre-signed download URLs
- **Single Lambda function** — all routes handled by one function via `serverless-http` wrapping Express
- **MongoDB connection caching** — `handler.ts` maintains a module-level `isConnected` flag
- **ObjectId validation middleware** — all param IDs validated before hitting controllers
- **Pagination capped at 100** — prevents abuse via large limit values
- **Soft delete for bills** — status field (active/deleted)
- **Greedy debt simplification** — balances calculated using greedy algorithm to minimize transactions
- **`@backend/*` path alias** — frontend can import shared types from backend via `@backend/shared/types`
- **Scan-only on scan page** — AI receipt parsing only triggers from `/bills/scan`; other pages allow manual entry and file attachment without scanning
- **Tags stored lowercase** — normalized on create/update for consistent search
- **Attachments stored as S3 keys** — presigned URLs generated on read (1hr expiry)
- **Recurring bills are a separate model** — `RecurringBill` is the *forward-looking*
  schedule (cadence + nextDueDate + optional endDate); `Bill` is the *historical*
  record. The sync job materialises one `Bill` per cycle on the due date with
  `entryMethod: 'recurring'` and `recurringBillId` linking back to the schedule
- **Sync is idempotent per cycle on both axes** — `lastGeneratedCycleDate` and
  `lastReminderCycleDate` track which cycle we last generated/reminded for, so
  `POST /api/recurring/sync` is safe to re-run on any cadence (dashboard-mount,
  EventBridge daily, manual button) without duplicate Bills or notifications
- **`endDate` is optional** — omit for "until I stop"; set it to bound a fixed-term
  contract (e.g., 12-month phone plan). Sync flips status to `completed` once the
  rolled-forward `nextDueDate` crosses `endDate`
