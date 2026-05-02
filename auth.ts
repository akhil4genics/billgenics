import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. In production, configure it via Amplify Secrets; locally, set it in .env.local.'
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const backendUrl = process.env.BACKEND_URL;
          if (!backendUrl) {
            console.error('BACKEND_URL is not configured');
            return null;
          }

          const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) return null;

          const user = await response.json();
          return user; // { id, email, name, firstName, username, adminUser }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.username = user.username;
        token.adminUser = (user as { adminUser?: boolean }).adminUser === true;
        // Create access token for Express API calls (verified by backend using AUTH_SECRET)
        token.accessToken = jwt.sign(
          { id: user.id, email: user.email },
          NEXTAUTH_SECRET,
          { expiresIn: '30d' }
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.username = token.username as string;
        session.user.adminUser = token.adminUser === true;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: NEXTAUTH_SECRET,
});
