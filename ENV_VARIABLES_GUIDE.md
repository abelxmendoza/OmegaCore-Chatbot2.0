# Environment Variables Setup Guide

## 📍 Where to Set What

### Local Development (`.env.local`)

```bash
# For local development - use localhost
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000/
AUTH_SECRET=your-secret-here
POSTGRES_URL=your-postgres-url-here
OPENAI_API_KEY=your-openai-key-here
```

### Vercel Production (Environment Variables)

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

Set these for **Production, Preview, and Development**:

```bash
# ✅ Set to your Vercel domain (with https://)
NEXTAUTH_URL=https://omega-core-chatbot2-0.vercel.app

# ✅ Optional - can also set this, or delete it (trustHost handles it)
AUTH_URL=https://omega-core-chatbot2-0.vercel.app/

# ✅ Required
AUTH_SECRET=your-secret-here

# ✅ Required (your Supabase connection string)
POSTGRES_URL=postgresql://...

# ✅ Required
OPENAI_API_KEY=your-openai-key-here

# ✅ Optional
BLOB_READ_WRITE_TOKEN=your-blob-token-here
```

## 🔑 Key Points

1. **Local (.env.local):** Use `http://localhost:3000`
2. **Vercel:** Use `https://omega-core-chatbot2-0.vercel.app` (with `https://`)
3. **AUTH_SECRET:** Should be the SAME in both places (copy from `.env.local` to Vercel)
4. **POSTGRES_URL:** Should be the SAME in both places (your Supabase connection string)

## ⚠️ Important Notes

- **Always include `https://`** in the Vercel `NEXTAUTH_URL`
- **Never commit `.env.local`** to Git (it's in `.gitignore`)
- **Set variables for:** ✅ Production, ✅ Preview, ✅ Development in Vercel
- After updating Vercel variables, **redeploy** your app

## 🚀 Quick Steps

1. **Copy from `.env.local` to Vercel:**
   - `AUTH_SECRET`
   - `POSTGRES_URL`
   - `OPENAI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN` (if you have it)

2. **Set in Vercel only (different from local):**
   - `NEXTAUTH_URL` = `https://omega-core-chatbot2-0.vercel.app`
   - `AUTH_URL` = `https://omega-core-chatbot2-0.vercel.app/` (optional)

3. **Keep in `.env.local` only (for local dev):**
   - `NEXTAUTH_URL` = `http://localhost:3000`

## ✅ After Setup

1. Save environment variables in Vercel
2. Redeploy (or wait for auto-redeploy)
3. Clear browser cache
4. Test: Visit `https://omega-core-chatbot2-0.vercel.app`

