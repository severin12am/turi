# Netlify Functions Security Implementation

## Overview

Your Gemini API key is now **completely hidden** from the browser using Netlify Functions. The key is stored securely on the server side and never exposed to users.

## What Was Changed

### 1. Created Netlify Functions (Server-Side Proxies)

Three new serverless functions were created in `netlify/functions/`:

- **`gemini-tts.js`** - Proxies Text-to-Speech API calls
- **`gemini-dialogue.js`** - Proxies AI Dialogue generation
- **`gemini-word-explanation.js`** - Proxies word explanation requests

These functions:
- Run on Netlify's servers (not in the browser)
- Access the API key from `process.env.GOOGLE_GEMINI_API_KEY`
- Forward requests to Google APIs
- Return responses to your frontend

### 2. Updated Frontend Code

Modified `src/services/gemini.ts` to:
- Remove direct Google API calls
- Call Netlify Functions instead (e.g., `/.netlify/functions/gemini-tts`)
- Removed `getGeminiApiKey()` function (no longer needed in frontend)

## Security Benefits

### ✅ Before (INSECURE)
```
Browser → Google API (with key in URL)
❌ API key visible in Network tab
❌ Anyone can steal your key
❌ Key embedded in JavaScript bundle
```

### ✅ After (SECURE)
```
Browser → Netlify Function → Google API (key on server)
✅ API key never leaves the server
✅ Not visible in browser DevTools
✅ Not in your JavaScript files
✅ Protected by Netlify's infrastructure
```

## Environment Variable Setup

### In Netlify Dashboard

**Variable Name:** `GOOGLE_GEMINI_API_KEY`  
**Contains secret values:** ✅ **CHECKED** (critical!)  
**Scopes:** All scopes  
**Value:** Your actual Gemini API key

### Why "Contains secret values" is Important

When checked:
- ✅ Only accessible to server-side code (Netlify Functions)
- ✅ Not embedded in build output
- ✅ Hidden from logs and UI
- ✅ Secure from client-side access

Without it:
- ❌ Key would be publicly visible
- ❌ Defeats the entire purpose

## Deployment

### First Time Setup

1. **Add Environment Variable in Netlify:**
   - Go to Site Settings → Environment Variables
   - Add: `GOOGLE_GEMINI_API_KEY` (with secret checkbox ✅)
   - Paste your API key value

2. **Deploy Your Code:**
   ```bash
   git add .
   git commit -m "Secure Gemini API with Netlify Functions"
   git push
   ```

3. **Netlify will automatically:**
   - Detect the `netlify/functions/` folder
   - Deploy your functions as serverless endpoints
   - Make them available at `/.netlify/functions/[function-name]`

### Cleanup (Optional)

You can now **delete** the old `VITE_GOOGLE_GEMINI_API_KEY` variable if it exists, since it's no longer used.

## How It Works

### Example: TTS Request Flow

1. **User triggers NPC speech**
2. **Frontend calls:** `fetch('/.netlify/functions/gemini-tts', { ... })`
3. **Netlify Function receives request** (runs on server)
4. **Function adds API key** from `process.env.GOOGLE_GEMINI_API_KEY`
5. **Function calls Google:** `fetch('https://texttospeech.googleapis.com/...?key=SECRET_KEY')`
6. **Google returns audio**
7. **Function forwards audio to frontend**
8. **Frontend plays audio**

The key is **never** exposed to the browser at any step!

## Local Development

### For Development on Your Computer

1. **Create `.env` file in project root:**
   ```env
   GOOGLE_GEMINI_API_KEY=your_actual_key_here
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Run local development server:**
   ```bash
   netlify dev
   ```

This will:
- Start your Vite dev server
- Run Netlify Functions locally
- Use your `.env` file for the API key

**Never commit `.env` to git!** (it's already in `.gitignore`)

## Testing

### Verify Security

1. **Deploy to Netlify**
2. **Open your live site**
3. **Open browser DevTools (F12) → Network tab**
4. **Trigger NPC speech or AI dialogue**
5. **Check the requests:**
   - ✅ Should see: `/.netlify/functions/gemini-tts`
   - ✅ No Google API URLs with keys
   - ✅ No API key visible anywhere

### If You See Problems

**API Key Still Visible?**
- Make sure you deleted old `VITE_GOOGLE_GEMINI_API_KEY`
- Clear your browser cache
- Redeploy: `git push --force-with-lease`

**Functions Not Working?**
- Check Netlify Functions logs in dashboard
- Verify `GOOGLE_GEMINI_API_KEY` is set with secret checkbox
- Check function names match (no typos)

## Cost & Performance

### Netlify Functions Free Tier
- **125,000 requests/month** (free)
- **100 hours runtime/month** (free)
- Each TTS/dialogue request = 1 function call

Your current usage should easily fit within free tier.

### Performance
- **Cold start:** ~100-300ms (first request)
- **Warm:** ~10-50ms overhead
- Negligible impact on user experience

## Monitoring

### View Function Logs

1. Go to Netlify Dashboard
2. Select your site
3. Click "Functions" tab
4. Click on a function to see logs
5. Monitor for errors or unusual activity

### What to Watch For

- **High request rates** - potential abuse
- **Error responses** - API key issues
- **Failed requests** - Google API problems

## Security Best Practices

### ✅ Do This
- Keep `GOOGLE_GEMINI_API_KEY` secret
- Use "Contains secret values" checkbox
- Rotate API key periodically
- Monitor function logs
- Set up rate limiting (optional)

### ❌ Don't Do This
- Don't use `VITE_` prefix (makes it public)
- Don't commit `.env` file
- Don't log API key in functions
- Don't disable secret values checkbox

## Troubleshooting

### "Missing GOOGLE_GEMINI_API_KEY"
- Check environment variable is set in Netlify
- Verify variable name exactly matches (case-sensitive)
- Redeploy after adding variable

### "Function returned 500"
- Check function logs in Netlify dashboard
- Verify API key is valid
- Test API key manually with Google APIs

### "CORS error"
- Functions include CORS headers automatically
- If persists, check Netlify build settings

## Future Enhancements

### Optional Improvements

1. **Rate Limiting:**
   - Add request limits per IP/user
   - Prevent API quota abuse

2. **Caching:**
   - Cache TTS audio for common phrases
   - Reduce API calls and costs

3. **Analytics:**
   - Track usage patterns
   - Monitor costs

4. **Error Recovery:**
   - Retry failed requests
   - Fallback mechanisms

## Questions?

This is a standard, secure approach for hiding API keys:
- ✅ Used by thousands of production apps
- ✅ Recommended by Netlify, Vercel, Google
- ✅ Industry best practice
- ✅ No server maintenance needed

Your API key is now completely secure! 🔒

