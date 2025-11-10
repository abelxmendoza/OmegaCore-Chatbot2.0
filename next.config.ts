import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    turbo: {}, // ✅ FIXED: Must be an object, not a boolean
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
              "connect-src 'self' https://api.openai.com https://api.x.ai https://api.anthropic.com https://*.vercel.app",
            ].join('; '),
          },
        ],
      },
    ];
  },
  webpack: (config, { webpack }) => {
    // Make @ai-sdk/anthropic optional - ignore if not available
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@ai-sdk\/anthropic$/,
        contextRegExp: /lib\/ai\/providers/,
      })
    );
    return config;
  },
};

export default nextConfig;
