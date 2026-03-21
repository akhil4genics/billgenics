# Authentication Setup Guide

This guide explains how to set up and use the authentication system in BillGenics.

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure Email** - Update your `.env.local` file:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-google-app-password
   SMTP_FROM_NAME=BillGenics
   ```

   ### How to get Google App Password:
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password and paste it as `SMTP_PASSWORD`

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Test the authentication**:
   - Visit http://localhost:3000/signup
   - Create an account
   - Check your email for the verification link
   - Click the link to verify
   - Sign in at http://localhost:3000/signin
   - You'll be redirected to the protected account page

## What's Implemented

### Features
✅ User registration with full validation
✅ Email verification with beautiful branded templates
✅ Secure password hashing with bcryptjs
✅ Login/logout functionality
✅ Protected routes (middleware-based)
✅ Session management with JWT (30-day sessions)
✅ Frontend & backend validation
✅ Error handling and user feedback

### Routes

#### Public Routes
- `/` - Home page
- `/signin` - Login page
- `/signup` - Registration page

#### Protected Routes (require authentication)
- `/account` - User dashboard
- `/dashboard/*` - Dashboard pages
- `/bills/*` - Bill pages
- `/events/*` - Event pages

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/verify?code={code}&email={email}` - Verify email
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `POST /api/auth/signout` - Sign out (handled by NextAuth)

## File Structure

```
├── app/
│   ├── (auth)/
│   │   ├── signin/page.tsx          # Login page
│   │   └── signup/page.tsx          # Registration page
│   ├── account/page.tsx             # Protected dashboard
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # NextAuth handlers
│   │       ├── register/route.ts       # Registration API
│   │       └── verify/route.ts         # Email verification API
│   ├── layout.tsx                   # Root layout with providers
│   └── providers.tsx                # NextAuth SessionProvider
├── lib/
│   ├── db.ts                        # MongoDB connection
│   └── email.ts                     # Email service & templates
├── models/
│   └── User.ts                      # User model
├── types/
│   └── next-auth.d.ts              # NextAuth TypeScript types
├── auth.ts                          # NextAuth configuration
└── middleware.ts                    # Route protection middleware
```

## User Model Schema

```typescript
{
  firstName: string
  lastName: string
  username: string (unique, lowercase)
  email: string (unique, lowercase)
  password: string (hashed with bcrypt)
  activated: boolean
  userVerified: boolean
  name: string
  loginSession: {
    sessionToken: string | null
    sessionExpiresAt: Date | null
    registrationCode: string | null
    registrationCodeExpiresAt: Date | null
    passwordResetCode: string | null
    passwordResetCodeExpiresAt: Date | null
    loginSessionExpiresAt: Date | null
    loginSessionToken: string
    loggedInAt: Date | null
    twoFactorEnabled: boolean
    twoFactorMethod: string | null
    twoFactorCode: string | null
    twoFactorCodeExpiresAt: Date | null
  }
  createdAt: Date
  updatedAt: Date
}
```

## Validation Rules

### Email
- Must be a valid email format
- Validated on both frontend and backend

### Password
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

### Username
- 3-30 characters
- Only letters, numbers, and underscores
- Automatically converted to lowercase

### Names
- First name and last name required
- Must be non-empty strings

## Email Templates

Two beautiful email templates are included:
1. **Verification Email** - Sent after registration
2. **Password Reset Email** - For future password reset feature

Both templates:
- Match your brand colors (purple/indigo gradient)
- Are fully responsive
- Include clear call-to-action buttons
- Have 24-hour expiry warnings
- Work in all email clients

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT-based sessions (not vulnerable to CSRF)
- ✅ Email verification required before login
- ✅ Protected routes with middleware
- ✅ Input validation and sanitization
- ✅ Secure environment variable handling
- ✅ Rate limiting ready (can be added to API routes)

## Troubleshooting

### Mongoose Error
If you see a Mongoose-related error, the fix is already in place:
- `next.config.ts` includes mongoose in `serverComponentsExternalPackages`
- Dev script uses `--turbopack=false` to ensure webpack is used

### Email Not Sending
1. Check that `SMTP_USER` and `SMTP_PASSWORD` are correct
2. Ensure you're using a Google App Password, not your regular password
3. Check spam folder for the verification email
4. Look at server logs for detailed error messages

### Session Not Persisting
1. Ensure `NEXTAUTH_SECRET` is set in `.env.local`
2. Check that cookies are enabled in your browser
3. Verify `NEXTAUTH_URL` matches your local URL

## Next Steps

To complete the authentication system, you can add:
1. **Password reset functionality** (template already created)
2. **2FA support** (schema fields already in place)
3. **OAuth providers** (Google, GitHub, etc.)
4. **Rate limiting** for API routes
5. **Email resend** functionality
6. **Account settings page** for profile updates
7. **Remember me** checkbox option

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify all environment variables are set
4. Ensure MongoDB is accessible
5. Test email configuration separately
