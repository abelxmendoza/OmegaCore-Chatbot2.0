# How to Get Supabase PostgreSQL Connection String

## ⚠️ You're in the Wrong Section

You're currently looking at **API Settings** → **Data API Settings**. 

For this app, you need the **Database Connection String** instead.

## ✅ Correct Steps:

1. **Go to Database Settings:**
   - In your Supabase dashboard: https://supabase.com/dashboard/project/hahrpcewbqocxuoqvonq
   - Click **Settings** (gear icon) in the left sidebar
   - Click **Database** (not "API")

2. **Find Connection String:**
   - Scroll down to **Connection string** section
   - You'll see tabs: **URI**, **JDBC**, **Golang**, **Node.js**, etc.
   - Click the **URI** tab
   - You'll see something like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

3. **Copy the Connection String:**
   - Click the **copy** button next to the URI
   - This is what you'll use as `POSTGRES_URL` in Vercel

## 🔐 Important Notes:

- **You'll need your database password** - if you don't remember it, you can reset it in the Database settings
- Use the **Connection pooling** URI (port 6543) for better performance
- The connection string includes your password - keep it secure!

## 📝 Alternative: Connection Pooling

If you see **Connection pooling** section:
- Use the **Session mode** or **Transaction mode** connection string
- Port **6543** is for connection pooling (recommended)
- Port **5432** is direct connection (use if pooling doesn't work)

## 🚀 After Getting the Connection String:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `POSTGRES_URL` = (paste the connection string)
3. Set for: ✅ Production, ✅ Preview, ✅ Development
4. Redeploy

## ❓ Can't Find It?

If you can't find the connection string:
- Make sure you're in **Settings** → **Database** (not API)
- Look for "Connection string" or "Connection info" section
- It might be under "Connection pooling" or "Database URL"

