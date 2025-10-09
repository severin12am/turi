# Netlify Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Environment Variables

Your Netlify deployment **MUST** have these environment variables set:

```
VITE_SUPABASE_URL=https://fjvltffpcafcbbpwzyml.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT
```

**Important Notes:**
- Use `VITE_SUPABASE_PUBLISHABLE_KEY` (NEW format as of October 2025)
- Do NOT use `VITE_SUPABASE_ANON_KEY` anymore
- The `sb_publishable_` key format is required after Supabase's JWT migration

### 2. How to Set Environment Variables in Netlify

1. **Login to Netlify Dashboard**
   - Go to https://app.netlify.com
   - Select your site

2. **Navigate to Site Settings**
   - Click "Site settings" in the top menu
   - Click "Environment variables" in the left sidebar

3. **Add Variables**
   - Click "Add a variable"
   - For each variable:
     - Key: `VITE_SUPABASE_URL`
     - Value: `https://fjvltffpcafcbbpwzyml.supabase.co`
     - Scopes: All scopes (or at least Production)
   - Click "Add" and repeat for `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Verify Variables**
   - You should see both variables listed
   - Make sure they're set for "All scopes" or at least "Production"

### 3. Clear Cache and Redeploy

After setting variables:

1. **Clear Cache**
   - Go to "Deploys" tab
   - Click "Trigger deploy" dropdown
   - Select "Clear cache and deploy site"

2. **Wait for Build**
   - Build should complete in 2-5 minutes
   - Check build logs for errors

3. **Verify Deployment**
   - Visit your site URL
   - Open browser console (F12)
   - Look for: `✅ Using new publishable key format`
   - Should NOT see: `⚠️ Using fallback publishable key`

## 🔍 Verification Checklist

After deployment, test these features:

- [ ] Site loads without errors
- [ ] Login works (try existing account)
- [ ] Signup works (create test account)
- [ ] Dialogues load and display correctly
- [ ] Scenario dialogues work
- [ ] Quiz appears after dialogue
- [ ] Progress saves (check second dialogue unlocks after completing first)
- [ ] No 401 Unauthorized errors in console
- [ ] Environment variable message shows `✅ Using new publishable key format`

## ⚠️ Common Issues

### Issue: "Using fallback publishable key"

**Cause:** Environment variables not set correctly in Netlify

**Fix:**
1. Double-check variable names (exact spelling matters!)
2. Clear cache and redeploy
3. Check build logs for environment variable loading

### Issue: "401 Unauthorized" or "Invalid API key"

**Cause:** Old/wrong API key being used

**Fix:**
1. Verify you're using the NEW `sb_publishable_` key format
2. Check Supabase dashboard that JWT signing is on ECC (not legacy HS256)
3. Ensure you've rotated keys in Supabase (Settings > API > Rotate keys)

### Issue: Dialogues don't load

**Cause:** API key or database access issue

**Fix:**
1. Check browser console for specific errors
2. Verify Supabase RLS policies allow public read access to dialogue tables
3. Test API key in local environment first

### Issue: Progress not saving

**Cause:** RLS policies or database schema issue

**Fix:**
1. Check browser console for `trackCompletedScenarioDialogue` errors
2. Verify `language_levels` table has `scenario_progress` and `scenario_dialogue_progress` columns
3. Check RLS policies allow authenticated users to update their own records
4. Look for detailed error logs with 🔄, ❌, ✅ emojis in console

## 📊 Build Settings

Your `netlify.toml` or build settings should be:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Or in Netlify UI:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: (leave empty unless you have functions)

## 🚀 Quick Deployment Commands

```bash
# For deploying via Netlify CLI (if installed)
netlify deploy --prod

# Or trigger from git push
git add .
git commit -m "Update deployment"
git push origin main  # or your deployment branch
```

## 📝 Environment Variable Template

Copy this and fill in your values:

```bash
# Required for Production
VITE_SUPABASE_URL=https://fjvltffpcafcbbpwzyml.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT

# Optional (for Gemini AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🔒 Security Notes

1. **Never commit `.env` file to git** - it's in `.gitignore` for a reason
2. **Only use publishable keys in frontend** - never use `sb_secret_` keys
3. **Rotate keys if compromised** - use Supabase dashboard to rotate
4. **Check RLS policies** - ensure sensitive data is protected

## 📞 Support

If deployment still fails:
1. Check build logs in Netlify dashboard
2. Test locally first with same environment variables
3. Verify Supabase dashboard shows active project
4. Check Supabase service status page

---

**Last Updated:** October 9, 2025  
**Supabase Version:** Post-JWT Migration (October 2025)  
**Netlify Version:** Current

