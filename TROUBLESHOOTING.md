# Troubleshooting Guide

## Error: createActionURL

### Symptom
```
createActionURL@rsc://React/Server/...
async Layout@rsc://React/Server/...
```

### Cause
NextAuth can't determine the base URL during server-side rendering. This happens when `NEXTAUTH_URL` is not set in your `.env.local` file.

### Solution

1. **Check your `.env.local` file** - Make sure you have:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Restart your dev server** after adding/updating `.env.local`:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   pnpm dev
   ```

3. **Verify the variable is loaded**:
   - The dev server must be restarted for new env variables to take effect
   - Check that `.env.local` is in the project root (not in a subdirectory)

### Why This Happens

NextAuth needs to know the base URL to create action URLs (like sign-in links). Even with `trustHost: true`, during server-side rendering (like in Layout components), NextAuth doesn't have access to the request context, so it falls back to `NEXTAUTH_URL`.

### For Production (Vercel)

In Vercel, `trustHost: true` works because:
- Vercel provides request headers that NextAuth can use
- The request context is available during SSR

For local development, you must set `NEXTAUTH_URL` in `.env.local`.

## Other Common Issues

### Redirect to localhost on Vercel

See: `FIX_VERCEL_REDIRECT.md` or `URGENT_VERCEL_FIX.md`

### Guest login not working

1. Check that `AUTH_SECRET` is set
2. Check that `POSTGRES_URL` is set (or guest will use temporary sessions)
3. See: `QUICK_VERCEL_SETUP.md`

### Database connection errors

1. Verify `POSTGRES_URL` is correct
2. Check Supabase connection string format
3. See: `SUPABASE_CONNECTION_STRING.md`

