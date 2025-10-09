# 🚨 URGENT: Create Your .env File

## After Your Supabase Migration

You just migrated your Supabase JWT to the new asymmetric format. **You need the NEW anon key!**

---

## Step 1: Get Your NEW Anon Key

1. **Go to:** https://supabase.com/dashboard/project/fjvltffpcafcbbpwzyml/settings/api

2. **Look for "Project API keys" section**

3. **Copy the "anon" key** (also called "public" key)
   - After migration, this should be a NEW JWT token
   - Format: `eyJhbGci...` (long string)
   - **DO NOT use the "service_role" or "secret" key!**

---

## Step 2: Create .env File

In your project root folder (same folder as package.json), create a file named `.env`

**Copy this content into the file:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://fjvltffpcafcbbpwzyml.supabase.co
VITE_SUPABASE_ANON_KEY=PASTE_YOUR_NEW_ANON_KEY_HERE

# Optional: Google Gemini
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_key_here
```

**Replace `PASTE_YOUR_NEW_ANON_KEY_HERE` with the actual anon key from Supabase!**

---

## Step 3: Restart the Dev Server

```bash
npm start
```

or

```bash
npm run dev
```

---

## ⚠️ Important Notes

### DO NOT USE These Keys:
- ❌ `sb_secret_5PmAdUpD-qFcsv9uNSKK6Q_jSM0fmse` (This is a SECRET key - server-side only!)
- ❌ Any key starting with `sb_secret_`
- ❌ The old JWT key (it won't work after migration)

### DO USE This Key:
- ✅ The "anon" key from the API settings page
- ✅ Also might be labeled "publishable" or "public"
- ✅ Safe to use in browser/frontend code
- ✅ Starts with `eyJhbGci...` or `sb_publishable_...`

---

## Why This Matters

**Before Migration:** Your old anon JWT key had one format  
**After Migration:** Supabase generated a NEW anon key with asymmetric signing  
**Current Problem:** App is still using the OLD key, which doesn't work anymore

**Solution:** Use the NEW anon key that Supabase created during migration

---

## Quick Visual Guide

In Supabase Dashboard → Settings → API, you'll see something like:

```
📍 Project API keys

anon / public          [Show]  [Copy]
└─ Use this in your frontend (✅ Safe for browser)

service_role          [Show]  [Copy]  
└─ NEVER use in frontend (❌ Secret, server-side only)
```

Click **[Show]** or **[Copy]** next to the **anon** key!

---

## After Creating .env

You should see in console:
- ✅ No more "Using legacy JWT key format" warning
- ✅ "Using new Supabase Publishable Key format" (or similar success message)
- ✅ Login should work!

---

## Still Having Issues?

If login still fails after using the NEW anon key:

1. **Check the Network tab** in browser DevTools
   - Filter by `supabase.co`
   - Look for 401 or 403 errors
   - Check the request headers

2. **Verify the key** in Supabase dashboard
   - Make sure you copied the entire key
   - No extra spaces or line breaks
   - It's the "anon" key, not "service_role"

3. **Check RLS policies** in Supabase
   - Database → Tables → users
   - RLS might need to be disabled or configured

Let me know what you see!

