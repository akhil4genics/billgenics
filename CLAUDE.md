# PicsGenics

Photo and video album management web application.

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
- AWS S3 (presigned URLs for upload/download — files never pass through Lambda)
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
│   ├── account/            # Account/dashboard page
│   ├── album/[albumId]/    # Album detail page (upload, download, share)
│   ├── api/auth/           # NextAuth route handler only
│   ├── components/         # Shared React components
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing/home page
├── lib/
│   ├── api.ts              # apiUrl(), authHeaders(), authBearerHeader() helpers
│   └── imageCompression.ts # Client-side image compression before upload
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
│   │   │   ├── index.ts    # Route registration (auth + albums)
│   │   │   ├── auth.ts     # Auth routes (all public)
│   │   │   └── albums.ts   # Album routes (all require JWT auth + ObjectId validation)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts    # Auth business logic
│   │   │   └── albums.controller.ts  # Album business logic
│   │   ├── middleware/
│   │   │   └── auth.ts     # JWT verification middleware + ObjectId validator
│   │   ├── models/         # Mongoose models: User, Album, AlbumItem
│   │   ├── lib/
│   │   │   ├── db.ts       # MongoDB connection
│   │   │   ├── s3.ts       # S3 client + presigned URL generation
│   │   │   └── email.ts    # Nodemailer transporter + email templates
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

### Albums (protected — JWT required)
- `GET /api/albums` — List user's albums
- `POST /api/albums` — Create album
- `GET /api/albums/stats` — User stats (album count, photo count, storage)
- `GET /api/albums/:albumId` — Get album with paginated items
- `POST /api/albums/:albumId/upload-url` — Get S3 presigned upload URLs (batch up to 10)
- `POST /api/albums/:albumId/upload-complete` — Save upload metadata to DB
- `POST /api/albums/:albumId/items/delete` — Soft-delete items
- `GET /api/albums/:albumId/items/download` — Get S3 presigned download URL
- `POST /api/albums/:albumId/share` — Share album with user (sends email)
- `GET /api/albums/:albumId/share` — List shared users
- `PATCH /api/albums/:albumId/share` — Update shared user role
- `DELETE /api/albums/:albumId/share` — Revoke user access

## File Upload/Download Flow

**Uploads** (files never pass through Lambda):
1. Frontend requests presigned upload URLs from `POST /upload-url`
2. Frontend PUTs files directly to S3
3. Frontend confirms via `POST /upload-complete` (metadata only)

**Downloads** (files never pass through Lambda):
1. Frontend requests presigned download URL from `GET /items/download`
2. Frontend fetches file directly from S3

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

- **Presigned URLs for all S3 operations** — avoids Lambda's 6MB payload limit and reduces Lambda execution time
- **Single Lambda function** — all routes handled by one function via `serverless-http` wrapping Express. Simpler cold start management vs individual function-per-route.
- **MongoDB connection caching** — `handler.ts` maintains a module-level `isConnected` flag to avoid reconnecting on warm Lambda invocations
- **ObjectId validation middleware** — all `:albumId` params validated before hitting controllers
- **Pagination capped at 100** — prevents abuse via large limit values
- **`@backend/*` path alias** — frontend can import shared types from backend via `@backend/shared/types`
