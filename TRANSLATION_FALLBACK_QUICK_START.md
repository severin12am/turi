# AI Translation Fallback - Quick Start Guide

## What Was Implemented

✅ **Automatic AI translation fallback system** that detects missing translations in Supabase and fills them using Google Gemini AI.

✅ **Zero changes to your workflow** - The system works automatically behind the scenes.

✅ **Smart fallback** - Only translates content that's actually missing, saves API costs.

✅ **Diagnostic tools** - Check which translations are missing and need attention.

## How It Works (Simple Version)

```
User clicks dialogue → App fetches from Supabase → Missing translation detected → AI translates → Complete dialogue shown to user
```

**You only need English dialogues** in your CSV files. The system will translate to any language on-demand!

## Quick Test

### 1. Check Your Database Coverage

```bash
node check-missing-translations.js
```

This shows you which translations are missing.

### 2. Test the Fallback

1. Open your app
2. Select a language that has missing translations (check the output from step 1)
3. Open a dialogue
4. The app will automatically translate missing content using AI
5. Check browser console for logs like:
   ```
   🤖 AI translation requested
   ✅ AI translation successful
   ```

### 3. Monitor API Usage

Check your Netlify Function logs to see when AI translations are triggered:
- Netlify Dashboard → Functions → `gemini-dialogue` → Recent logs

## Files Added/Modified

### New Files:
- ✅ `src/services/translationFallback.ts` - Core fallback service
- ✅ `check-missing-translations.js` - Database coverage checker
- ✅ `AI_TRANSLATION_FALLBACK.md` - Full documentation
- ✅ `TRANSLATION_FALLBACK_QUICK_START.md` - This file

### Modified Files:
- ✅ `src/components/DialogueBox.tsx` - Integrated fallback service

### Your CSV Files (Already There):
- ✅ `src/data/csv/phrases_*.csv` - 30 character dialogue tables
- ✅ `src/data/csv/scenario_*.csv` - 30 scenario tables

## What You Need to Do

### Option 1: Let AI Handle Everything (Easiest)
**Do nothing!** The system will translate on-demand.

**Pros:**
- Zero work required
- Instant support for all languages
- No manual translation needed

**Cons:**
- Small delay when content is accessed first time (~500ms)
- API costs (very minimal: ~$0.0001 per translation)

### Option 2: Pre-Translate Popular Languages (Recommended)
Add translations for your top 5-10 languages in Supabase:

1. Run coverage checker:
   ```bash
   node check-missing-translations.js
   ```

2. Manually add translations for languages with most users:
   - Spanish (`es_text`)
   - French (`fr_text`)
   - German (`de_text`)
   - Chinese (`ch_text`)
   - Japanese (`ja_text`)

3. Let AI handle the rest (less common languages)

**Pros:**
- Fast performance for popular languages
- Lower API costs
- Better user experience

**Cons:**
- Some manual work required
- Still get AI fallback for everything else

### Option 3: Full Translation (Most Work)
Translate everything into all 20 languages manually.

**Pros:**
- No AI calls needed
- Fastest performance
- Full control over translations

**Cons:**
- Massive amount of work
- Hard to maintain
- Not recommended unless you have a translation team

## Cost Estimate

Based on your setup (30 scenarios × 10 dialogues × ~5 steps = **1,500 phrases**):

### If ALL languages missing:
- 20 languages × 1,500 phrases = 30,000 translations
- Cost: ~$3.00 total (one-time)
- Time: ~4 hours to translate all (in background)

### If top 10 languages provided:
- 10 languages × 1,500 phrases = 15,000 translations
- Cost: ~$1.50 total (one-time)
- Most users get instant translations from database
- Rare language pairs use AI fallback

### Per User Impact:
- Average user sees 10-20 dialogues = 50-100 phrases
- If AI needed: $0.005 - $0.01 per user (half a cent!)
- Only first access per phrase triggers AI

## Monitoring

### Check Translation Performance

Browser console logs:
```
🤖 AI translation requested: { sourceLanguage: 'en', targetLanguage: 'ko' }
✅ AI translation successful: { hasTransliteration: true }
```

### Check API Usage

Netlify Functions Dashboard:
- Invocations count
- Execution time
- Error rate

## Troubleshooting

### "No translation showing up"
1. Check browser console for errors
2. Verify Netlify Function is deployed
3. Check API key is set in Netlify environment

### "Translations are slow"
1. Pre-translate popular languages (see Option 2 above)
2. Check network tab for API call times
3. Consider increasing rate limit

### "Wrong translations"
1. Check AI prompt in `translationFallback.ts`
2. Verify English source text is correct
3. Consider using specialized translation for specific terms

## Next Steps

1. **Test it:** Open your app and try different languages
2. **Check coverage:** Run `node check-missing-translations.js`
3. **Decide strategy:** Pick Option 1, 2, or 3 above
4. **Monitor usage:** Watch Netlify logs for first week
5. **Optimize if needed:** Add popular language translations

## Support

- 📖 Full docs: `AI_TRANSLATION_FALLBACK.md`
- 🔍 Check coverage: `node check-missing-translations.js`
- 🐛 Debug: Check browser console + Netlify logs

---

**That's it! Your app now supports automatic translation for 20+ languages with zero manual work! 🎉**

