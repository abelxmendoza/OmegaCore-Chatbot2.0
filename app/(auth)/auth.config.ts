// File: app/(auth)/auth.config.ts

import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { DUMMY_PASSWORD } from '@/lib/constants';
import { compare } from 'bcryptjs';

export const authConfig = {
  // Required for encryption/signing
  secret: process.env.NEXTAUTH_SECRET,

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
        try {
          if (!process.env.POSTGRES_URL) {
            console.error('[Guest Auth] POSTGRES_URL is not defined');
            throw new Error('Database not configured');
          }
          const [guestUser] = await createGuestUser();
          return { ...guestUser, type: 'guest' };
        } catch (error) {
          console.error('[Guest Auth] Failed to create guest user:', error);
          throw error;
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

