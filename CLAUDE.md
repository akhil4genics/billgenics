# BillGenics

Smart expense tracking, receipt scanning, and bill splitting web application.

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
│   │   │   └── notifications.ts  # Notification routes (JWT required)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts          # Auth business logic
│   │   │   ├── bills.controller.ts         # Bill CRUD + scan + stats
│   │   │   ├── events.controller.ts        # Event CRUD + expenses + balances + settle
│   │   │   └── notifications.controller.ts # Notification list + mark read
│   │   ├── middleware/
│   │   │   ├── auth.ts     # JWT verification middleware + ObjectId validator
│   │   │   └── rateLimiter.ts  # Rate limiting for auth endpoints
│   │   ├── models/
│   │   │   ├── User.ts     # User model
│   │   │   ├── Bill.ts     # Bill/receipt model (items, category, totals)
│   │   │   ├── Event.ts    # Shared expense event model (members)
│   │   │   ├── Expense.ts  # Expense within event (splits, settled status)
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
- `GET /api/bills` — List user's bills (filter by month, year, category; paginated)
- `POST /api/bills` — Create bill manually
- `POST /api/bills/scan` — Scan receipt image via OpenAI, returns parsed data
- `GET /api/bills/stats` — Monthly summary (total spent, bill count, category breakdown)
- `GET /api/bills/:billId` — Get bill details
- `PUT /api/bills/:billId` — Update bill
- `DELETE /api/bills/:billId` — Soft delete bill
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

## Receipt Scanning Flow

1. User uploads/captures receipt image on frontend
2. Frontend sends base64 image to `POST /api/bills/scan`
3. Backend sends image to OpenAI GPT-4o Vision API
4. OpenAI returns structured data: store name, ABN, items, totals, date, category
5. Frontend displays parsed data for user to review/edit
6. User confirms → `POST /api/bills` saves to database

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

## Key Design Decisions

- **Presigned URLs for receipt images** — avoids Lambda's 6MB payload limit
- **Single Lambda function** — all routes handled by one function via `serverless-http` wrapping Express
- **MongoDB connection caching** — `handler.ts` maintains a module-level `isConnected` flag
- **ObjectId validation middleware** — all param IDs validated before hitting controllers
- **Pagination capped at 100** — prevents abuse via large limit values
- **Soft delete for bills** — status field (active/deleted)
- **Greedy debt simplification** — balances calculated using greedy algorithm to minimize transactions
- **`@backend/*` path alias** — frontend can import shared types from backend via `@backend/shared/types`
