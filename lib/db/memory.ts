import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { sql } from 'postgres';
import crypto from 'crypto';

import { memory, type Memory } from './schema';
import { generateEmbedding } from '../ai/embeddings';
import { memoryCache, queryCache } from '@/lib/utils/cache';
import { memoryRateLimiter } from '@/lib/utils/rate-limiter';

/**
 * Generate cache key for memory queries
 */
function hashQuery(userId: string, query: string, limit: number, threshold: number): string {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${query}:${limit}:${threshold}`)
    .digest('hex');
}

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Store a memory with automatic embedding generation
 */
export async function storeMemory({
  userId,
  content,
  metadata,
  importance = 'medium',
}: {
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
  importance?: 'low' | 'medium' | 'high';
}): Promise<Memory> {
  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(content);

    // Store memory with embedding
    const [stored] = await db
      .insert(memory)
      .values({
        userId,
        content,
        embedding: embedding, // Custom type handles conversion
        metadata: metadata || {},
        importance,
      })
      .returning();

    return stored;
  } catch (error) {
    console.error('[Memory] Failed to store memory:', error);
    throw error;
  }
}

/**
 * Search memories by semantic similarity
 * Returns memories ordered by relevance (cosine similarity)
 */
export async function searchMemories({
  userId,
  query,
  limit = 5,
  threshold = 0.7,
}: {
  userId: string;
  query: string;
  limit?: number;
  threshold?: number;
}): Promise<Array<Memory & { similarity: number }>> {
  try {
    // Rate limiting
    if (!memoryRateLimiter.isAllowed(userId)) {
      throw new Error('Rate limit exceeded for memory search. Please try again later.');
    }

    // Check cache first (O(1) lookup)
    const cacheKey = hashQuery(userId, query, limit, threshold);
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached as Array<Memory & { similarity: number }>;
    }

    // Generate embedding for the query (uses cache internally)
    const queryEmbedding = await generateEmbedding(query);

    // Search using cosine similarity with raw SQL
    // pgvector uses <=> operator for cosine distance (optimized with IVFFlat index)
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const results = await client`
      SELECT 
        id,
        "userId",
        content,
        embedding,
        metadata,
        importance,
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Memory"
      WHERE "userId" = ${userId}
        AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${threshold}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    const typedResults = results as Array<Memory & { similarity: number }>;

    // Cache the results
    queryCache.set(cacheKey, typedResults);

    return typedResults;
  } catch (error) {
    console.error('[Memory] Failed to search memories:', error);
    // Fallback to simple text search if vector search fails
    return fallbackTextSearch({ userId, query, limit });
  }
}

/**
 * Fallback text search when vector search is unavailable
 */
async function fallbackTextSearch({
  userId,
  query,
  limit,
}: {
  userId: string;
  query: string;
  limit: number;
}): Promise<Array<Memory & { similarity: number }>> {
  const results = await db
    .select()
    .from(memory)
    .where(and(eq(memory.userId, userId)))
    .orderBy(desc(memory.createdAt))
    .limit(limit);

  // Simple text matching score
  const queryLower = query.toLowerCase();
  return results.map((mem) => {
    const contentLower = mem.content.toLowerCase();
    const similarity = contentLower.includes(queryLower) ? 0.8 : 0.5;
    return { ...mem, similarity };
  });
}

/**
 * Get all memories for a user
 */
export async function getUserMemories({
  userId,
  limit = 50,
}: {
  userId: string;
  limit?: number;
}): Promise<Memory[]> {
  try {
    return await db
      .select()
      .from(memory)
      .where(eq(memory.userId, userId))
      .orderBy(desc(memory.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('[Memory] Failed to get user memories:', error);
    throw error;
  }
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory({
  id,
  userId,
}: {
  id: string;
  userId: string;
}): Promise<boolean> {
  try {
    const result = await db
      .delete(memory)
      .where(and(eq(memory.id, id), eq(memory.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('[Memory] Failed to delete memory:', error);
    throw error;
  }
}

/**
 * Update a memory
 */
export async function updateMemory({
  id,
  userId,
  content,
  metadata,
  importance,
}: {
  id: string;
  userId: string;
  content?: string;
  metadata?: Record<string, unknown>;
  importance?: 'low' | 'medium' | 'high';
}): Promise<Memory | null> {
  try {
    // If content changed, regenerate embedding
    let embeddingArray: number[] | undefined;
    if (content) {
      embeddingArray = await generateEmbedding(content);
    }

    const [updated] = await db
      .update(memory)
      .set({
        ...(content && { content }),
        ...(embeddingArray && { embedding: embeddingArray }),
        ...(metadata && { metadata }),
        ...(importance && { importance }),
        updatedAt: new Date(),
      })
      .where(and(eq(memory.id, id), eq(memory.userId, userId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('[Memory] Failed to update memory:', error);
    throw error;
  }
}

