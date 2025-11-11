import { tool } from 'ai';
import { z } from 'zod';
import { sanitizeURL, sanitizeString, sanitizeHTML } from '@/lib/security/sanitize';

/**
 * Web Browser tool - fetches and extracts content from web pages
 * Designed for security research and information gathering
 * Enhanced with comprehensive security measures
 */
export const webBrowser = tool({
  description:
    'Fetch and extract content from a web page. Returns the page title, main text content, and links. Useful for web scraping, research, and information gathering.',
  parameters: z.object({
    url: z
      .string()
      .url()
      .max(2048)
      .describe('The URL to fetch and extract content from (must include http:// or https://)'),
    extractLinks: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to extract and return links from the page'),
    maxLength: z
      .number()
      .optional()
      .default(10000)
      .min(100)
      .max(100000)
      .describe('Maximum length of extracted content in characters (100-100000)'),
  }),
  execute: async ({ url, extractLinks = true, maxLength = 10000 }) => {
    try {
      // Security: Sanitize and validate URL
      const sanitizedUrl = sanitizeURL(url);
      if (!sanitizedUrl) {
        return {
          error: 'Invalid or unsafe URL. Only http:// and https:// URLs are allowed.',
          url,
        };
      }

      // Validate URL scheme
      if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
        return {
          error: 'Invalid URL scheme. Must start with http:// or https://',
          url: sanitizedUrl,
        };
      }

      // Security: Block localhost and private IPs in production
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      if (isProduction) {
        const urlObj = new URL(sanitizedUrl);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Block localhost and private IP ranges
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.16.') ||
          hostname.startsWith('172.17.') ||
          hostname.startsWith('172.18.') ||
          hostname.startsWith('172.19.') ||
          hostname.startsWith('172.20.') ||
          hostname.startsWith('172.21.') ||
          hostname.startsWith('172.22.') ||
          hostname.startsWith('172.23.') ||
          hostname.startsWith('172.24.') ||
          hostname.startsWith('172.25.') ||
          hostname.startsWith('172.26.') ||
          hostname.startsWith('172.27.') ||
          hostname.startsWith('172.28.') ||
          hostname.startsWith('172.29.') ||
          hostname.startsWith('172.30.') ||
          hostname.startsWith('172.31.')
        ) {
        return {
          error: 'Access to localhost and private IPs is blocked in production for security',
          url: sanitizedUrl,
        };
        }
      }

      // Fetch the page with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(sanitizedUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return {
            error: `HTTP ${response.status}: ${response.statusText}`,
            url: sanitizedUrl,
            status: response.status,
          };
        }

        const html = await response.text();

        // Extract title and sanitize
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const rawTitle = titleMatch ? titleMatch[1].trim() : 'No title found';
        const title = sanitizeString(sanitizeHTML(rawTitle), 500);

        // Extract main content - remove script and style tags, then sanitize
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Sanitize extracted content
        textContent = sanitizeString(sanitizeHTML(textContent), maxLength);

        // Truncate if too long
        if (textContent.length > maxLength) {
          textContent = textContent.substring(0, maxLength) + '... [truncated]';
        }

        // Extract links if requested
        let links: string[] = [];
        if (extractLinks) {
          const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
          const linkMatches = html.matchAll(linkRegex);
          const linkSet = new Set<string>();

          for (const match of linkMatches) {
            const href = match[1];
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
              try {
                // Resolve relative URLs
                const absoluteUrl = new URL(href, sanitizedUrl).toString();
                // Validate resolved URL
                const validatedUrl = sanitizeURL(absoluteUrl);
                if (validatedUrl) {
                  linkSet.add(validatedUrl);
                }
              } catch {
                // Invalid URL, skip
              }
            }
          }

          links = Array.from(linkSet).slice(0, 50); // Limit to 50 links
        }

        return {
          success: true,
          url: sanitizedUrl,
          title,
          content: textContent,
          links: extractLinks ? links : undefined,
          contentLength: textContent.length,
          timestamp: new Date().toISOString(),
        };
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            error: 'Request timeout - the server took too long to respond',
            url,
          };
        }
        
        throw fetchError;
      }
    } catch (error: unknown) {
      // Don't leak sensitive error details
      console.error('[Web Browser] Error:', error);
      return {
        error: 'Failed to fetch URL. Please check the URL and try again.',
        url: sanitizedUrl || url,
      };
    }
  },
});

