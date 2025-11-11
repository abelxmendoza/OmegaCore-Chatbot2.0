import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Shell Execution tool - executes shell commands in a controlled environment
 * WARNING: This tool has security implications. Use with caution.
 * 
 * Security features:
 * - Command whitelist/blacklist
 * - Timeout protection
 * - Output sanitization
 * - Restricted in production by default
 */
export const shellExec = tool({
  description:
    'Execute a shell command in a controlled environment. Use for system operations, file management, and automation. Commands are restricted for security.',
  parameters: z.object({
    command: z
      .string()
      .describe('The shell command to execute (e.g., "ls -la", "pwd", "cat file.txt")'),
    timeout: z
      .number()
      .optional()
      .default(5000)
      .describe('Timeout in milliseconds (default: 5000ms, max: 30000ms)'),
  }),
  execute: async ({ command, timeout = 5000 }) => {
    // Security: Block in production unless explicitly enabled
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const shellEnabled = process.env.ENABLE_SHELL_TOOL === 'true';
    
    if (isProduction && !shellEnabled) {
      return {
        error: 'Shell execution is disabled in production for security. Set ENABLE_SHELL_TOOL=true to enable (not recommended).',
        command,
      };
    }

    // Security: Command blacklist - dangerous commands
    const dangerousCommands = [
      'rm -rf',
      'rm -r',
      'rm -f',
      'format',
      'mkfs',
      'dd if=',
      'shutdown',
      'reboot',
      'halt',
      'poweroff',
      'sudo',
      'su ',
      'chmod 777',
      'chown root',
      '> /dev/',
      'curl | sh',
      'wget | sh',
      '| bash',
      '| sh',
    ];

    const lowerCommand = command.toLowerCase();
    for (const dangerous of dangerousCommands) {
      if (lowerCommand.includes(dangerous.toLowerCase())) {
        return {
          error: `Command blocked for security: contains dangerous pattern "${dangerous}"`,
          command,
        };
      }
    }

    // Security: Validate timeout
    const safeTimeout = Math.min(Math.max(timeout, 1000), 30000); // Between 1s and 30s

    try {
      // Execute command with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: safeTimeout,
        maxBuffer: 1024 * 1024, // 1MB max output
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
      });

      // Sanitize output - remove potential sensitive info
      const sanitizeOutput = (output: string): string => {
        return output
          .replace(/password\s*[:=]\s*[^\s]+/gi, 'password: [REDACTED]')
          .replace(/api[_-]?key\s*[:=]\s*[^\s]+/gi, 'api_key: [REDACTED]')
          .replace(/secret\s*[:=]\s*[^\s]+/gi, 'secret: [REDACTED]')
          .replace(/token\s*[:=]\s*[^\s]+/gi, 'token: [REDACTED]');
      };

      return {
        success: true,
        command,
        stdout: sanitizeOutput(stdout),
        stderr: sanitizeOutput(stderr),
        exitCode: 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        // Command execution error
        const execError = error as { code?: number; signal?: string; stdout?: string; stderr?: string };
        
        return {
          success: false,
          command,
          error: execError.signal === 'SIGTERM' 
            ? 'Command timed out' 
            : `Command failed with exit code ${execError.code || 'unknown'}`,
          stdout: execError.stdout || '',
          stderr: execError.stderr || '',
          exitCode: execError.code || 1,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        command,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  },
});

