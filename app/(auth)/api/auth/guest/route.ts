// File: app/(auth)/api/auth/guest/route.ts
// Summary: Handles guest auth flow, safely signs in guest or returns 401 if unsupported.

import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestOrigin = url.origin; // Use the actual request origin (Vercel domain or localhost)
  const redirectPath = url.searchParams.get('redirectUrl') || '/';
  
  // Ensure redirectUrl uses the request origin, not localhost
  const redirectUrl = redirectPath.startsWith('http') 
    ? redirectPath 
    : `${requestOrigin}${redirectPath}`;

  // Check if auth secret is configured
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!authSecret) {
    console.error('[Guest Auth Error] AUTH_SECRET or NEXTAUTH_SECRET is not defined');
    return new Response(
      'Server configuration error: AUTH_SECRET is not set. Please configure it in Vercel environment variables.',
      { status: 500 }
    );
  }

  // Check if user already has a token/session
  const token = await getToken({
    req: request,
    secret: authSecret,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    // Already signed in — redirect to the requested path or chat
    const finalRedirect = redirectPath.startsWith('http') 
      ? redirectPath 
      : redirectPath === '/' 
        ? `${requestOrigin}/chat`
        : `${requestOrigin}${redirectPath}`;
    return NextResponse.redirect(new URL(finalRedirect, requestOrigin));
  }

  // Note: Guest login will work without database (using temporary sessions)
  // but chat history won't be persisted without POSTGRES_URL
  
  try {
    // Initiate guest sign-in via next-auth (this throws NEXT_REDIRECT internally)
    // Use the redirectUrl with the correct origin
    return await signIn('guest', {
      redirectTo: redirectUrl,
      // Note: `redirect: true` is default on server, so not needed
    });
  } catch (err: any) {
    // NextAuth's signIn throws NEXT_REDIRECT internally, which is expected
    // If it's a redirect, re-throw it
    if (err?.type === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    
    console.error('[Guest Auth Error]', err);
    console.error('[Guest Auth Error] Stack:', err?.stack);
    return new Response(
      `Guest login failed: ${err?.message || 'Unknown error'}. Please check server logs.`,
      { status: 500 }
    );
  }
}
