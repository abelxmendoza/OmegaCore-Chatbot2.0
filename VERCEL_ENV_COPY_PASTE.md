# 📋 Copy-Paste Guide: Vercel Environment Variables

## ✅ Copy These EXACTLY from your `.env.local` to Vercel:

1. **AUTH_SECRET** = (copy the value from your `.env.local`)
2. **POSTGRES_URL** = (copy the value from your `.env.local`)
3. **OPENAI_API_KEY** = (copy the value from your `.env.local`)
4. **BLOB_READ_WRITE_TOKEN** = (copy the value from your `.env.local`, if you have it)

## 🔄 Change These for Vercel (different from local):

5. **NEXTAUTH_URL** = `https://omega-core-chatbot2-0.vercel.app`
   - ⚠️ **Important:** Use `https://` (not `http://`)
   - ⚠️ **Important:** Include the full domain

6. **AUTH_URL** = `https://omega-core-chatbot2-0.vercel.app/`
   - (Optional - you can delete this if you want, `trustHost: true` handles it)

## 📝 Optional Variables (if you have them):

7. **XAI_API_KEY** = (if you want to use xAI/Grok models)
8. **ANTHROPIC_API_KEY** = (if you want to use Claude models)

## 🚀 Steps in Vercel:

1. Go to: **Settings** → **Environment Variables**
2. For each variable above:
   - Click **Add New**
   - Paste the **Key** (left side)
   - Paste the **Value** (right side)
   - Select: ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click **Save**
3. After adding all variables, go to **Deployments** → **Redeploy**

## ⚠️ Important Notes:

- **Never commit `.env.local`** to Git (it's already in `.gitignore`)
- **AUTH_SECRET** should be the SAME in both `.env.local` and Vercel
- **POSTGRES_URL** should be the SAME in both (your Supabase connection string)
- **NEXTAUTH_URL** is DIFFERENT: localhost for local, Vercel domain for production

## ✅ After Setup:

1. Save all variables
2. Redeploy
3. Clear browser cache
4. Visit: `https://omega-core-chatbot2-0.vercel.app`
5. Should work! 🎉

