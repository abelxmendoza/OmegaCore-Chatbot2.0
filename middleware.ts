// File: middleware.ts
// Summary: Auth middleware with guest fallback, security headers, and rate limiting

import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';
import { addSecurityHeaders } from './lib/security/headers';
import { rateLimit } from './lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // ✅ Allow health checks (no auth, no rate limit)
  if (pathname.startsWith('/ping')) {
    const response = new Response('pong', { status: 200 });
    return addSecurityHeaders(response, request);
  }

  // ✅ Skip middleware on public/auth routes
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    const response = NextResponse.next();
    return addSecurityHeaders(response, request);
  }

  // ✅ Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    // Different rate limits for different routes
    let capacity = 100;
    let refillRate = 10;

    if (pathname.startsWith('/api/chat')) {
      capacity = 50; // Lower limit for chat (more expensive)
      refillRate = 5;
    } else if (pathname.startsWith('/api/files')) {
      capacity = 20; // Very low for file uploads
      refillRate = 2;
    }

    const rateLimitResponse = rateLimit(request, pathname, capacity, refillRate);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse, request);
    }
  }

  // ✅ Check for auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // 🔁 Redirect to guest auth if not authenticated
  if (!token) {
    const redirectUrl = new URL('/api/auth/guest', origin);
    redirectUrl.searchParams.set('redirectUrl', pathname);
    const response = NextResponse.redirect(redirectUrl);
    return addSecurityHeaders(response, request);
  }

  // ✅ Prevent logged-in non-guests from visiting login/register
  const isGuest = guestRegex.test(token?.email ?? '');

  if (!isGuest && ['/login', '/register'].includes(pathname)) {
    const response = NextResponse.redirect(new URL('/', origin));
    return addSecurityHeaders(response, request);
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response, request);
}

// ✅ Matcher config — apply middleware to important pages
export const config = {
  matcher: [
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',
    '/((?!^api/auth/guest|^api/auth|^_next/static|^_next/image|^favicon.ico|^sitemap.xml|^robots.txt|^$).*)',
  ],
};
