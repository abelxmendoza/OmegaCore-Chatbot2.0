import { tool } from 'ai';
import { z } from 'zod';

/**
 * Get current time and date information
 */
export const getTime = tool({
  description: 'Get the current time, date, and timezone information. Useful for answering questions about what time it is, what day it is, or time-related calculations.',
  parameters: z.object({
    timezone: z.string().optional().describe('Optional timezone (e.g., "America/New_York", "UTC", "Europe/London"). Defaults to user\'s local timezone.'),
    format: z.enum(['full', 'time', 'date', 'iso', 'unix']).optional().describe('Format of the response: full (date and time), time (time only), date (date only), iso (ISO 8601), or unix (Unix timestamp)'),
  }),
  execute: async ({ timezone, format = 'full' }) => {
    try {
      const now = timezone 
        ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
        : new Date();

      const timezoneName = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      const result: Record<string, string> = {
        timezone: timezoneName,
        unix: Math.floor(now.getTime() / 1000).toString(),
        iso: now.toISOString(),
      };

      switch (format) {
        case 'time':
          result.time = now.toLocaleTimeString('en-US', { 
            timeZone: timezone || undefined,
            hour12: true 
          });
          result.time24 = now.toLocaleTimeString('en-US', { 
            timeZone: timezone || undefined,
            hour12: false 
          });
          break;
        case 'date':
          result.date = now.toLocaleDateString('en-US', { 
            timeZone: timezone || undefined,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          break;
        case 'unix':
          // Already set above
          break;
        case 'iso':
          // Already set above
          break;
        case 'full':
        default:
          result.date = now.toLocaleDateString('en-US', { 
            timeZone: timezone || undefined,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          result.time = now.toLocaleTimeString('en-US', { 
            timeZone: timezone || undefined,
            hour12: true 
          });
          result.time24 = now.toLocaleTimeString('en-US', { 
            timeZone: timezone || undefined,
            hour12: false 
          });
          break;
      }

      return result;
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Failed to get time',
        timezone: timezone || 'local'
      };
    }
  },
});

