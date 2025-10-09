# Netlify Deployment Fix - October 9, 2025

## ✅ Local Works! Now Fix Netlify

Your app works locally after:
- ✅ Rotating JWT keys to ECC format
- ✅ Using new publishable key: `sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT`

Now let's make it work on Netlify!

---

## 🚀 Step-by-Step Netlify Fix

### Step 1: Go to Netlify Dashboard

1. Open: https://app.netlify.com/
2. Click on your site (Turi-Beta)
3. Go to: **Site configuration** → **Environment variables**

### Step 2: Add/Update Environment Variables

Click **"Add a variable"** or edit existing ones:

#### Variable 1:
```
Key:   VITE_SUPABASE_URL
Value: https://fjvltffpcafcbbpwzyml.supabase.co
```

#### Variable 2: ⭐ **THIS IS THE IMPORTANT ONE**
```
Key:   VITE_SUPABASE_PUBLISHABLE_KEY
Value: sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT
```

**IMPORTANT:** 
- Variable name must be **EXACTLY** `VITE_SUPABASE_PUBLISHABLE_KEY` (not `VITE_SUPABASE_ANON_KEY`)
- Copy the key exactly as shown above
- No extra spaces or quotes

### Step 3: Remove Old Variable (If It Exists)

If you see a variable called `VITE_SUPABASE_ANON_KEY`:
- **Delete it** or leave it (doesn't matter, but new one takes priority)

### Step 4: Save Changes

Click **"Save"** after adding both variables

### Step 5: Trigger New Deployment

Two options:

**Option A: Clear Cache and Deploy (Recommended)**
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** dropdown
3. Select **"Clear cache and deploy site"**
4. Wait for build to complete (~2-3 minutes)

**Option B: Push a Small Change**
```bash
git commit --allow-empty -m "Trigger rebuild for new env vars"
git push origin main
```

### Step 6: Verify Deployment

Once deployment is complete:

1. **Open your Netlify URL** in browser
2. **Open Console** (F12)
3. Look for:
   ```
   ✅ Using new Supabase Publishable Key format (October 2025)
   ```
4. **NO warnings** about "fallback" or "legacy"

### Step 7: Test Production

1. Try **logging in** on your Netlify site
2. Try **loading dialogues**
3. Should work exactly like local! 🎉

---

## 📋 Checklist

Before deploying:
- [ ] Added `VITE_SUPABASE_URL` to Netlify
- [ ] Added `VITE_SUPABASE_PUBLISHABLE_KEY` to Netlify (new key!)
- [ ] Variable names are exact (with underscores)
- [ ] Removed or ignored old `VITE_SUPABASE_ANON_KEY`
- [ ] Clicked "Save"

During deployment:
- [ ] Triggered "Clear cache and deploy"
- [ ] Waited for build to complete
- [ ] Build shows "Published" status

After deployment:
- [ ] Opened production URL
- [ ] Checked console for success message
- [ ] Tested login - works! ✅
- [ ] Tested dialogues - load! ✅

---

## 🎯 Visual Guide for Netlify

### Where to Find Environment Variables:

```
Netlify Dashboard
└── Your Site
    └── Site configuration (left sidebar)
        └── Environment variables
            └── [Add a variable] button
```

### What It Should Look Like:

```
┌─────────────────────────────────────────────────────┐
│ Environment variables                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Key: VITE_SUPABASE_URL                             │
│ Value: https://fjvltffpcafcbbpwzyml.supabase.co   │
│                                                     │
│ Key: VITE_SUPABASE_PUBLISHABLE_KEY                 │
│ Value: sb_publishable_1xJsmAztvoDl8Qgz1B9mFg...   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Wrong variable name
```
VITE_SUPABASE_ANON_KEY  ← Old name, don't use
```

### ✅ Correct variable name
```
VITE_SUPABASE_PUBLISHABLE_KEY  ← Use this!
```

### ❌ Forgot to redeploy
After adding env vars, you MUST trigger a new deployment!

### ❌ Browser cache
After deployment, hard refresh your browser: `Ctrl + Shift + R`

---

## 🆘 Troubleshooting

### Issue: Still seeing "fallback" warning in production

**Solution:**
1. Double-check variable name is `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Verify you saved the variables
3. Trigger a NEW deployment (not just restart)
4. Hard refresh browser after deployment

### Issue: Build succeeds but login fails

**Solution:**
1. Check browser console for specific error
2. Verify the key is correct (no typos)
3. Confirm JWT keys are rotated in Supabase (ECC format)

### Issue: 401 Unauthorized errors

**Solution:**
1. The key might be wrong - double-check it matches exactly
2. Make sure JWT keys are rotated in Supabase dashboard
3. Try the Network tab to see what key is being sent

---

## 📊 Summary

**What you did locally (works):**
- ✅ Rotated JWT keys to ECC
- ✅ Set `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT`
- ✅ Tested - login works, dialogues load

**What to do on Netlify (same thing):**
- ✅ Add same variable to Netlify
- ✅ Redeploy
- ✅ Test - should work identically!

---

## 🎉 Expected Result

After following these steps:

**Locally:**
- ✅ Login works
- ✅ Dialogues load
- ✅ Console clean

**Production (Netlify):**
- ✅ Login works
- ✅ Dialogues load
- ✅ Console clean
- ✅ Same experience as local!

---

**Time to complete:** ~5 minutes  
**Difficulty:** Easy - just add env vars and redeploy!

🚀 **Go add those environment variables to Netlify now!**

