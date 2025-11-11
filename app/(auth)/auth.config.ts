// File: app/(auth)/auth.config.ts

import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { DUMMY_PASSWORD, isDevelopmentEnvironment } from '@/lib/constants';
import { compare } from 'bcryptjs';

// Get base URL for NextAuth - required for SSR
const getBaseUrl = () => {
  // In production/Vercel, trustHost will handle this
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return undefined; // Let trustHost handle it
  }
  // For local development, ensure we have a valid URL
  const url = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
  // Validate it's a proper URL
  try {
    new URL(url);
    return url;
  } catch {
    console.warn('[Auth Config] Invalid NEXTAUTH_URL, using default');
    return 'http://localhost:3000';
  }
};

export const authConfig = {
  // Required for encryption/signing
  // NextAuth v5 prefers AUTH_SECRET, but also supports NEXTAUTH_SECRET
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // Trust the host header (required for Vercel deployments)
  // This makes NextAuth use the request origin instead of NEXTAUTH_URL
  // For local development, NEXTAUTH_URL should be set in .env.local
  trustHost: true,
  
  // Explicitly set base URL for local development (helps with SSR)
  // In production, this is ignored in favor of trustHost
  ...(process.env.NODE_ENV === 'development' && !process.env.VERCEL
    ? { baseURL: getBaseUrl() }
    : {}),

  // Override base URL to use request origin (prevents localhost redirects)
  // If NEXTAUTH_URL is set to localhost, this ensures we use the actual request origin
  basePath: '/api/auth',

  // Optional: helpful for debugging in dev
  debug: process.env.NODE_ENV === 'development',

  // Required for JWT-based sessions
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Security: Enhanced cookie settings
  cookies: {
    sessionToken: {
      name: `${isDevelopmentEnvironment ? '' : '__Secure-'}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopmentEnvironment, // HTTPS only in production
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `${isDevelopmentEnvironment ? '' : '__Secure-'}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopmentEnvironment,
      },
    },
    csrfToken: {
      name: `${isDevelopmentEnvironment ? '' : '__Host-'}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopmentEnvironment,
      },
    },
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

    // Override redirect to use request origin instead of NEXTAUTH_URL
    // This prevents localhost redirects when NEXTAUTH_URL is set incorrectly
    async redirect({ url, baseUrl }) {
      // Ensure baseUrl is valid - fallback to NEXTAUTH_URL if baseUrl is invalid
      let validBaseUrl = baseUrl;
      if (!baseUrl || typeof baseUrl !== 'string') {
        validBaseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
        console.warn('[Auth Redirect] Invalid baseUrl, using fallback:', validBaseUrl);
      }

      // Validate baseUrl is a proper URL
      try {
        new URL(validBaseUrl);
      } catch {
        // If baseUrl is invalid, use NEXTAUTH_URL or default
        validBaseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        console.warn('[Auth Redirect] baseUrl validation failed, using:', validBaseUrl);
      }

      // CRITICAL: Always reject localhost URLs in production (when not on localhost)
      // This prevents redirects to localhost when NEXTAUTH_URL is misconfigured
      const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      
      if (isLocalhost && isProduction && !validBaseUrl.includes('localhost')) {
        console.warn('[Auth Redirect] Rejecting localhost URL in production:', url);
        // Extract path and use validBaseUrl
        if (url.startsWith('/')) {
          return `${validBaseUrl}${url}`;
        }
        try {
          const urlObj = new URL(url);
          return `${validBaseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        } catch {
          return validBaseUrl;
        }
      }

      // Use validBaseUrl (which respects trustHost) instead of NEXTAUTH_URL
      // If url is relative, make it absolute using validBaseUrl
      if (url.startsWith('/')) {
        return `${validBaseUrl}${url}`;
      }
      
      // If url is already absolute, check if it's from the same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(validBaseUrl);
        // If same origin, allow it
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
        // Different origin - extract path and use validBaseUrl
        return `${validBaseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      } catch (err) {
        // Invalid URL, use validBaseUrl
        console.warn('[Auth Redirect] URL parsing error:', err);
        return validBaseUrl;
      }
    },
  },
} satisfies NextAuthConfig;

