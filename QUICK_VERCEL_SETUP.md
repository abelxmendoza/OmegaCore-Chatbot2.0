# Quick Vercel Setup - Copy from .env.local

Since you already have `POSTGRES_URL` in your `.env.local`, just copy it to Vercel:

## Steps:

1. **Open your `.env.local` file** and find the line:
   ```
   POSTGRES_URL=postgresql://...
   ```

2. **Copy the entire value** (everything after the `=` sign)

3. **Go to Vercel:**
   - https://vercel.com/dashboard
   - Select your project: **OmegaCore-Chatbot2.0**
   - Go to: **Settings** → **Environment Variables**

4. **Add the variable:**
   - Click **Add New**
   - **Key:** `POSTGRES_URL`
   - **Value:** (paste the value from your .env.local)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

5. **Also add these from your .env.local:**
   - `AUTH_SECRET` (required for NextAuth)
   - `OPENAI_API_KEY` (required for chat)
   - `BLOB_READ_WRITE_TOKEN` (optional, for file uploads)

6. **Update URLs for production:**
   - `AUTH_URL` = `https://omega-core-chatbot2-0.vercel.app/`
   - `NEXTAUTH_URL` = `https://omega-core-chatbot2-0.vercel.app`
   - `AUTH_TRUST_HOST` = `true`

7. **Redeploy** (or wait for automatic redeploy)

## ✅ After Setup:

- Guest login will work
- Chat history will be saved
- Full functionality enabled

## 🔍 Verify Connection String Format:

Your POSTGRES_URL should look like:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Or if using direct connection:
```
postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

If it's a Supabase connection string, it should contain `supabase.com` or `supabase.co` in the hostname.

