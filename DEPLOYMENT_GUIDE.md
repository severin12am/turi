# Deployment Guide for Turi-Beta

## 🚨 Critical: Environment Variables Setup

Your deployed app is showing "loading forever" because **environment variables are not set** in your deployment platform.

### Console Error You're Seeing:
```
⚠️ Using fallback Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
```

This means your production app is trying to use hardcoded fallback values instead of the actual environment variables.

---

## Required Environment Variables

You need to set these environment variables in your deployment platform:

### 1. Supabase Configuration (REQUIRED)
```
VITE_SUPABASE_URL=https://fjvltffpcafcbbpwzyml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdmx0ZmZwY2FmY2JicHd6eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MjUxNTQsImV4cCI6MjA1ODAwMTE1NH0.uuhJLxTJL26r2jfD9Cb5IMKYaScDNsJeHYJue4pfWRk
```

### 2. Google Gemini API (Optional - for AI features)
```
VITE_GOOGLE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

---

## Platform-Specific Instructions

### Vercel

1. **Go to your project** on Vercel dashboard
2. **Navigate to**: Settings → Environment Variables
3. **Add each variable**:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://fjvltffpcafcbbpwzyml.supabase.co`
   - Click "Add"
   
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (the long JWT token above)
   - Click "Add"

4. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Make sure "Use existing Build Cache" is **unchecked**

### Netlify

1. **Go to your site** on Netlify dashboard
2. **Navigate to**: Site settings → Environment variables
3. **Click "Add a variable"**:
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://fjvltffpcafcbbpwzyml.supabase.co`
   - Save

   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: (the long JWT token above)
   - Save

4. **Trigger a redeploy**:
   - Go to Deploys tab
   - Click "Trigger deploy" → "Clear cache and deploy site"

### GitHub Pages (with GitHub Actions)

If you're using GitHub Actions for deployment, add secrets:

1. **Go to your repository** on GitHub
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Click "New repository secret"**:
   - Name: `VITE_SUPABASE_URL`
   - Secret: `https://fjvltffpcafcbbpwzyml.supabase.co`
   
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Secret: (the JWT token)

4. **Update your workflow** (if needed) to pass these as env vars during build

### Cloudflare Pages

1. **Go to your project** on Cloudflare dashboard
2. **Navigate to**: Settings → Environment variables
3. **Add variables** for Production:
   - Variable name: `VITE_SUPABASE_URL`
   - Value: `https://fjvltffpcafcbbpwzyml.supabase.co`
   
   - Variable name: `VITE_SUPABASE_ANON_KEY`
   - Value: (the JWT token)

4. **Retry deployment** or push a new commit

### Railway / Render / Other Platforms

Most platforms have similar interfaces:

1. Find **Environment Variables** or **Config Vars** section
2. Add the two required variables
3. Trigger a rebuild/redeploy

---

## Local Development Setup

For local development, create a `.env` file in the project root:

```bash
# .env file (DO NOT COMMIT THIS)
VITE_SUPABASE_URL=https://fjvltffpcafcbbpwzyml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdmx0ZmZwY2FmY2JicHd6eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MjUxNTQsImV4cCI6MjA1ODAwMTE1NH0.uuhJLxTJL26r2jfD9Cb5IMKYaScDNsJeHYJue4pfWRk
VITE_GOOGLE_GEMINI_API_KEY=your_api_key_here
```

**Note**: The `.env` file is in `.gitignore` and should NEVER be committed to git.

---

## Verification

After setting environment variables and redeploying:

1. **Open browser console** on your deployed site
2. **You should NOT see**:
   ```
   ⚠️ Using fallback Supabase credentials
   ```

3. **You SHOULD see** normal authentication logs without warnings

4. **Test**: Try logging in - it should work without needing to clear cache

---

## Why This Happens

### The Problem:
- **Vite** (the build tool) replaces `import.meta.env.VITE_*` variables at **build time**
- If env vars aren't set during build, Vite uses the fallback values hardcoded in `supabase.ts`
- Your app then tries to connect to wrong/test Supabase instance
- Auth tokens get mixed up between local and production
- Result: infinite loading, need to clear cache

### The Solution:
- Set env vars in deployment platform
- Rebuild/redeploy to bake them into the production bundle
- App now connects to correct Supabase instance
- Auth works correctly

---

## Build Process

When you set env vars and rebuild:

```bash
# During build, Vite does this replacement:
import.meta.env.VITE_SUPABASE_URL 
  → 'https://fjvltffpcafcbbpwzyml.supabase.co'

# Instead of using the fallback:
import.meta.env.VITE_SUPABASE_URL || 'fallback-url'
  → 'fallback-url' (when env var is not set)
```

---

## Troubleshooting

### Still seeing the warning after setting env vars?

1. **Clear deployment cache**:
   - Most platforms have a "Clear cache and redeploy" option
   - Use this to ensure fresh build

2. **Check variable names**:
   - Must be EXACTLY: `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
   - Must be EXACTLY: `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)
   - Vite only recognizes variables starting with `VITE_`

3. **Check build logs**:
   - Look for env var replacement messages
   - Verify variables are available during build

4. **Verify in browser**:
   - Open DevTools → Console
   - No warning = success!

### App still loading forever?

1. **Clear browser cache and cookies** (one last time)
2. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check browser console** for other errors

### Users still stuck?

After you fix env vars, existing users may have corrupted auth state:

**Solution**: Add a version check and force clear old sessions
- Or: Display a message asking users to clear cache once
- Or: Change the `storageKey` in `supabase.ts` to force new session

---

## Security Notes

### Are these credentials safe to expose?

**Yes**, the Supabase anon key is meant to be public:
- It's called "anon" (anonymous) key for a reason
- It's used in client-side code (browser)
- Row Level Security (RLS) in Supabase protects your data
- The real security is in Supabase RLS policies, not the anon key

### What about the Gemini API key?

**Be careful**:
- If possible, use it through a backend proxy
- Or use API key restrictions in Google Cloud Console
- Limit usage quotas to prevent abuse

---

## Quick Fix Checklist

- [ ] Set `VITE_SUPABASE_URL` in deployment platform
- [ ] Set `VITE_SUPABASE_ANON_KEY` in deployment platform
- [ ] Clear deployment cache
- [ ] Trigger new deployment
- [ ] Wait for build to complete
- [ ] Check browser console on deployed site
- [ ] Verify no "fallback credentials" warning
- [ ] Test login without clearing cache
- [ ] ✅ Done!

---

## Need Help?

If you're still stuck:

1. **Check which platform you're using** for deployment
2. **Look for "Environment Variables" or "Config Vars"** section
3. **Add the two VITE_SUPABASE_* variables**
4. **Rebuild from scratch** (clear cache)
5. **Test in incognito window** to verify fresh session

The fix is simple: **Set the environment variables in your deployment platform and redeploy!**

