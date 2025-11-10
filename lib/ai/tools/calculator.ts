import { tool } from 'ai';
import { z } from 'zod';

/**
 * Calculator tool - evaluates mathematical expressions safely
 */
export const calculator = tool({
  description: 'Evaluate a mathematical expression. Supports basic arithmetic, parentheses, and common functions.',
  parameters: z.object({
    expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(pi/2)")'),
  }),
  execute: async ({ expression }) => {
    try {
      // Sanitize expression - only allow safe math operations
      const sanitized = expression
        .replace(/[^0-9+\-*/().\s,sqrtcossintanloglnpiePI]/gi, '')
        .trim();

      if (!sanitized) {
        return { result: 'Error: Invalid expression', error: 'Expression contains invalid characters' };
      }

      // Use Function constructor in a safe way (only math operations)
      // This is safer than eval but still allows math calculations
      const allowedFunctions = {
        sqrt: Math.sqrt,
        cos: Math.cos,
        sin: Math.sin,
        tan: Math.tan,
        log: Math.log10,
        ln: Math.log,
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        max: Math.max,
        min: Math.min,
        pow: Math.pow,
        PI: Math.PI,
        E: Math.E,
        pi: Math.PI,
        e: Math.E,
      };

      // Replace function names and constants
      let processedExpression = sanitized
        .replace(/PI|pi/g, String(Math.PI))
        .replace(/E|e(?![a-z])/g, String(Math.E));

      // Evaluate using Function (safer than eval)
      // Note: This is still a security consideration - only use with trusted input
      try {
        const func = new Function(
          ...Object.keys(allowedFunctions),
          `return ${processedExpression}`
        );
        const result = func(...Object.values(allowedFunctions));
        
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return { 
            result: result.toString(),
            expression: sanitized,
            formatted: result.toLocaleString('en-US', { maximumFractionDigits: 10 })
          };
        }
      } catch (evalError) {
        return { 
          result: 'Error: Calculation failed', 
          error: evalError instanceof Error ? evalError.message : 'Invalid expression',
          expression: sanitized
        };
      }

      return { result: 'Error: Invalid expression', error: 'Expression did not evaluate to a valid number' };
    } catch (error) {
      return { 
        result: 'Error: Calculation failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        expression: expression || 'unknown'
      };
    }
  },
});

