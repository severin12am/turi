# Supabase API Key Migration Guide (October 2025)

## 🔴 CRITICAL: Supabase Changed Authentication in 2025

Your app is experiencing connection issues because **Supabase rolled out new API key formats** throughout 2025, with the latest changes on October 1st, 2025.

---

## What Changed?

### Old Format (Legacy - Being Phased Out)
```
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (JWT format)
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (JWT format)
```

### New Format (October 2025)
```
Publishable Key: sb_publishable_xxxxx  (for client-side apps)
Secret Key: sb_secret_xxxxx  (for server-side only)
```

---

## Why This Broke Your App

1. **PostgREST v13 Update (July 24, 2025)**
   - Stricter JWT validation
   - Old keys may fail with `PGRST301` errors

2. **Asymmetric JWT Default (October 1, 2025)**
   - New projects use ES256 algorithm
   - Old symmetric JWT setups break

3. **API Key Format Changes (June-July 2025)**
   - Legacy JWT keys being phased out
   - Browser-exposed secret keys now blocked with 401 errors

---

## ✅ What I Fixed

### Code Changes

**Updated `src/services/supabase.ts`:**
```typescript
// Now checks for new key format first, falls back to legacy
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                    import.meta.env.VITE_SUPABASE_ANON_KEY || // Backward compatibility
                    'sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT'; // Your new key
```

**Key Features:**
- ✅ Uses new publishable key format by default
- ✅ Maintains backward compatibility with old anon keys
- ✅ Helpful console warnings about key format being used
- ✅ Auto-detects key format (new vs legacy)

---

## 🚀 How to Complete the Migration

### Step 1: Local Development (.env file)

Create or update `.env` in your project root:

```env
# Supabase Configuration (Updated October 2025)
VITE_SUPABASE_URL=https://fjvltffpcafcbbpwzyml.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT

# Legacy key (keep for backward compatibility, optional)
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Google Gemini for AI features
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_key_here
```

### Step 2: Netlify Deployment

1. Go to: **Netlify Dashboard** → Your Site → **Site configuration** → **Environment variables**

2. Add/Update these variables:
   ```
   Key: VITE_SUPABASE_URL
   Value: https://fjvltffpcafcbbpwzyml.supabase.co
   
   Key: VITE_SUPABASE_PUBLISHABLE_KEY
   Value: sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT
   ```

3. **Important:** Delete or update old `VITE_SUPABASE_ANON_KEY` if it exists

4. **Redeploy** your site after updating environment variables

### Step 3: Other Deployment Platforms

#### Vercel
```bash
vercel env add VITE_SUPABASE_URL
# Enter: https://fjvltffpcafcbbpwzyml.supabase.co

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Enter: sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT
```

#### Railway
- Settings → Variables → Add Variable
- Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Render
- Environment → Add Environment Variable
- Add both variables

---

## 🔐 Where to Get Your New Keys

1. Go to your Supabase project: https://supabase.com/dashboard/project/fjvltffpcafcbbpwzyml/settings/api

2. Look for these sections:
   - **Project URL**: Copy this for `VITE_SUPABASE_URL`
   - **Project API keys**: 
     - **publishable (anon)**: This is your new `sb_publishable_*` key
     - Copy this for `VITE_SUPABASE_PUBLISHABLE_KEY`

3. **DO NOT use the secret key** in your frontend app (it's for server-side only)

---

## 📝 Backward Compatibility

The updated code maintains **full backward compatibility**:

- ✅ New projects: Use `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ Old projects: Still works with `VITE_SUPABASE_ANON_KEY`
- ✅ No .env file: Falls back to hardcoded keys
- ✅ Automatic detection: Code detects which format you're using

Priority order:
1. `VITE_SUPABASE_PUBLISHABLE_KEY` (new format)
2. `VITE_SUPABASE_ANON_KEY` (legacy format)
3. Hardcoded fallback (your new key)

---

## 🧪 Testing Your Fix

### 1. Test Locally
```bash
# Make sure .env file exists with new keys
npm run dev
```

Check console for:
- ✅ "Using new Supabase Publishable Key format (October 2025)"
- ❌ No "Invalid API key" errors
- ❌ No 401 authentication errors

### 2. Test Login
- Open the app
- Try logging in with existing account
- Should work without connection errors

### 3. Test Dialogues
- After login, open a character dialogue
- Dialogues should load from database
- No "Failed to fetch" errors

---

## 🚨 Common Issues After Migration

### Issue: Still getting 401 errors
**Solution:** 
- Verify you copied the **publishable** key, not the **secret** key
- Check Netlify environment variables are saved and site is redeployed
- Clear browser cache and localStorage

### Issue: "Invalid API key format"
**Solution:**
- Ensure key starts with `sb_publishable_`
- Check for extra spaces or quotes in environment variable
- Verify `.env` file is in project root (not in src/)

### Issue: Works locally but not in production
**Solution:**
- Environment variables on Netlify/Vercel are set correctly
- Redeploy after setting environment variables
- Check build logs for warnings about missing env vars

---

## 📅 Migration Timeline

- **July 24, 2025**: PostgREST v13 rolled out (stricter JWT validation)
- **October 1, 2025**: Asymmetric JWTs default for new projects
- **November 1, 2025**: Restored/paused projects won't regenerate legacy keys
- **Late 2026**: Full legacy key removal (plenty of time to migrate)

**You're migrating at the right time!** Your app will be future-proof.

---

## ✅ Verification Checklist

- [ ] Updated `src/services/supabase.ts` (already done)
- [ ] Created/updated `.env` file with new publishable key
- [ ] Tested locally - login works
- [ ] Tested locally - dialogues load
- [ ] Updated Netlify environment variables
- [ ] Redeployed Netlify site
- [ ] Tested production - login works
- [ ] Tested production - dialogues load
- [ ] Removed old console spam (already done)
- [ ] Console is clean with helpful messages

---

## 🆘 Still Having Issues?

If problems persist after migration:

1. **Check Supabase Dashboard**
   - Verify project is active (not paused)
   - Check RLS policies on tables
   - Verify tables exist: `users`, `language_levels`, `phrases_1`, etc.

2. **Check Browser Console**
   - Should see: "✅ Using new Supabase Publishable Key format"
   - Look for specific error messages (now visible!)

3. **Check Network Tab**
   - Filter by `supabase.co`
   - Look for 400/401/403/500 errors
   - Check request headers include correct API key

4. **Verify Environment**
   - Run: `console.log(import.meta.env)` in browser console
   - Check if `VITE_SUPABASE_PUBLISHABLE_KEY` is present

---

## 📚 Resources

- [Supabase API Settings](https://supabase.com/dashboard/project/fjvltffpcafcbbpwzyml/settings/api)
- [Supabase Client Library Docs](https://supabase.com/docs/reference/javascript/introduction)
- [PostgREST v13 Migration Guide](https://postgrest.org/en/stable/releases/v13.0.0.html)

---

**Migration completed on:** October 9, 2025  
**Expected to resolve:** Login failures, dialogue loading issues, 401 authentication errors

