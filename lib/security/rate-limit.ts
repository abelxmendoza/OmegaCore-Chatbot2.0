import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiter } from '@/lib/utils/rate-limiter';

/**
 * API route rate limiter
 * Prevents abuse and DoS attacks
 */

// Per-route rate limiters
const apiRateLimiters = new Map<string, RateLimiter>();

function getRateLimiter(route: string, capacity: number, refillRate: number): RateLimiter {
  const key = `${route}:${capacity}:${refillRate}`;
  if (!apiRateLimiters.has(key)) {
    apiRateLimiters.set(key, new RateLimiter(capacity, refillRate, 60000));
  }
  return apiRateLimiters.get(key)!;
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get user ID from session first
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limit middleware for API routes
 */
export function rateLimit(
  request: NextRequest,
  route: string,
  capacity = 100,
  refillRate = 10,
): NextResponse | null {
  const limiter = getRateLimiter(route, capacity, refillRate);
  const clientId = getClientId(request);

  if (!limiter.isAllowed(clientId)) {
    const remaining = limiter.getRemaining(clientId);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((capacity - remaining) / refillRate),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((capacity - remaining) / refillRate)),
          'X-RateLimit-Limit': String(capacity),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Date.now() + (capacity - remaining) / refillRate * 1000),
        },
      },
    );
  }

  return null;
}

/**
 * Cleanup old rate limiters (prevent memory leak)
 */
export function cleanupRateLimiters(): void {
  // Cleanup is handled by RateLimiter class
  // This is a placeholder for future cleanup logic
}

