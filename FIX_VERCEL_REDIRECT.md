# Fix: Vercel Redirecting to Localhost

## Problem
When visiting `https://omega-core-chatbot2-0.vercel.app`, you get redirected to `http://localhost:3000/chat`.

## Root Cause
NextAuth is using the `NEXTAUTH_URL` environment variable which is set to `http://localhost:3000` in Vercel.

## Solution

### Step 1: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **OmegaCore-Chatbot2.0**
3. Go to **Settings** → **Environment Variables**
4. Find `NEXTAUTH_URL` and either:
   - **Option A (Recommended):** Delete it entirely - `trustHost: true` will handle it automatically
   - **Option B:** Update it to: `https://omega-core-chatbot2-0.vercel.app`
5. Also check/update `AUTH_URL`:
   - Delete it, or set to: `https://omega-core-chatbot2-0.vercel.app/`
6. Make sure these are set for: ✅ Production, ✅ Preview, ✅ Development
7. Click **Save**

### Step 2: Redeploy

After updating environment variables:
- Vercel will automatically redeploy, OR
- Go to **Deployments** → Click **⋯** → **Redeploy**

### Step 3: Clear Browser Cache

After redeploy:
1. Clear your browser cache/cookies for the Vercel domain
2. Or use an incognito/private window
3. Visit `https://omega-core-chatbot2-0.vercel.app` again

## Why This Happens

NextAuth uses `NEXTAUTH_URL` to construct callback URLs. Even with `trustHost: true`, if `NEXTAUTH_URL` is explicitly set to localhost, it can cause redirects to localhost.

## Code Changes Made

The code has been updated to:
- Use request origin instead of `NEXTAUTH_URL` when possible
- Added redirect callback to ensure correct origin
- Updated guest auth route to use request origin

But you still need to update/remove the `NEXTAUTH_URL` environment variable in Vercel for it to work completely.

## Verify It's Fixed

After redeploy, visiting `https://omega-core-chatbot2-0.vercel.app` should:
- ✅ Stay on the Vercel domain
- ✅ Not redirect to localhost
- ✅ Show the chat interface

