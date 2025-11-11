import { tool } from 'ai';
import { z } from 'zod';
import { getUserMemories, searchMemories } from '@/lib/db/memory';

/**
 * List memories tool factory - creates a tool to list and search memories
 */
export const createListMemories = ({ userId }: { userId: string }) =>
  tool({
    description:
      'List or search through stored memories. Use this to recall what information has been stored, or to find specific memories.',
    parameters: z.object({
      query: z
        .string()
        .optional()
        .describe('Search query to find relevant memories. If not provided, returns recent memories.'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum number of memories to return (default: 10, max: 50).'),
    }),
    execute: async ({ query, limit = 10 }) => {
      try {
        const safeLimit = Math.min(Math.max(limit, 1), 50);

        if (query) {
          // Semantic search
          const memories = await searchMemories({
            userId,
            query,
            limit: safeLimit,
          });

          return {
            success: true,
            memories: memories.map((m) => ({
              id: m.id,
              content: m.content,
              importance: m.importance,
              similarity: m.similarity,
              createdAt: m.createdAt,
              metadata: m.metadata,
            })),
            count: memories.length,
            query,
          };
        }

        // Get recent memories
        const memories = await getUserMemories({ userId, limit: safeLimit });

        return {
          success: true,
          memories: memories.map((m) => ({
            id: m.id,
            content: m.content,
            importance: m.importance,
            createdAt: m.createdAt,
            metadata: m.metadata,
          })),
          count: memories.length,
        };
      } catch (error) {
        console.error('[List Memories Tool] Failed to retrieve memories:', error);
        return {
          success: false,
          error: 'Failed to retrieve memories. Please try again.',
        };
      }
    },
  });

