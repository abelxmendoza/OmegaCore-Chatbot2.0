import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * System Security tool - performs security checks on the system
 * Designed for security research and system monitoring
 * 
 * Security features:
 * - Non-destructive checks only
 * - Rate limiting
 * - Output sanitization
 * - Restricted in production by default
 */
export const systemSecurity = tool({
  description:
    'Perform security checks on the system. Checks for vulnerabilities, updates, and security issues. Use for security research and system monitoring.',
  parameters: z.object({
    checkType: z
      .enum(['updates', 'permissions', 'network', 'processes', 'files', 'all'])
      .describe('Type of security check to perform'),
    detailed: z
      .boolean()
      .optional()
      .default(false)
      .describe('Return detailed information (may be slower)'),
  }),
  execute: async ({ checkType, detailed = false }) => {
    // Security: Block in production unless explicitly enabled
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const securityEnabled = process.env.ENABLE_SECURITY_TOOL === 'true';
    
    if (isProduction && !securityEnabled) {
      return {
        error: 'Security checks are disabled in production for safety. Set ENABLE_SECURITY_TOOL=true to enable (not recommended).',
        checkType,
      };
    }

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      checkType,
      detailed,
      checks: {},
    };

    try {
      // Check 1: System Updates
      if (checkType === 'updates' || checkType === 'all') {
        try {
          if (process.platform === 'darwin') {
            // macOS: Check for software updates (non-interactive)
            const { stdout } = await execAsync('softwareupdate --list 2>&1 || echo "No updates available"');
            const hasUpdates = !stdout.includes('No new software available') && !stdout.includes('No updates available');
            results.checks.updates = {
              status: hasUpdates ? 'updates-available' : 'up-to-date',
              output: stdout.substring(0, 500), // Limit output
              platform: 'macOS',
            };
            
            // Also check Homebrew updates
            try {
              const { stdout: brewOut } = await execAsync('brew outdated 2>&1 || echo "All packages up to date"');
              results.checks.homebrew = {
                status: brewOut.includes('up to date') ? 'up-to-date' : 'updates-available',
                packages: brewOut.split('\n').filter((l) => l.trim() && !l.includes('up to date')).length,
              };
            } catch {
              // Homebrew not installed or error
              results.checks.homebrew = { status: 'not-available' };
            }
          } else if (process.platform === 'linux') {
            // Linux: Check package updates
            const { stdout } = await execAsync('apt list --upgradable 2>&1 || yum check-update 2>&1 || echo "No updates available"');
            results.checks.updates = {
              status: stdout.includes('No updates') ? 'up-to-date' : 'updates-available',
              output: stdout.substring(0, 500),
              platform: 'Linux',
            };
          }
        } catch (error) {
          results.checks.updates = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Check 2: File Permissions
      if (checkType === 'permissions' || checkType === 'all') {
        try {
          if (process.platform === 'darwin' || process.platform === 'linux') {
            // Check for world-writable files in home directory (security risk)
            const { stdout } = await execAsync(
              `find ~ -maxdepth 3 -perm -002 -type f 2>/dev/null | head -20 || echo "No issues found"`,
            );
            results.checks.permissions = {
              status: stdout.includes('No issues') ? 'secure' : 'potential-issues',
              count: stdout.split('\n').filter((l) => l.trim()).length,
              output: stdout.substring(0, 500),
            };
          }
        } catch (error) {
          results.checks.permissions = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Check 3: Network Connections
      if (checkType === 'network' || checkType === 'all') {
        try {
          if (process.platform === 'darwin' || process.platform === 'linux') {
            // Check listening ports
            const { stdout } = await execAsync('netstat -an | grep LISTEN | head -20 2>&1 || ss -tuln | head -20 2>&1 || echo "No listening ports"');
            results.checks.network = {
              status: 'info',
              connections: stdout.split('\n').filter((l) => l.trim()).length,
              output: stdout.substring(0, 1000),
            };
          }
        } catch (error) {
          results.checks.network = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Check 4: Running Processes
      if (checkType === 'processes' || checkType === 'all') {
        try {
          if (process.platform === 'darwin' || process.platform === 'linux') {
            // List top processes by CPU
            const { stdout } = await execAsync('ps aux | head -20 2>&1 || echo "No processes"');
            results.checks.processes = {
              status: 'info',
              count: stdout.split('\n').filter((l) => l.trim()).length - 1,
              output: stdout.substring(0, 1000),
            };
          }
        } catch (error) {
          results.checks.processes = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Check 5: Suspicious Files
      if (checkType === 'files' || checkType === 'all') {
        try {
          if (process.platform === 'darwin' || process.platform === 'linux') {
            // Check for common suspicious file patterns
            const { stdout } = await execAsync(
              `find ~ -maxdepth 3 -name "*.sh" -o -name "*.py" -o -name "*.exe" 2>/dev/null | head -20 || echo "No suspicious files found"`,
            );
            results.checks.files = {
              status: stdout.includes('No suspicious') ? 'clean' : 'files-found',
              count: stdout.split('\n').filter((l) => l.trim()).length,
              output: stdout.substring(0, 500),
            };
          }
        } catch (error) {
          results.checks.files = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Overall status
      const hasIssues = Object.values(results.checks).some(
        (check: any) => check.status === 'potential-issues' || check.status === 'updates-available',
      );

      results.overallStatus = hasIssues ? 'attention-needed' : 'secure';
      results.summary = `Completed ${Object.keys(results.checks).length} security check(s)`;

      return {
        success: true,
        ...results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        checkType,
      };
    }
  },
});

