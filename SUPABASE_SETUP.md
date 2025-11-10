# Supabase Database Setup for Omega-Core

You have two options to use Supabase with this app:

## Option 1: Use Supabase PostgreSQL Connection String (Recommended)

The app uses Drizzle ORM with PostgreSQL, which works perfectly with Supabase's PostgreSQL database.

### Steps:

1. **Get your Supabase PostgreSQL connection string:**
   - Go to: https://supabase.com/dashboard/project/hahrpcewbqocxuoqvonq
   - Navigate to: **Settings** → **Database**
   - Scroll to **Connection string** section
   - Select **URI** tab
   - Copy the connection string (it looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)

2. **Add to Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `POSTGRES_URL` = (your Supabase connection string)
   - Make sure to set it for: ✅ Production, ✅ Preview, ✅ Development

3. **Run migrations:**
   - The migrations will run automatically on first deployment
   - Or you can run them manually after setting up the database

## Option 2: Use Supabase Client (Requires Code Changes)

If you want to use Supabase's client library instead of Drizzle, that would require significant refactoring of the database layer.

## Current Setup

The app is already configured to work with PostgreSQL (which Supabase uses). You just need:
- The PostgreSQL connection string from Supabase
- Set it as `POSTGRES_URL` in Vercel

## Your Supabase Info

- **Project URL:** https://hahrpcewbqocxuoqvonq.supabase.co
- **API Key:** (you provided the anon key - this is for client-side, not needed for server-side DB)

**Note:** The API key you provided is the anon/public key for client-side usage. For server-side database access, you need the PostgreSQL connection string from Supabase dashboard.

