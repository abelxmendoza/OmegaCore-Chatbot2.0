# Fix: Redirect Loop Error

## Problem
"The page isn't redirecting properly" - Firefox detects an infinite redirect loop.

## Root Cause
1. `AUTH_URL` in `.env.local` is set to Vercel URL (`https://omega-core-chatbot2-0.vercel.app`) instead of localhost
2. The redirect flow creates a loop: `/` → `/api/auth/guest` → NextAuth callback → `/` → repeat

## Solution

### Step 1: Fix `.env.local`

Change `AUTH_URL` from:
```env
AUTH_URL=https://omega-core-chatbot2-0.vercel.app
```

To (for local development):
```env
AUTH_URL=http://localhost:3000/
```

Or **remove it entirely** - `NEXTAUTH_URL` is enough for local dev.

### Step 2: Restart Dev Server

After fixing `.env.local`:
```bash
# Stop server (Ctrl+C)
pnpm dev
```

## What Was Fixed in Code

1. **Homepage redirect** - Now uses relative paths to avoid redirect loops
2. **Guest auth route** - Better handling of already-authenticated users
3. **Redirect logic** - Prevents infinite loops

## Environment Variables Summary

### For Local Development (`.env.local`):
```env
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000/  # Optional, can remove
```

### For Vercel Production:
```env
NEXTAUTH_URL=https://omega-core-chatbot2-0.vercel.app
AUTH_URL=https://omega-core-chatbot2-0.vercel.app/  # Optional
```

## Verify It's Fixed

After fixing `AUTH_URL` and restarting:
1. Visit `http://localhost:3000`
2. Should redirect to `/chat` without loops
3. No "redirecting properly" error

