/**
 * Token bucket rate limiter with sliding window
 * Optimized algorithm for high-performance rate limiting
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, Bucket>;
  private capacity: number;
  private refillRate: number; // tokens per second
  private windowMs: number;

  constructor(capacity = 100, refillRate = 10, windowMs = 60000) {
    this.buckets = new Map();
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed - O(1) time complexity
   */
  isAllowed(identifier: string, tokens = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(identifier);

    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefill: now,
      };
      this.buckets.set(identifier, bucket);
    }

    // Refill tokens based on time elapsed
    const timeElapsed = (now - bucket.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(timeElapsed * this.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if enough tokens available
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for identifier
   */
  getRemaining(identifier: string): number {
    const bucket = this.buckets.get(identifier);
    if (!bucket) return this.capacity;

    const now = Date.now();
    const timeElapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timeElapsed * this.refillRate);
    const currentTokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);

    return Math.max(0, currentTokens);
  }

  /**
   * Reset bucket for identifier
   */
  reset(identifier: string): void {
    this.buckets.delete(identifier);
  }

  /**
   * Clean up old buckets (prevent memory leak)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > this.windowMs * 2) {
        this.buckets.delete(identifier);
      }
    }
  }
}

/**
 * Global rate limiters
 */
export const embeddingRateLimiter = new RateLimiter(100, 10, 60000); // 100 requests, 10/sec
export const memoryRateLimiter = new RateLimiter(200, 20, 60000); // 200 requests, 20/sec
export const toolRateLimiter = new RateLimiter(50, 5, 60000); // 50 requests, 5/sec

