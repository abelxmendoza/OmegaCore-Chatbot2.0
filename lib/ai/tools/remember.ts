import { tool } from 'ai';
import { z } from 'zod';
import { storeMemory } from '@/lib/db/memory';

/**
 * Remember tool - stores information in persistent memory
 * The AI can use this to remember important facts, preferences, or context
 */
export const remember = tool({
  description:
    'Store information in persistent memory for future reference. Use this to remember important facts, user preferences, context, or any information that should be recalled later.',
  parameters: z.object({
    content: z
      .string()
      .describe('The information to remember. Be specific and clear about what should be stored.'),
    importance: z
      .enum(['low', 'medium', 'high'])
      .optional()
      .default('medium')
      .describe('How important this memory is. High importance memories are prioritized in searches.'),
    metadata: z
      .record(z.unknown())
      .optional()
      .describe('Optional metadata to store with the memory (e.g., tags, categories, dates).'),
  }),
  execute: async ({ content, importance = 'medium', metadata }) => {
    // This will be called from the chat route with session context
    // For now, return a placeholder - the actual implementation will be in the chat route
    return {
      success: true,
      message: 'Memory stored successfully',
      content,
      importance,
    };
  },
});

/**
 * Remember tool factory - creates a remember tool with user context
 */
export const createRemember = ({ userId }: { userId: string }) =>
  tool({
    description:
      'Store information in persistent memory for future reference. Use this to remember important facts, user preferences, context, or any information that should be recalled later.',
    parameters: z.object({
      content: z
        .string()
        .describe('The information to remember. Be specific and clear about what should be stored.'),
      importance: z
        .enum(['low', 'medium', 'high'])
        .optional()
        .default('medium')
        .describe('How important this memory is. High importance memories are prioritized in searches.'),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe('Optional metadata to store with the memory (e.g., tags, categories, dates).'),
    }),
    execute: async ({ content, importance = 'medium', metadata }) => {
      try {
        const memory = await storeMemory({
          userId,
          content,
          importance,
          metadata: metadata as Record<string, unknown> | undefined,
        });

        return {
          success: true,
          message: 'Information stored in memory successfully',
          memoryId: memory.id,
          content,
          importance,
        };
      } catch (error) {
        console.error('[Remember Tool] Failed to store memory:', error);
        return {
          success: false,
          error: 'Failed to store memory. Please try again.',
          content,
        };
      }
    },
  });

