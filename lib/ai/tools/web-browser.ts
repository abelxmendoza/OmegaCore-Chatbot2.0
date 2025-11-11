import { tool } from 'ai';
import { z } from 'zod';

/**
 * Web Browser tool - fetches and extracts content from web pages
 * Designed for security research and information gathering
 */
export const webBrowser = tool({
  description:
    'Fetch and extract content from a web page. Returns the page title, main text content, and links. Useful for web scraping, research, and information gathering.',
  parameters: z.object({
    url: z
      .string()
      .url()
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
      .describe('Maximum length of extracted content in characters'),
  }),
  execute: async ({ url, extractLinks = true, maxLength = 10000 }) => {
    try {
      // Validate URL scheme
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
          error: 'Invalid URL scheme. Must start with http:// or https://',
          url,
        };
      }

      // Security: Block localhost and private IPs in production
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      if (isProduction) {
        const urlObj = new URL(url);
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
            url,
          };
        }
      }

      // Fetch the page with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, {
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
            url,
            status: response.status,
          };
        }

        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'No title found';

        // Extract main content - remove script and style tags
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

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
                const absoluteUrl = new URL(href, url).toString();
                linkSet.add(absoluteUrl);
              } catch {
                // Invalid URL, skip
              }
            }
          }

          links = Array.from(linkSet).slice(0, 50); // Limit to 50 links
        }

        return {
          success: true,
          url,
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
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        url,
      };
    }
  },
});

