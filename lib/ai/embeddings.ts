import 'server-only';
import OpenAI from 'openai';
import { embeddingCache, embeddingRateLimiter } from '@/lib/utils/cache';
import crypto from 'crypto';

/**
 * Generate hash for text (for cache key)
 * Uses SHA-256 for fast hashing
 */
function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate embeddings for text using OpenAI's embedding model
 * Uses text-embedding-3-small (1536 dimensions) for cost efficiency
 * Optimized with caching and rate limiting for M1 Pro performance
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for embeddings');
  }

  // Check cache first (O(1) lookup)
  const cacheKey = hashText(text);
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Rate limiting
  const identifier = 'embedding-global';
  if (!embeddingRateLimiter.isAllowed(identifier)) {
    throw new Error('Rate limit exceeded for embeddings. Please try again later.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = response.data[0].embedding;

    // Cache the result
    embeddingCache.set(cacheKey, embedding);

    return embedding;
  } catch (error) {
    console.error('[Embeddings] Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Optimized with caching and batch processing
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for embeddings');
  }

  // Check cache for each text and batch uncached ones
  const results: (number[] | null)[] = new Array(texts.length);
  const uncached: Array<{ index: number; text: string }> = [];

  for (let i = 0; i < texts.length; i++) {
    const cacheKey = hashText(texts[i]);
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      results[i] = cached;
    } else {
      uncached.push({ index: i, text: texts[i] });
    }
  }

  // If all cached, return immediately
  if (uncached.length === 0) {
    return results as number[][];
  }

  // Rate limiting for batch
  const identifier = 'embedding-global';
  const tokensNeeded = uncached.length;
  if (!embeddingRateLimiter.isAllowed(identifier, tokensNeeded)) {
    throw new Error('Rate limit exceeded for embeddings. Please try again later.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Batch process uncached texts
    const uncachedTexts = uncached.map((u) => u.text);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: uncachedTexts,
    });

    // Fill in results and cache
    response.data.forEach((item, idx) => {
      const originalIndex = uncached[idx].index;
      results[originalIndex] = item.embedding;
      
      // Cache the result
      const cacheKey = hashText(uncached[idx].text);
      embeddingCache.set(cacheKey, item.embedding);
    });

    return results as number[][];
  } catch (error) {
    console.error('[Embeddings] Failed to generate embeddings:', error);
    throw error;
  }
}

