import { tool } from 'ai';
import { z } from 'zod';
import { deleteMemory, getUserMemories } from '@/lib/db/memory';

/**
 * Forget tool factory - creates a forget tool with user context
 */
export const createForget = ({ userId }: { userId: string }) =>
  tool({
    description:
      'Delete a specific memory by ID, or search and delete memories by content. Use this when information is no longer relevant or needs to be removed.',
    parameters: z.object({
      memoryId: z
        .string()
        .optional()
        .describe('The ID of the memory to delete. If not provided, will search by content.'),
      content: z
        .string()
        .optional()
        .describe('Content to search for. If provided without memoryId, will list matching memories.'),
    }),
    execute: async ({ memoryId, content }) => {
      try {
        if (memoryId) {
          // Delete specific memory
          const deleted = await deleteMemory({ id: memoryId, userId });
          if (deleted) {
            return {
              success: true,
              message: 'Memory deleted successfully',
              memoryId,
            };
          }
          return {
            success: false,
            error: 'Memory not found or you do not have permission to delete it',
            memoryId,
          };
        }

        if (content) {
          // Search for memories to delete
          const memories = await getUserMemories({ userId, limit: 20 });
          const matching = memories.filter((m) =>
            m.content.toLowerCase().includes(content.toLowerCase()),
          );

          if (matching.length === 0) {
            return {
              success: false,
              error: 'No memories found matching the content',
              content,
              suggestions: memories.slice(0, 5).map((m) => ({
                id: m.id,
                content: m.content.substring(0, 100),
              })),
            };
          }

          // Delete all matching memories
          const deleted = await Promise.all(
            matching.map((m) => deleteMemory({ id: m.id, userId })),
          );

          return {
            success: true,
            message: `Deleted ${deleted.filter(Boolean).length} matching memories`,
            deletedCount: deleted.filter(Boolean).length,
            totalFound: matching.length,
          };
        }

        return {
          success: false,
          error: 'Either memoryId or content must be provided',
        };
      } catch (error) {
        console.error('[Forget Tool] Failed to delete memory:', error);
        return {
          success: false,
          error: 'Failed to delete memory. Please try again.',
        };
      }
    },
  });

