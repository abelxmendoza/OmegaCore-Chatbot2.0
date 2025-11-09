# Vercel Environment Variables Setup

Copy these from your `.env.local` to Vercel Dashboard:

## Required Variables (Must Have)

1. **AUTH_SECRET**
   - Used for: NextAuth.js authentication
   - Format: Random string (32+ characters)
   - Generate: https://generate-secret.vercel.app/32

2. **POSTGRES_URL**
   - Used for: Database connection
   - Format: `postgres://user:password@host:port/database?sslmode=require`
   - Get from: Vercel Dashboard > Storage > Postgres (if using Vercel Postgres)

3. **OPENAI_API_KEY**
   - Used for: GPT-4 models (default chat models)
   - Format: `sk-...`
   - Get from: https://platform.openai.com/api-keys

## Optional Variables (Nice to Have)

4. **XAI_API_KEY**
   - Used for: Grok models (recommended for security research)
   - Get from: https://console.x.ai/

5. **ANTHROPIC_API_KEY**
   - Used for: Claude models
   - Format: `sk-ant-...`
   - Get from: https://console.anthropic.com/

6. **BLOB_READ_WRITE_TOKEN**
   - Used for: File uploads
   - Get from: Vercel Dashboard > Storage > Blob

## How to Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: **OmegaCore-Chatbot2.0**
3. Go to: **Settings** → **Environment Variables**
4. For each variable:
   - Click **Add New**
   - Enter the **Key** (e.g., `AUTH_SECRET`)
   - Enter the **Value** (from your `.env.local`)
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

## Important Notes

- ⚠️ **Never commit `.env.local` to Git** (it's already in `.gitignore`)
- ✅ **Always set variables in Vercel Dashboard** for deployments
- 🔄 **Redeploy after adding new variables** for them to take effect
- 🔐 **Keep your API keys secure** - don't share them publicly

## Quick Checklist

- [ ] AUTH_SECRET
- [ ] POSTGRES_URL  
- [ ] OPENAI_API_KEY
- [ ] XAI_API_KEY (optional)
- [ ] ANTHROPIC_API_KEY (optional)
- [ ] BLOB_READ_WRITE_TOKEN (optional)

