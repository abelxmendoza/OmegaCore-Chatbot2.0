# ⚠️ URGENT: Fix Localhost Redirect in Vercel

## The Problem
Your app is redirecting to `http://localhost:3000/chat` because `NEXTAUTH_URL` is set to localhost in Vercel.

## ⚡ Quick Fix (2 minutes)

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Click on: **OmegaCore-Chatbot2.0**

### Step 2: Delete/Update NEXTAUTH_URL
1. Go to: **Settings** → **Environment Variables**
2. Find: `NEXTAUTH_URL`
3. **DELETE IT** (or change to: `https://omega-core-chatbot2-0.vercel.app`)
4. Also check `AUTH_URL` - **DELETE IT** if it exists
5. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **⋯** on the latest deployment
3. Click **Redeploy**

### Step 4: Test
1. Clear browser cache (or use incognito)
2. Visit: `https://omega-core-chatbot2-0.vercel.app`
3. Should stay on Vercel domain ✅

## Why This Happens

Even with `trustHost: true`, if `NEXTAUTH_URL` is explicitly set to `http://localhost:3000`, NextAuth will use it to construct callback URLs, causing redirects to localhost.

## Code Protection

The code now has a redirect callback that **rejects any localhost URLs**, but you still need to remove/update the environment variable for it to work properly.

---

**After you fix the environment variable, the redirect should work correctly!**

