// File: app/(auth)/auth.config.ts

import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { DUMMY_PASSWORD } from '@/lib/constants';
import { compare } from 'bcryptjs';

export const authConfig = {
  // Required for encryption/signing
  // NextAuth v5 prefers AUTH_SECRET, but also supports NEXTAUTH_SECRET
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // Trust the host header (required for Vercel deployments)
  trustHost: true,

  // Optional: helpful for debugging in dev
  debug: process.env.NODE_ENV === 'development',

  // Required for JWT-based sessions
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
    newUser: '/',
  },

  providers: [
    // Regular user login
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD); // Fake compare
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);
        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),

    // Guest login
    Credentials({
      id: 'guest',
      name: 'Guest',
      credentials: {},
      async authorize() {
        // If database is not available, create a temporary guest user in memory
        if (!process.env.POSTGRES_URL) {
          console.warn('[Guest Auth] POSTGRES_URL not set - using temporary guest session');
          // Generate a temporary guest ID
          const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const guestEmail = `guest-${guestId}@temp.local`;
          
          return {
            id: guestId,
            email: guestEmail,
            type: 'guest' as const,
          };
        }
        
        try {
          const [guestUser] = await createGuestUser();
          return { ...guestUser, type: 'guest' };
        } catch (error) {
          console.error('[Guest Auth] Failed to create guest user in database:', error);
          // Fallback to temporary guest if database fails
          console.warn('[Guest Auth] Falling back to temporary guest session');
          const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const guestEmail = `guest-${guestId}@temp.local`;
          
          return {
            id: guestId,
            email: guestEmail,
            type: 'guest' as const,
          };
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        // Type assertion for user.type - it's added in authorize() callbacks
        const userWithType = user as { type?: 'regular' | 'guest' };
        token.type = (userWithType.type ?? 'regular') as 'regular' | 'guest';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as 'regular' | 'guest';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

