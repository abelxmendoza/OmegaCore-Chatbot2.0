# Vercel Environment Variables Checklist

Copy these variables from your `.env.local` to Vercel Dashboard:

## ✅ Required Variables

1. **AUTH_SECRET** - Copy from your `.env.local`
2. **POSTGRES_URL** - Copy from your `.env.local` 
3. **OPENAI_API_KEY** - Copy from your `.env.local`
4. **BLOB_READ_WRITE_TOKEN** - Copy from your `.env.local`

## ⚠️ Important: Update These for Production

These are currently set to `localhost` - update them to your Vercel URL after deployment:

5. **AUTH_URL** - Change from `http://localhost:3000/` to `https://your-app.vercel.app/`
6. **NEXTAUTH_URL** - Change from `http://localhost:3000` to `https://your-app.vercel.app`
7. **NEXTAUTH_URL_INTERNAL** - Change from `http://localhost:3000` to `https://your-app.vercel.app`
8. **AUTH_TRUST_HOST** - Set to `true`

## Optional Variables

9. **NEXT_PUBLIC_APP_NAME** - `Omega-Core`
10. **AI_MODEL_PROVIDER** - `openai`
11. **NEXTAUTH_SECRET** - Same as AUTH_SECRET (if needed)

## 📝 Steps

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable from your `.env.local`
3. For AUTH_URL and NEXTAUTH_URL: Wait for first deployment, then update with your actual Vercel domain
4. Set for: ✅ Production, ✅ Preview, ✅ Development
5. Redeploy

## 🔐 Security Note

Never commit `.env.local` or files with API keys to Git. Always use Vercel's environment variables for production.
